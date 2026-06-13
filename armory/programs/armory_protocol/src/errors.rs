use anchor_lang::prelude::*;

#[error_code]
pub enum ArmoryError {
    #[msg("An entity record for this domain already exists")]
    EntityAlreadyRegistered,        // 6000

    #[msg("Unauthorized: signer is not the registered verifier")]
    UnauthorizedVerifier,           // 6001

    #[msg("This entity record is already verified")]
    AlreadyVerified,                // 6002

    #[msg("Expiration epoch has not yet passed")]
    ExpireNotReady,                 // 6003

    #[msg("Domain string exceeds maximum length of 64 characters")]
    DomainTooLong,                  // 6004

    #[msg("Entity name exceeds maximum length of 100 characters")]
    EntityNameTooLong,              // 6005

    #[msg("Unauthorized: signer is not the admin")]
    UnauthorizedAdmin,              // 6006

    #[msg("Invalid state for this operation")]
    InvalidState,                   // 6007
}
