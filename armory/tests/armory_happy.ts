import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../target/types/armory_protocol";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getConfigPda, getVerdictStatus, VerdictStatus, getRandomDomain } from "./utils";

describe("armory_happy", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const admin = provider.wallet;
  const verifier = Keypair.generate();
  const officialPubkey = Keypair.generate().publicKey;
  const domain = getRandomDomain();
  const entityName = "Amazon India";

  const [configPda] = getConfigPda(program.programId);
  const [entityPda] = getEntityPda(domain, program.programId);

  it("1. initialize_config", async () => {
    try {
      await program.methods
        .initializeConfig(verifier.publicKey)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
        } as any)
        .rpc();
    } catch (e: any) {
      // If already initialized, update verifier
      await program.methods
        .updateVerifier(verifier.publicKey)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
        } as any)
        .rpc();
    }

    const config = await program.account.registryConfig.fetch(configPda);
    assert.strictEqual(config.admin.toBase58(), admin.publicKey.toBase58());
    assert.strictEqual(config.verifier.toBase58(), verifier.publicKey.toBase58());
  });

  it("2. register_entity", async () => {
    await program.methods
      .registerEntity(domain, officialPubkey, entityName)
      .accounts({
        entityAuthority: admin.publicKey,
        config: configPda,
        entityRecord: entityPda,
      } as any)
      .rpc();

    const entity = await program.account.entityRecord.fetch(entityPda);
    assert.strictEqual(entity.domain, domain);
    assert.strictEqual(entity.officialPubkey.toBase58(), officialPubkey.toBase58());
    assert.strictEqual(entity.entityName, entityName);
    assert.isFalse(entity.verificationStatus);
    assert.strictEqual(getVerdictStatus(entity), VerdictStatus.Unverified);
  });

  it("3. verify_entity", async () => {
    await program.methods
      .verifyEntity(domain)
      .accounts({
        verifierAuthority: verifier.publicKey,
        config: configPda,
        entityRecord: entityPda,
      } as any)
      .signers([verifier])
      .rpc();

    const entity = await program.account.entityRecord.fetch(entityPda);
    assert.isTrue(entity.verificationStatus);
    assert.strictEqual(entity.verifier.toBase58(), verifier.publicKey.toBase58());
    assert.isNotNull(entity.verifiedAt);
    assert.isTrue(entity.expirationEpoch.toNumber() > 0);
    assert.strictEqual(getVerdictStatus(entity), VerdictStatus.Verified);
  });

  it("4. query_entity", async () => {
    await program.methods
      .queryEntity(domain)
      .accounts({
        entityRecord: entityPda,
      } as any)
      .rpc();
  });
});
