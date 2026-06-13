use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ArmoryError;
use crate::events::EntityRegistered;
use sha2::{Sha256, Digest};

#[derive(Accounts)]
#[instruction(domain: String)]
pub struct RegisterEntity<'info> {
    #[account(mut)]
    pub entity_authority: Signer<'info>,

    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, RegistryConfig>,

    #[account(
        init,
        payer = entity_authority,
        space = ENTITY_RECORD_SIZE,
        seeds = [ENTITY_SEED, &{
            let mut hasher = Sha256::new();
            hasher.update(domain.as_bytes());
            let hash: [u8; 32] = hasher.finalize().into();
            hash
        }],
        bump
    )]
    pub entity_record: Account<'info, EntityRecord>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterEntity>,
    domain: String,
    official_pubkey: Pubkey,
    entity_name: String,
) -> Result<()> {
    require!(domain.len() <= MAX_DOMAIN_LEN, ArmoryError::DomainTooLong);
    require!(entity_name.len() <= MAX_NAME_LEN, ArmoryError::EntityNameTooLong);

    let entity = &mut ctx.accounts.entity_record;
    let config = &mut ctx.accounts.config;

    let mut hasher = Sha256::new();
    hasher.update(domain.as_bytes());
    let domain_hash: [u8; 32] = hasher.finalize().into();

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    entity.domain = domain.clone();
    entity.domain_hash = domain_hash;
    entity.official_pubkey = official_pubkey;
    entity.entity_name = entity_name;
    entity.verification_status = false;
    entity.registered_at = now;
    entity.verified_at = None;
    entity.expiration_epoch = 0;
    entity.bump = ctx.bumps.entity_record;

    config.total_entities += 1;

    emit!(EntityRegistered {
        domain,
        official_pubkey,
        registered_at: now,
    });

    Ok(())
}
