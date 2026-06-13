import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../app/frontend/src/idl/armory_protocol";
import { Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getConfigPda, getRandomDomain } from "./utils";

describe("armory_expire", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const admin = provider.wallet;
  const verifier = Keypair.generate();
  const domain = getRandomDomain();

  const [configPda] = getConfigPda(program.programId);
  const [entityPda] = getEntityPda(domain, program.programId);

  it("register → verify → expire (fail before deadline)", async () => {
    try {
        await program.methods.initializeConfig(verifier.publicKey).accounts({ admin: admin.publicKey, config: configPda }).rpc();
    } catch(e) {
        await program.methods.updateVerifier(verifier.publicKey).accounts({ admin: admin.publicKey, config: configPda }).rpc();
    }

    await program.methods
      .registerEntity(domain, Keypair.generate().publicKey, "Expire Test")
      .accounts({ config: configPda, entityRecord: entityPda }).rpc();

    await program.methods
      .verifyEntity(domain)
      .accounts({ verifierAuthority: verifier.publicKey, config: configPda, entityRecord: entityPda })
      .signers([verifier]).rpc();

    try {
      await program.methods
        .expireEntity(domain)
        .accounts({ entityRecord: entityPda }).rpc();
      assert.fail("Should have failed (too early)");
    } catch (e: any) {
      // Check for error code or name
      const errorMsg = e.toString();
      assert.isTrue(
        errorMsg.includes("TooEarlyToExpire") || errorMsg.includes("6003"),
        `Expected TooEarlyToExpire (6003), got: ${errorMsg}`
      );
    }
  });
});
