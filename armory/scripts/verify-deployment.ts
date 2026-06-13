import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { ArmoryProtocol } from "../target/types/armory_protocol";
import { createHash } from "crypto";
import * as fs from "fs";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const idl = JSON.parse(fs.readFileSync("./target/idl/armory_protocol.json", "utf8"));
  const program = new Program(idl, { connection } as any) as Program<ArmoryProtocol>;

  console.log("══════════════════════════════════════════");
  console.log("ARMORY PROTOCOL — DEVNET DEPLOYMENT REPORT");
  console.log("══════════════════════════════════════════\n");

  console.log(`Program ID: ${program.programId.toBase58()}`);
  console.log("Network: Solana Devnet");
  console.log(`Explorer: https://explorer.solana.com/address/${program.programId.toBase58()}?cluster=devnet\n`);

  // 1. Check Config
  try {
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
    const config = await program.account.registryConfig.fetch(configPda);
    console.log("RegistryConfig:");
    console.log(`  PDA: ${configPda.toBase58()}`);
    console.log(`  Admin: ${config.admin.toBase58()}`);
    console.log(`  Verifier: ${config.verifier.toBase58()}`);
    console.log(`  Total Entities: ${config.totalEntities.toString()}\n`);
  } catch (e) {
    console.error("❌ RegistryConfig not initialized on Devnet!");
  }

  // 2. Check Demo Entities
  const demos = ["demo.armory.dev", "testmerchant.in", "solpay.demo"];
  console.log("Demo Entities:");
  for (let i = 0; i < demos.length; i++) {
    const domain = demos[i];
    const hash = createHash("sha256").update(domain).digest();
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from("entity"), hash], program.programId);
    
    try {
      const record = await program.account.entityRecord.fetch(pda);
      const status = record.verificationStatus ? "VERIFIED ✅" : "UNVERIFIED ⚠️";
      const expiry = new Date(record.expirationEpoch.toNumber() * 1000).toLocaleDateString();
      
      console.log(`  ${i+1}. ${domain}`);
      console.log(`     PDA: ${pda.toBase58()}`);
      console.log(`     Status: ${status}`);
      console.log(`     Expires: ${expiry}`);
      if (i === 0) console.log(`     Explorer: https://explorer.solana.com/address/${pda.toBase58()}?cluster=devnet`);
      console.log("");
    } catch (e) {
      console.log(`  ${i+1}. ${domain} - NOT REGISTERED ❌`);
    }
  }

  console.log("══════════════════════════════════════════");
  console.log("ALL CHECKS PROCESSED.");
  console.log("══════════════════════════════════════════");
}

main();
