import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../app/frontend/src/idl/armory_protocol";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getConfigPda, getRandomDomain } from "./utils";

describe("armory_auth", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const admin = provider.wallet;
  const verifier = Keypair.generate();
  const nonAuthorized = Keypair.generate();
  const domain = getRandomDomain();

  const [configPda] = getConfigPda(program.programId);
  const [entityPda] = getEntityPda(domain, program.programId);

  before(async () => {
    try {
      await program.methods
        .initializeConfig(verifier.publicKey)
        .accounts({ 
          admin: admin.publicKey,
          config: configPda,
        } as any)
        .rpc();
    } catch (e: any) {
      await program.methods
        .updateVerifier(verifier.publicKey)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
        } as any)
        .rpc();
    }
      
    await program.methods
      .registerEntity(domain, Keypair.generate().publicKey, "Auth Test")
      .accounts({
        config: configPda,
        entityRecord: entityPda,
      } as any)
      .rpc();
  });

  it("verify_entity by non-verifier → UnauthorizedVerifier", async () => {
    try {
      await program.methods
        .verifyEntity(domain)
        .accounts({ 
          verifierAuthority: nonAuthorized.publicKey,
          config: configPda,
          entityRecord: entityPda,
        } as any)
        .signers([nonAuthorized])
        .rpc();
      assert.fail("Should have failed");
    } catch (e: any) {
      assert.include(e.message, "UnauthorizedVerifier");
    }
  });

  it("update_verifier by non-admin → UnauthorizedAdmin", async () => {
    try {
      await program.methods
        .updateVerifier(Keypair.generate().publicKey)
        .accounts({ 
          admin: nonAuthorized.publicKey,
          config: configPda,
        } as any)
        .signers([nonAuthorized])
        .rpc();
      assert.fail("Should have failed");
    } catch (e: any) {
      assert.include(e.message, "UnauthorizedAdmin");
    }
  });

  it("revoke_entity by non-verifier → UnauthorizedVerifier", async () => {
    try {
      await program.methods
        .revokeEntity(domain)
        .accounts({ 
          verifierAuthority: nonAuthorized.publicKey,
          config: configPda,
          entityRecord: entityPda,
        } as any)
        .signers([nonAuthorized])
        .rpc();
      assert.fail("Should have failed");
    } catch (e: any) {
      assert.include(e.message, "UnauthorizedVerifier");
    }
  });

  it("register then immediately try to verify as wrong keypair", async () => {
    const newDomain = getRandomDomain();
    const [newEntityPda] = getEntityPda(newDomain, program.programId);
    
    await program.methods
      .registerEntity(newDomain, Keypair.generate().publicKey, "Wrong Auth")
      .accounts({
        config: configPda,
        entityRecord: newEntityPda,
      } as any)
      .rpc();

    try {
      await program.methods
        .verifyEntity(newDomain)
        .accounts({
          verifierAuthority: nonAuthorized.publicKey,
          config: configPda,
          entityRecord: newEntityPda,
        } as any)
        .signers([nonAuthorized])
        .rpc();
      assert.fail("Should have failed");
    } catch (e: any) {
      assert.include(e.message, "UnauthorizedVerifier");
    }
  });

  it("double registration — second attempt returns correct error", async () => {
    const doubleDomain = getRandomDomain();
    const [doublePda] = getEntityPda(doubleDomain, program.programId);
    
    await program.methods
      .registerEntity(doubleDomain, Keypair.generate().publicKey, "Double 1")
      .accounts({
        config: configPda,
        entityRecord: doublePda,
      } as any)
      .rpc();

    try {
      await program.methods
        .registerEntity(doubleDomain, Keypair.generate().publicKey, "Double 2")
        .accounts({
          config: configPda,
          entityRecord: doublePda,
        } as any)
        .rpc();
      assert.fail("Should have failed");
    } catch (e: any) {
      assert.isTrue(e.message.includes("already in use") || e.message.includes("0x0"));
    }
  });
});
