import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import * as crypto from "crypto";
import { ArmoryProtocol } from "./armory_protocol";

export type VerdictStatus = "Verified" | "Unverified" | "Expired" | "Revoked" | "EcosystemLabel";

export interface VerdictResult {
  status: VerdictStatus;
  data: any | null;
  dexFallback?: any | null;
}

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || import.meta.env.VITE_PROGRAM_ID || "G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX");

export const IDL = {
  "address": "G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX",
  "metadata": {
    "name": "armoryProtocol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Armory Protocol"
  },
  "instructions": [
    {
      "name": "registerEntity",
      "discriminator": [166, 52, 122, 244, 214, 116, 215, 255],
      "accounts": [
        { "name": "entityAuthority", "writable": true, "signer": true },
        { "name": "config", "writable": true },
        { "name": "entityRecord", "writable": true },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "domain", "type": "string" },
        { "name": "officialPubkey", "type": "pubkey" },
        { "name": "entityName", "type": "string" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "entityRecord",
      "discriminator": [41, 136, 163, 81, 5, 100, 78, 143]
    },
    {
      "name": "registryConfig",
      "discriminator": [115, 12, 131, 2, 45, 10, 11, 230]
    }
  ],
  "types": [
    {
      "name": "entityRecord",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "domainHash", "type": { "array": ["u8", 32] } },
          { "name": "officialPubkey", "type": "pubkey" },
          { "name": "verificationStatus", "type": "bool" },
          { "name": "expirationEpoch", "type": "i64" },
          { "name": "registeredAt", "type": "i64" },
          { "name": "verifiedAt", "type": { "option": "i64" } },
          { "name": "verifier", "type": "pubkey" },
          { "name": "bump", "type": "u8" },
          { "name": "domain", "type": "string" },
          { "name": "entityName", "type": "string" }
        ]
      }
    },
    {
      "name": "registryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "admin", "type": "pubkey" },
          { "name": "verifier", "type": "pubkey" },
          { "name": "totalEntities", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
} as unknown as ArmoryProtocol;

export function getDomainHash(domain: string): Buffer {
    const hash = crypto.createHash('sha256');
    hash.update(domain.trim().toLowerCase(), "utf8");
    return hash.digest();
}

export function getVerdictStatus(record: any): VerdictStatus {
  if (!record) return "Unverified";
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = record.expirationEpoch.toNumber();
  
  if (record.verificationStatus && now < expiry) {
    return "Verified";
  }
  if (!record.verificationStatus && expiry === 0) {
    return "Unverified";
  }
  if (!record.verificationStatus && expiry > 0 && now > expiry) {
    return "Expired";
  }
  return "Unverified";
}

export async function queryByDomain(domain: string, program: Program<ArmoryProtocol>): Promise<VerdictResult> {
  const domainHash = getDomainHash(domain);
  const [entityPda] = PublicKey.findProgramAddressSync([Buffer.from("entity"), domainHash], PROGRAM_ID);
  try {
    const record = await program.account.entityRecord.fetch(entityPda);
    return { status: getVerdictStatus(record), data: record };
  } catch (err: any) {
    if (err.message?.includes("Account does not exist") || err.message?.includes("Could not find")) {
      return { status: "Unverified", data: null };
    }
    throw err;
  }
}

export async function queryByAddress(address: string, program: Program<ArmoryProtocol>, connection: Connection): Promise<VerdictResult> {
  let searchPubkey: PublicKey;
  try {
    searchPubkey = new PublicKey(address);
  } catch {
    throw new Error("Invalid wallet address format");
  }

  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ memcmp: { offset: 40, bytes: searchPubkey.toBase58() } }],
  });

  if (accounts.length > 0) {
    const record = program.coder.accounts.decode("EntityRecord", accounts[0].account.data);
    return { status: getVerdictStatus(record), data: record };
  }

  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    if (res.ok) {
        const json = await res.json();
        const solanaPair = (json.pairs || []).find((p: any) => p.chainId === 'solana');
        if (solanaPair) {
            return {
              status: "EcosystemLabel",
              data: null,
              dexFallback: {
                name: solanaPair.baseToken.address === address ? solanaPair.baseToken.name : solanaPair.quoteToken.name,
                symbol: solanaPair.baseToken.address === address ? solanaPair.baseToken.symbol : solanaPair.quoteToken.symbol,
                logo: solanaPair.info?.imageUrl
              }
            };
        }
    }
  } catch (e) {}

  return { status: "Unverified", data: null };
}

export async function getTotalEntities(program: Program<ArmoryProtocol>): Promise<number> {
  try {
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
    const config = await program.account.registryConfig.fetch(configPda);
    return config.totalEntities.toNumber();
  } catch {
    return 0;
  }
}

export function decodeEntityRecord(data: Buffer, program: Program<ArmoryProtocol>) {
  return program.coder.accounts.decode("EntityRecord", data);
}
