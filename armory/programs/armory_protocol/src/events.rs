use anchor_lang::prelude::*;

#[event]
pub struct EntityRegistered {
    pub domain: String,
    pub official_pubkey: Pubkey,
    pub registered_at: i64,
}

#[event]
pub struct EntityVerified {
    pub domain: String,
    pub official_pubkey: Pubkey,
    pub expiration_epoch: i64,
}

#[event]
pub struct EntityExpired {
    pub domain: String,
}

#[event]
pub struct EntityRevoked {
    pub domain: String,
}
