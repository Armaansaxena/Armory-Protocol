use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ArmoryError;
use crate::events::EntityRevoked;

#[derive(Accounts)]
pub struct RevokeEntity<'info> {
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
        bump = entity_record.bump
    )]
    pub entity_record: Account<'info, EntityRecord>,
}

pub fn handler(ctx: Context<RevokeEntity>, _domain: String) -> Result<()> {
    let entity = &mut ctx.accounts.entity_record;
    entity.verification_status = false;
    entity.expiration_epoch = 0;
    entity.verified_at = None;

    emit!(EntityRevoked {
        domain: entity.domain.clone(),
    });

    Ok(())
}
