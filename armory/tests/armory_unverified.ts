import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArmoryProtocol } from "../target/types/armory_protocol";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { getEntityPda, getConfigPda, getVerdictStatus, VerdictStatus, getRandomDomain } from "./utils";

describe("armory_unverified", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArmoryProtocol as Program<ArmoryProtocol>;
  const domain = getRandomDomain();
  const entityName = "New Shop";
  const officialPubkey = Keypair.generate().publicKey;

  const [configPda] = getConfigPda(program.programId);
  const [entityPda] = getEntityPda(domain, program.programId);

  it("register → query (Unverified)", async () => {
    await program.methods
      .registerEntity(domain, officialPubkey, entityName)
      .accounts({
        entityAuthority: provider.wallet.publicKey,
        config: configPda,
        entityRecord: entityPda,
      } as any)
      .rpc();

    const entity = await program.account.entityRecord.fetch(entityPda);
    assert.isFalse(entity.verificationStatus);
    assert.strictEqual(entity.expirationEpoch.toNumber(), 0);
    assert.strictEqual(getVerdictStatus(entity), VerdictStatus.Unverified);
  });
});
