import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";

export const VerdictStatus = {
  Verified: "Verified",
  Unverified: "Unverified",
  Expired: "Expired",
  Revoked: "Revoked",
} as const;

export type VerdictStatus = typeof VerdictStatus[keyof typeof VerdictStatus];

export function getDomainHash(domain: String): Buffer {
  return createHash("sha256").update(domain as string).digest();
}

export function getEntityPda(domain: string, programId: PublicKey): [PublicKey, number] {
  const domainHash = getDomainHash(domain);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("entity"), domainHash],
    programId
  );
}

export function getRandomDomain(): string {
    return `test-${Math.random().toString(36).substring(7)}.com`;
}

export function getConfigPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );
}

export function getVerdictStatus(record: any | null): VerdictStatus {
  if (!record) return VerdictStatus.Unverified;
  const now = Math.floor(Date.now() / 1000);
  
  if (record.verificationStatus && now < record.expirationEpoch.toNumber()) {
    return VerdictStatus.Verified;
  }
  
  if (!record.verificationStatus && record.expirationEpoch.toNumber() === 0) {
    // If it was once verified but expiration is 0, it means it was revoked
    // The prompt says: "Revoked special state: verification_status=false + revoked flag" 
    // but the logic in revoke_entity sets expiration_epoch = 0 and verified_at = None.
    // Unverified also has expiration_epoch = 0.
    // Let's refine based on registeredAt vs verifiedAt if needed, or just follow the prompt's logic.
    // Prompt Section 9 Logic:
    // if status==false && expiration_epoch==0 -> Unverified
    // if status==false && expiration_epoch>0 && now>expiration_epoch -> Expired
    // Wait, the revoke logic says: "query shows verification_status=false, expiration_epoch=0"
    // "Assert VerdictStatus == Revoked (expiry=0 + status=false post-verify)"
    // This overlaps with Unverified. Maybe I should check if verifiedAt is None?
    // Unverified: status=false, expiry=0, verifiedAt=None
    // Revoked: status=false, expiry=0, verifiedAt=None
    // Ah, if I want to distinguish Revoked from Unverified, I might need a flag.
    // But the prompt says "VerdictStatus (enum, derived client-side from EntityRecord)".
    // Let's look at Section 9 logic again:
    // if !account_exists -> Unverified
    // if status==true && now < expiration_epoch -> Verified
    // if status==false && expiration_epoch==0 -> Unverified
    // if status==false && expiration_epoch>0 && now>expiration_epoch -> Expired
    // It doesn't mention Revoked in the Section 9 logic list, but Section 7 says "Assert VerdictStatus == Revoked".
    // I'll stick to the Section 9 logic for the frontend, but for tests I'll follow the requirement.
    return VerdictStatus.Unverified; 
  }
  
  if (!record.verificationStatus && record.expirationEpoch.toNumber() > 0) {
    return VerdictStatus.Expired;
  }
  
  return VerdictStatus.Unverified;
}
