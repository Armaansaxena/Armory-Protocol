use anchor_lang::prelude::*;

#[account]
pub struct RegistryConfig {
    pub admin: Pubkey,          // can call update_verifier
    pub verifier: Pubkey,       // can call verify_entity + revoke_entity
    pub total_entities: u64,    // incremented on every register_entity
    pub bump: u8,
}
