use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod state;

pub mod initialize;
pub mod register;
pub mod verify;
pub mod query;
pub mod expire;
pub mod revoke;
pub mod update_verifier;

use initialize::*;
use register::*;
use verify::*;
use query::*;
use expire::*;
use revoke::*;
use update_verifier::*;

declare_id!("G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX");

#[program]
pub mod armory_protocol {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, verifier: Pubkey) -> Result<()> {
        initialize::handler(ctx, verifier)
    }

    pub fn register_entity(
        ctx: Context<RegisterEntity>,
        domain: String,
        official_pubkey: Pubkey,
        entity_name: String,
    ) -> Result<()> {
        register::handler(ctx, domain, official_pubkey, entity_name)
    }

    pub fn verify_entity(ctx: Context<VerifyEntity>, domain: String) -> Result<()> {
        verify::handler(ctx, domain)
    }

    pub fn query_entity(ctx: Context<QueryEntity>, domain: String) -> Result<()> {
        query::handler(ctx, domain)
    }

    pub fn expire_entity(ctx: Context<ExpireEntity>, domain: String) -> Result<()> {
        expire::handler(ctx, domain)
    }

    pub fn revoke_entity(ctx: Context<RevokeEntity>, domain: String) -> Result<()> {
        revoke::handler(ctx, domain)
    }

    pub fn update_verifier(ctx: Context<UpdateVerifier>, new_verifier: Pubkey) -> Result<()> {
        update_verifier::handler(ctx, new_verifier)
    }
}
