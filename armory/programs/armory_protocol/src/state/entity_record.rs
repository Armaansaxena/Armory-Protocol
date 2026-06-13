use anchor_lang::prelude::*;

#[account]
pub struct EntityRecord {
    pub domain_hash: [u8; 32],        // Fixed offset 8
    pub official_pubkey: Pubkey,      // Fixed offset 40
    pub verification_status: bool,    // Fixed offset 72
    pub expiration_epoch: i64,        // Fixed offset 73
    pub registered_at: i64,           // Fixed offset 81
    pub verified_at: Option<i64>,     // Fixed offset 89
    pub verifier: Pubkey,             // Fixed offset 98
    pub bump: u8,                     // Fixed offset 130
    pub domain: String,               // Variable
    pub entity_name: String,          // Variable
}
