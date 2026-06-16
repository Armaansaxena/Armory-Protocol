import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import { createHash } from "crypto";
import axios from "axios";
import * as fs from "fs";
import { ArmoryProtocol } from "./frontend/src/idl/armory_protocol";

const COMMAND = process.argv[2];

// ── Secure Keypair Loader ───────────────────────────────
function loadVerifierKeypair(): Keypair {
    // 1. Check for raw private key in environment (Best for Cloud/Railway)
    const rawKey = process.env.VERIFIER_PRIVATE_KEY;
    if (rawKey) {
        try {
            console.log("Loading verifier key from VERIFIER_PRIVATE_KEY env var...");
            return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(rawKey)));
        } catch (e) {
            console.error("Failed to parse VERIFIER_PRIVATE_KEY env var");
        }
    }

    // 2. Fallback to file path (Best for local dev)
    const keyPath = process.env.VERIFIER_KEYPAIR_PATH;
    if (keyPath && fs.existsSync(keyPath)) {
        try {
            console.log(`Loading verifier key from file: ${keyPath}`);
            return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keyPath, "utf-8"))));
        } catch (e) {
            console.error(`Failed to read keypair file at ${keyPath}`);
        }
    }

    console.error("FATAL: No verifier key found. Set VERIFIER_PRIVATE_KEY or VERIFIER_KEYPAIR_PATH");
    process.exit(1);
}

async function main() {
  const verifierKeypair = loadVerifierKeypair();
  const connection = new Connection(process.env.RPC_URL || "https://api.devnet.solana.com", "confirmed");
  
  const wallet = new anchor.Wallet(verifierKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
  anchor.setProvider(provider);

  const idlPath = "./frontend/src/idl/armory_protocol.json";
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, provider) as Program<ArmoryProtocol>;

  if (COMMAND === "--autonomous") {
    console.log(`[${new Date().toISOString()}] 🛡️ ARMORY ORACLE: Running in Autonomous Mode`);
    console.log(`[${new Date().toISOString()}] Listening for registration events on Devnet...`);

    program.addEventListener("EntityRegistered", async (event, slot) => {
        const domain = event.domain;
        console.log(`[${new Date().toISOString()}] New Registration: ${domain} (Slot: ${slot})`);
        await verifyDomain(program, domain, verifierKeypair.publicKey);
    });

    await new Promise(() => {}); 
  } else if (COMMAND) {
    await verifyDomain(program, COMMAND, verifierKeypair.publicKey);
  } else {
      console.error("Usage: npx ts-node worker.ts [--autonomous | domain]");
      process.exit(1);
  }
}

async function verifyDomain(program: Program<ArmoryProtocol>, domain: string, verifierPubkey: PublicKey) {
  const cleanDomain = domain.toLowerCase().trim();
  console.log(`[${new Date().toISOString()}] Starting Verification: ${cleanDomain}`);

  try {
    const domainHash = createHash("sha256").update(cleanDomain).digest();
    const [entityPda] = PublicKey.findProgramAddressSync([Buffer.from("entity"), domainHash], program.programId);

    const entity = await program.account.entityRecord.fetch(entityPda);
    if (entity.verificationStatus) {
      console.log(`[${new Date().toISOString()}] ${cleanDomain} already verified.`);
      return;
    }

    const url = `https://${cleanDomain}/.well-known/solana-wallet.json`;
    const response = await axios.get(url, { timeout: 10000 });
    const proofAddress = response.data["solana-address"];

    if (proofAddress !== entity.officialPubkey.toBase58()) {
      console.error(`[${new Date().toISOString()}] SECURITY ALERT: Pubkey mismatch for ${cleanDomain}`);
      return;
    }

    const tx = await program.methods
      .verifyEntity(cleanDomain)
      .accounts({
        verifierAuthority: verifierPubkey,
        entityRecord: entityPda,
      } as any)
      .rpc();

    console.log(`[${new Date().toISOString()}] ✅ VERIFIED ${cleanDomain}! TX: ${tx}`);
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] ❌ Failed: ${cleanDomain} - ${e.message}`);
  }
}

main();
