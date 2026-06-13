use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
#[constant]
pub const ENTITY_SEED: &[u8] = b"entity";

pub const MAX_DOMAIN_LEN: usize = 64;
pub const MAX_NAME_LEN: usize = 100;
pub const EXPIRY_DURATION: i64 = 7_776_000; // 90 days in seconds

pub const ENTITY_RECORD_SIZE: usize = 8 + 303;
pub const REGISTRY_CONFIG_SIZE: usize = 8 + 81;
