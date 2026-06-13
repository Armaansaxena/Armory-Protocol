import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../app/frontend/src/idl/armory_protocol";
import { Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getConfigPda, getRandomDomain, getVerdictStatus, VerdictStatus } from "./utils";

describe("armory_unverified", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const [configPda] = getConfigPda(program.programId);
  const domain = getRandomDomain();
  const [entityPda] = getEntityPda(domain, program.programId);

  it("register → query (Unverified)", async () => {
    await program.methods
      .registerEntity(domain, Keypair.generate().publicKey, "Unverified Test")
      .accounts({ config: configPda, entityRecord: entityPda }).rpc();

    const entity = await program.account.entityRecord.fetch(entityPda);
    assert.strictEqual(getVerdictStatus(entity), VerdictStatus.Unverified);
  });
});
