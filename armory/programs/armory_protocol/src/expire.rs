use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ArmoryError;
use crate::events::EntityExpired;

#[derive(Accounts)]
pub struct ExpireEntity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [ENTITY_SEED, &entity_record.domain_hash],
        bump = entity_record.bump,
        constraint = Clock::get()?.unix_timestamp > entity_record.expiration_epoch @ ArmoryError::ExpireNotReady,
        constraint = entity_record.expiration_epoch > 0 @ ArmoryError::ExpireNotReady,
    )]
    pub entity_record: Account<'info, EntityRecord>,
}

pub fn handler(ctx: Context<ExpireEntity>, _domain: String) -> Result<()> {
    let entity = &mut ctx.accounts.entity_record;
    entity.verification_status = false;

    emit!(EntityExpired {
        domain: entity.domain.clone(),
    });

    Ok(())
}
