import {
  getInitializeMintInstruction,
  getCreateAssociatedTokenInstructionAsync,
  getMintToCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
  getMintSize,
} from "@solana-program/token";
import { expect } from "vitest";

import { getCreateAccountInstruction } from "@solana-program/system";
import type { Connection } from "solana-kite";
import {
  type Address,
  generateKeyPairSigner,
  type KeyPairSigner,
  lamports,
} from "@solana/kit";
import { executeTransaction } from "@effectai/solana-utils";

export type SetupReturn = {
  mint: Address;
  ata: Address;
};

export const setup = async (
  connection: Connection,
  signer: KeyPairSigner,
): Promise<SetupReturn> => {
  const mint = await generateKeyPairSigner();

  const rent = await connection.rpc
    .getMinimumBalanceForRentExemption(BigInt(getMintSize()))
    .send();

  const createAccountInstruction = getCreateAccountInstruction({
    payer: signer,
    newAccount: mint,
    lamports: lamports(rent),
    space: BigInt(getMintSize()),
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const initializeMintInstruction = getInitializeMintInstruction({
    mint: mint.address,
    decimals: 6,
    mintAuthority: signer.address,
  });

  const ata = await connection.getTokenAccountAddress(
    signer.address,
    mint.address,
  );

  const createAta = await getCreateAssociatedTokenInstructionAsync({
    payer: signer,
    owner: signer.address,
    mint: mint.address,
  });

  const mintToInstruction = getMintToCheckedInstruction({
    decimals: 6,
    mint: mint.address,
    amount: BigInt(1_000_000_000), // 1000 tokens
    token: ata,
    mintAuthority: signer,
  });

  await executeTransaction({
    commitment: "processed",
    rpcSubscriptions: connection.rpcSubscriptions,
    rpc: connection.rpc,
    signer,
    instructions: [
      createAccountInstruction,
      initializeMintInstruction,
      createAta,
      mintToInstruction,
    ],
  });

  return { mint: mint.address, ata };
};

const PROGRAM_ERR_RE = /custom program error: #(\d+)/;
const ANCHOR_ERR_RE = /Error Number:\s*(\d+)/;

function extractProgramErrorCode(e: any): number | null {
  // 1) web3.js style message
  const msg = e?.message ?? "";
  const m = PROGRAM_ERR_RE.exec(msg);
  if (m) return Number(m[1]);

  // 2) Anchor logs (if available)
  const logs: string[] | undefined =
    e?.logs ?? e?.transaction?.meta?.logMessages;
  if (logs && Array.isArray(logs)) {
    const joined = logs.join("\n");
    const a = ANCHOR_ERR_RE.exec(joined);
    if (a) return Number(a[1]);
  }

  return null;
}

export async function expectCustomProgramError(p: Promise<any>, code: number) {
  await expect(p).rejects.toSatisfy(
    (e: any) => extractProgramErrorCode(e) === code,
  );
}
