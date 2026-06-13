use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = REGISTRY_CONFIG_SIZE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, RegistryConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeConfig>, verifier: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.verifier = verifier;
    config.total_entities = 0;
    config.bump = ctx.bumps.config;

    Ok(())
}
