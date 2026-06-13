import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import { createHash } from "crypto";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  const adminKeypairPath = `${os.homedir()}/.config/solana/id.json`;
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(adminKeypairPath, "utf-8")))
  );
  
  const verifierKeypairPath = process.env.VERIFIER_KEYPAIR_PATH;
  let verifierKeypair = adminKeypair;
  if (verifierKeypairPath && fs.existsSync(verifierKeypairPath)) {
    verifierKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(verifierKeypairPath, "utf-8")))
    );
  }

  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  const idlPath = "./target/idl/armory_protocol.json";
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, provider);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const entities = [
    { domain: "demo.armory.dev", pubkey: adminKeypair.publicKey, name: "Armory Protocol Demo" },
    { domain: "testmerchant.in", pubkey: Keypair.generate().publicKey, name: "Test Merchant India" },
    { domain: "solpay.demo", pubkey: Keypair.generate().publicKey, name: "SolPay Demo Store" }
  ];

  for (const entity of entities) {
    const domainHash = createHash("sha256").update(entity.domain, "utf8").digest();
    const [entityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("entity"), domainHash],
      program.programId
    );

    console.log(`Registering ${entity.domain}...`);
    try {
      const tx1 = await program.methods
        .registerEntity(entity.domain, entity.pubkey, entity.name)
        .accounts({
          entityAuthority: adminKeypair.publicKey,
          config: configPda,
          entityRecord: entityPda,
        } as any)
        .rpc();
      console.log(`Registered! TX: https://explorer.solana.com/tx/${tx1}?cluster=devnet`);
    } catch(e:any) {
      console.log(`Registration skipped or failed: ${e.message}`);
    }

    console.log(`Verifying ${entity.domain}...`);
    try {
      const tx2 = await program.methods
        .verifyEntity(entity.domain)
        .accounts({
          verifierAuthority: verifierKeypair.publicKey,
          config: configPda,
          entityRecord: entityPda,
        } as any)
        .signers(verifierKeypair === adminKeypair ? [] : [verifierKeypair])
        .rpc();
      console.log(`Verified! PDA: ${entityPda.toBase58()}`);
      console.log(`Explorer: https://explorer.solana.com/address/${entityPda.toBase58()}?cluster=devnet`);
    } catch(e:any) {
      console.log(`Verification failed: ${e.message}`);
    }
  }
}

main();
