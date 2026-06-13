import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../app/frontend/src/idl/armory_protocol";
import { Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getConfigPda, getRandomDomain } from "./utils";

describe("armory_revoke", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const admin = provider.wallet;
  const verifier = Keypair.generate();
  const domain = getRandomDomain();

  const [configPda] = getConfigPda(program.programId);
  const [entityPda] = getEntityPda(domain, program.programId);

  it("register → verify → revoke", async () => {
    try {
        await program.methods.initializeConfig(verifier.publicKey).accounts({ admin: admin.publicKey, config: configPda }).rpc();
    } catch(e) {
        await program.methods.updateVerifier(verifier.publicKey).accounts({ admin: admin.publicKey, config: configPda }).rpc();
    }

    await program.methods
      .registerEntity(domain, Keypair.generate().publicKey, "Revoke Test")
      .accounts({ config: configPda, entityRecord: entityPda }).rpc();

    await program.methods
      .verifyEntity(domain)
      .accounts({ verifierAuthority: verifier.publicKey, config: configPda, entityRecord: entityPda })
      .signers([verifier]).rpc();

    await program.methods
      .revokeEntity(domain)
      .accounts({ verifierAuthority: verifier.publicKey, config: configPda, entityRecord: entityPda })
      .signers([verifier]).rpc();

    const entity = await program.account.entityRecord.fetch(entityPda);
    assert.isFalse(entity.verificationStatus);
    assert.strictEqual(entity.expirationEpoch.toNumber(), 0);
  });
});
