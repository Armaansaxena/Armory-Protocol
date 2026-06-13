use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ArmoryError;
use crate::events::EntityVerified;

#[derive(Accounts)]
pub struct VerifyEntity<'info> {
    pub verifier_authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.verifier == verifier_authority.key() @ ArmoryError::UnauthorizedVerifier
    )]
    pub config: Account<'info, RegistryConfig>,

    #[account(
        mut,
        seeds = [ENTITY_SEED, &entity_record.domain_hash],
        bump = entity_record.bump,
        constraint = entity_record.verification_status == false @ ArmoryError::AlreadyVerified
    )]
    pub entity_record: Account<'info, EntityRecord>,
}

pub fn handler(ctx: Context<VerifyEntity>, _domain: String) -> Result<()> {
    let entity = &mut ctx.accounts.entity_record;
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    entity.verification_status = true;
    entity.verified_at = Some(now);
    entity.expiration_epoch = now + EXPIRY_DURATION;
    entity.verifier = ctx.accounts.verifier_authority.key();

    emit!(EntityVerified {
        domain: entity.domain.clone(),
        official_pubkey: entity.official_pubkey,
        expiration_epoch: entity.expiration_epoch,
    });

    Ok(())
}
