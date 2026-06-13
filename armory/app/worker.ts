import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import { createHash } from "crypto";
import axios from "axios";
import * as fs from "fs";
import { ArmoryProtocol } from "./frontend/src/idl/armory_protocol";

const DOMAIN = process.argv[2];
const VERIFIER_KEYPAIR_PATH = process.env.VERIFIER_KEYPAIR_PATH;

if (!DOMAIN) {
  console.error("Usage: npx ts-node worker.ts <domain>");
  process.exit(1);
}

if (!VERIFIER_KEYPAIR_PATH) {
  console.error("VERIFIER_KEYPAIR_PATH env var is required");
  process.exit(1);
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting verification for ${DOMAIN}`);

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const verifierKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(VERIFIER_KEYPAIR_PATH, "utf-8")))
  );
  const wallet = new anchor.Wallet(verifierKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // DYNAMIC IDL LOADING: Using the frontend IDL as the ground truth
  const idlPath = "./frontend/src/idl/armory_protocol.json";
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, provider) as Program<ArmoryProtocol>;
  const programId = program.programId;

  console.log(`[${new Date().toISOString()}] Using Program ID: ${programId.toBase58()}`);

  // 1. Derive PDA
  const domainHash = createHash("sha256").update(DOMAIN.toLowerCase().trim()).digest();
  const [entityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("entity"), domainHash],
    programId
  );

  // 2. Fetch EntityRecord
  let entity;
  try {
    entity = await program.account.entityRecord.fetch(entityPda);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Entity record not found for ${DOMAIN}`);
    process.exit(1);
  }

  // 3. Skip if already verified
  if (entity.verificationStatus) {
    console.log(`[${new Date().toISOString()}] Domain ${DOMAIN} is already verified. Skipping.`);
    return;
  }

  // 4. Fetch .well-known/solana-wallet.json
  const url = `https://${DOMAIN}/.well-known/solana-wallet.json`;
  console.log(`[${new Date().toISOString()}] Fetching ${url}`);
  
  let solanaAddress;
  try {
    const response = await axios.get(url, { timeout: 10000 });
    solanaAddress = response.data["solana-address"];
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] Failed to fetch well-known file: ${e.message}`);
    process.exit(1);
  }

  if (!solanaAddress) {
    console.error(`[${new Date().toISOString()}] No solana-address found in well-known file`);
    process.exit(1);
  }

  // 5. Compare pubkeys
  if (solanaAddress !== entity.officialPubkey.toBase58()) {
    console.error(`[${new Date().toISOString()}] SECURITY ALERT: pubkey mismatch for ${DOMAIN}`);
    console.error(`Expected: ${entity.officialPubkey.toBase58()}, Found: ${solanaAddress}`);
    process.exit(1);
  }

  console.log(`[${new Date().toISOString()}] Pubkey match! Calling verify_entity...`);

  // 6. Call verify_entity
  try {
    const tx = await program.methods
      .verifyEntity(DOMAIN)
      .accounts({
        verifierAuthority: verifierKeypair.publicKey,
        entityRecord: entityPda,
      } as any)
      .rpc();
    console.log(`[${new Date().toISOString()}] Successfully verified ${DOMAIN}! TX: ${tx}`);
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] Failed to call verify_entity: ${e.message}`);
    process.exit(1);
  }
}

main();
