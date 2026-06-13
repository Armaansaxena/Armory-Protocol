import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../target/types/armory_protocol";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getVerdictStatus, VerdictStatus, getConfigPda, getRandomDomain } from "./utils";

describe("armory_expire", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const domain = getRandomDomain();
  const entityName = "Expire Test";
  const officialPubkey = Keypair.generate().publicKey;
  const verifier = Keypair.generate();

  const [configPda] = getConfigPda(program.programId);
  const [entityPda] = getEntityPda(domain, program.programId);

  it("register → verify → expire (fail before deadline)", async () => {
    try {
      await program.methods.initializeConfig(verifier.publicKey).accounts({
        config: configPda,
        admin: provider.wallet.publicKey,
      } as any).rpc();
    } catch (e) {
      await program.methods.updateVerifier(verifier.publicKey).accounts({
        config: configPda,
        admin: provider.wallet.publicKey,
      } as any).rpc();
    }

    await program.methods
      .registerEntity(domain, officialPubkey, entityName)
      .accounts({
        config: configPda,
        entityRecord: entityPda,
      } as any)
      .rpc();

    await program.methods
      .verifyEntity(domain)
      .accounts({
        verifierAuthority: verifier.publicKey,
        config: configPda,
        entityRecord: entityPda,
      } as any)
      .signers([verifier])
      .rpc();

    try {
      await program.methods.expireEntity(domain).accounts({
        entityRecord: entityPda,
      } as any).rpc();
      assert.fail("Should have failed with ExpireNotReady");
    } catch (e: any) {
      assert.include(e.message, "ExpireNotReady");
    }
  });
});
