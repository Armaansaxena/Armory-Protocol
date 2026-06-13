import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../target/types/armory_protocol";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getVerdictStatus, VerdictStatus, getConfigPda, getRandomDomain } from "./utils";

describe("armory_revoke", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const domain = getRandomDomain();
  const entityName = "Revoke Test";
  const officialPubkey = Keypair.generate().publicKey;
  const verifier = Keypair.generate();

  const [configPda] = getConfigPda(program.programId);
  const [entityPda] = getEntityPda(domain, program.programId);

  it("register → verify → revoke", async () => {
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

    await program.methods
      .revokeEntity(domain)
      .accounts({
        verifierAuthority: verifier.publicKey,
        config: configPda,
        entityRecord: entityPda,
      } as any)
      .signers([verifier])
      .rpc();

    const entity = await program.account.entityRecord.fetch(entityPda);
    assert.isFalse(entity.verificationStatus);
    assert.strictEqual(entity.expirationEpoch.toNumber(), 0);
    assert.isNull(entity.verifiedAt);
    assert.strictEqual(getVerdictStatus(entity), VerdictStatus.Unverified);
  });
});
