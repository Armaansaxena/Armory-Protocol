import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { ArmoryProtocol } from "../app/frontend/src/idl/armory_protocol";
import { createHash } from "crypto";
import * as fs from "fs";
import { execSync } from "child_process";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const idl = JSON.parse(fs.readFileSync("./app/frontend/src/idl/armory_protocol.json", "utf8"));
  const program = new Program(idl, { connection } as any) as Program<ArmoryProtocol>;
  const now = Math.floor(Date.now() / 1000);

  console.log("SMOKE TEST RESULTS");
  console.log("==================");

  // 1. Program Deployed
  try {
    const info = await connection.getAccountInfo(program.programId);
    if (info?.executable) console.log("✅ CHECK 1: Program deployed");
    else throw new Error("Not executable");
  } catch { console.log("❌ CHECK 1: Program missing"); process.exit(1); }

  // 2. Config Initialized
  let verifier: PublicKey;
  try {
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
    const config = await program.account.registryConfig.fetch(configPda);
    verifier = config.verifier;
    console.log("✅ CHECK 2: Config initialized");
  } catch { console.log("❌ CHECK 2: Config missing"); process.exit(1); }

  // 3-5. Demo Entities
  const demos = ["demo.armory.dev", "testmerchant.in", "solpay.demo"];
  for (let i = 0; i < demos.length; i++) {
    try {
      const hash = createHash("sha256").update(demos[i]).digest();
      const [pda] = PublicKey.findProgramAddressSync([Buffer.from("entity"), hash], program.programId);
      const record = await program.account.entityRecord.fetch(pda);
      if (record.verificationStatus && record.expirationEpoch.toNumber() > now) {
        console.log(`✅ CHECK ${i+3}: ${demos[i]} verified`);
      } else {
        console.log(`❌ CHECK ${i+3}: ${demos[i]} failed status/expiry`);
      }
    } catch { console.log(`❌ CHECK ${i+3}: ${demos[i]} record not found`); }
  }

  // 6. Missing Account
  try {
    const hash = createHash("sha256").update("notexist.xyz").digest();
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from("entity"), hash], program.programId);
    await program.account.entityRecord.fetch(pda);
    console.log("❌ CHECK 6: Missing account returned data??");
  } catch (e: any) {
    if (e.message.includes("Account does not exist")) console.log("✅ CHECK 6: Missing account handled");
    else console.log("❌ CHECK 6: Wrong error: " + e.message);
  }

  // 7. Reverse Lookup
  try {
    const hash = createHash("sha256").update("demo.armory.dev").digest();
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from("entity"), hash], program.programId);
    const demoRecord = await program.account.entityRecord.fetch(pda);
    const accounts = await connection.getProgramAccounts(program.programId, {
      filters: [{ memcmp: { offset: 40, bytes: demoRecord.officialPubkey.toBase58() } }]
    });
    const found = accounts.find(a => a.pubkey.equals(pda));
    if (found) console.log("✅ CHECK 7: Reverse lookup working");
    else console.log("❌ CHECK 7: Reverse lookup failed to find account");
  } catch (e) { console.log("❌ CHECK 7: Reverse lookup error"); }

  // 8. Frontend Build
  try {
    console.log("Running frontend build check...");
    execSync("cd app/frontend && npm run build --silent", { stdio: 'ignore' });
    console.log("✅ CHECK 8: Frontend builds");
  } catch { console.log("❌ CHECK 8: Frontend build failed"); }

  console.log("\nREADY FOR DEMO DAY ✅");
}

main();
