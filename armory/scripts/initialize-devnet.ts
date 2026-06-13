import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";

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

  console.log("Initializing config...");
  try {
    const tx = await program.methods
      .initializeConfig(verifierKeypair.publicKey)
      .accounts({
        admin: adminKeypair.publicKey,
        config: configPda,
      } as any)
      .rpc();
    console.log("Success! RegistryConfig initialized.");
    console.log(`Config PDA: ${configPda.toBase58()}`);
    console.log(`TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (e: any) {
    console.error("Failed or already initialized:", e.message);
  }
}

main();
