use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::ArmoryError;

#[derive(Accounts)]
pub struct UpdateVerifier<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.admin == admin.key() @ ArmoryError::UnauthorizedAdmin
    )]
    pub config: Account<'info, RegistryConfig>,
}

pub fn handler(ctx: Context<UpdateVerifier>, new_verifier: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.verifier = new_verifier;

    Ok(())
}
