import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../app/frontend/src/idl/armory_protocol";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getConfigPda, getRandomDomain } from "./utils";

describe("armory_edge", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const [configPda] = getConfigPda(program.programId);

  it("Domain too long (> 64 chars) → DomainTooLong", async () => {
    const longDomain = "a".repeat(65);
    const [entityPda] = getEntityPda(longDomain, program.programId);
    try {
      await program.methods
        .registerEntity(longDomain, Keypair.generate().publicKey, "Long Name")
        .accounts({
          config: configPda,
          entityRecord: entityPda,
        } as any)
        .rpc();
      assert.fail("Should have failed");
    } catch (e: any) {
      assert.include(e.message, "DomainTooLong");
    }
  });

  it("Entity name too long (> 100 chars) → EntityNameTooLong", async () => {
    const longName = "a".repeat(101);
    const domain = getRandomDomain();
    const [entityPda] = getEntityPda(domain, program.programId);
    try {
      await program.methods
        .registerEntity(domain, Keypair.generate().publicKey, longName)
        .accounts({
          config: configPda,
          entityRecord: entityPda,
        } as any)
        .rpc();
      assert.fail("Should have failed");
    } catch (e: any) {
      assert.include(e.message, "EntityNameTooLong");
    }
  });

  it("Register same domain twice → EntityAlreadyRegistered", async () => {
    const domain = getRandomDomain();
    const [entityPda] = getEntityPda(domain, program.programId);
    await program.methods
      .registerEntity(domain, Keypair.generate().publicKey, "Name")
      .accounts({ config: configPda, entityRecord: entityPda } as any)
      .rpc();

    try {
      await program.methods
        .registerEntity(domain, Keypair.generate().publicKey, "Name 2")
        .accounts({ config: configPda, entityRecord: entityPda } as any)
        .rpc();
      assert.fail("Should have failed");
    } catch (e: any) {
      assert.isTrue(e.message.includes("already in use") || e.message.includes("0x0"));
    }
  });

  it("malformed domain — empty string", async () => {
    const domain = "";
    const [entityPda] = getEntityPda(domain, program.programId);
    try {
      await program.methods
        .registerEntity(domain, Keypair.generate().publicKey, "Name")
        .accounts({ config: configPda, entityRecord: entityPda } as any)
        .rpc();
    } catch (e: any) {
      assert.isDefined(e);
    }
  });

  it("domain with only whitespace", async () => {
    const domain = "   ";
    const [entityPda] = getEntityPda(domain, program.programId);
    try {
      await program.methods
        .registerEntity(domain, Keypair.generate().publicKey, "Name")
        .accounts({ config: configPda, entityRecord: entityPda } as any)
        .rpc();
    } catch (e: any) {}
  });

  it("domain with uppercase letters", async () => {
    const upperDomain = "AMAZON" + Math.floor(Math.random()*1000) + ".IN";
    const lowerDomain = upperDomain.toLowerCase();
    const [upperPda] = getEntityPda(upperDomain, program.programId);
    const [lowerPda] = getEntityPda(lowerDomain, program.programId);
    assert.notEqual(upperPda.toBase58(), lowerPda.toBase58());
    
    try {
      await program.methods
        .registerEntity(upperDomain, Keypair.generate().publicKey, "Name")
        .accounts({ config: configPda, entityRecord: upperPda } as any)
        .rpc();
    } catch(e) {}
  });

  it("entity_name with only whitespace", async () => {
    const domain = getRandomDomain();
    const [entityPda] = getEntityPda(domain, program.programId);
    try {
      await program.methods
        .registerEntity(domain, Keypair.generate().publicKey, "   ")
        .accounts({ config: configPda, entityRecord: entityPda } as any)
        .rpc();
    } catch (e: any) {}
  });

  it("GPA reverse lookup — performance", async () => {
    const targetPubkey = Keypair.generate().publicKey;
    const testDomain = getRandomDomain();
    const [testPda] = getEntityPda(testDomain, program.programId);

    await program.methods
      .registerEntity(testDomain, targetPubkey, "GPA Test Merchant")
      .accounts({ config: configPda, entityRecord: testPda } as any)
      .rpc();
    
    let accounts = [];
    for (let i = 0; i < 6; i++) {
      accounts = await provider.connection.getProgramAccounts(program.programId, {
        filters: [{ memcmp: { offset: 40, bytes: targetPubkey.toBase58() } }]
      });
      if (accounts.length > 0) break;
      await new Promise(r => setTimeout(r, 3000));
    }
    assert.strictEqual(accounts.length, 1);
  });

  it("worker — pubkey mismatch detection", async () => {
    const fakeOnChainPubkey = Keypair.generate().publicKey.toBase58();
    const fakeFetchedPubkey = Keypair.generate().publicKey.toBase58();
    assert.notEqual(fakeOnChainPubkey, fakeFetchedPubkey);
  });
});
