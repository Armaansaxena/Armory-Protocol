import { BN } from "@coral-xyz/anchor";

export type VerdictStatus = 
  "Verified" | "Unverified" | "Expired" | "Revoked";

export interface EntityRecord {
  domain: string;
  domainHash: number[];
  officialPubkey: string;
  entityName: string;
  verificationStatus: boolean;
  verifier: string;
  registeredAt: BN;
  verifiedAt: BN | null;
  expirationEpoch: BN;
  bump: number;
}

export function getVerdictStatus(
  record: EntityRecord | null
): VerdictStatus {
  if (!record) return "Unverified";
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = record.expirationEpoch.toNumber();
  
  if (record.verificationStatus && now < expiry) {
    return "Verified";
  }
  if (!record.verificationStatus && expiry === 0) {
    return "Unverified";
  }
  if (!record.verificationStatus && expiry > 0 
      && now > expiry) {
    return "Expired";
  }
  return "Unverified";
}

export function formatExpiry(epoch: BN): string {
  const date = new Date(epoch.toNumber() * 1000);
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

export function truncateAddress(address: string): string {
  if (address.length < 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}
