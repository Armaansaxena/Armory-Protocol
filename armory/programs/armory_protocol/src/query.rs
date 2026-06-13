use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct QueryEntity<'info> {
    #[account(
        seeds = [ENTITY_SEED, &entity_record.domain_hash],
        bump = entity_record.bump
    )]
    pub entity_record: Account<'info, EntityRecord>,
}

pub fn handler(_ctx: Context<QueryEntity>, _domain: String) -> Result<()> {
    // Pure read, Anchor handles account loading and validation
    Ok(())
}
