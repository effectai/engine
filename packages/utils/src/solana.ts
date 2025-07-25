import { Connection, Keypair } from "@solana/web3.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import yaml from "yaml";
import {
  createKeyPairSignerFromBytes,
  createSignerFromKeyPair,
  getAddressEncoder,
  getProgramDerivedAddress,
  createSolanaRpc,
  sendAndConfirmTransactionFactory,
  type Address,
  createSolanaRpcSubscriptions,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  pipe,
  createTransactionMessage,
  KeyPairSigner,
  IInstruction,
  signTransactionMessageWithSigners,
} from "@solana/kit";

import * as anchor from "@coral-xyz/anchor";
import { rpc } from "@coral-xyz/anchor/dist/cjs/utils";
import { fileURLToPath } from "node:url";

async function getConfig(): Promise<any> {
  // Path to Solana CLI config file
  const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    ".config",
    "solana",
    "cli",
    "config.yml",
  );
  const configYml = await fs.readFile(CONFIG_FILE_PATH, { encoding: "utf8" });
  return yaml.parse(configYml);
}

export async function getRpcUrl(): Promise<string> {
  try {
    const config = await getConfig();
    if (!config.json_rpc_url) throw new Error("Missing RPC URL");
    return config.json_rpc_url;
  } catch (err) {
    console.warn(
      "Failed to read RPC url from CLI config file, falling back to localhost",
    );
    return "http://localhost:8899";
  }
}

export async function getWebsocketUrl(json_rpc_url: string): Promise<string> {
  try {
    const config = await getConfig();
    if (!config.websocket_url) throw new Error("Missing Websocket URL");
    return config.websocket_url;
  } catch (err) {
    if (json_rpc_url === "http://localhost:8899") {
      return "ws://localhost:8900";
    } else {
      if (json_rpc_url.startsWith("https")) {
        return json_rpc_url.replace("https", "wss");
      } else {
        return json_rpc_url.replace("http", "ws");
      }
    }
  }
}

/**
 * Load and parse the Solana CLI config file to determine which payer to use
 */
export async function getPayer(): Promise<Keypair> {
  try {
    const config = await getConfig();
    if (!config.keypair_path) throw new Error("Missing keypair path");
    return await createKeypairFromFile(config.keypair_path);
  } catch (err) {
    console.warn(
      "Failed to create keypair from CLI config file, falling back to new random keypair",
    );
    return Keypair.generate();
  }
}

/**
 * Create a Keypair from a secret key stored in file as bytes' array
 */
export async function createKeypairFromFile(
  filePath: string,
): Promise<Keypair> {
  const secretKeyString = await fs.readFile(filePath, { encoding: "utf8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

export const loadProvider = async () => {
  const rpcUrl = await getRpcUrl();
  const connection = new Connection(rpcUrl);

  const websocketUrl = await getWebsocketUrl(rpcUrl);

  const payer = await getPayer();
  const wallet = new anchor.Wallet(payer);

  const provider = new anchor.AnchorProvider(connection, wallet);

  const version = await provider.connection.getVersion();

  console.log(`Connected to Solana v${version["solana-core"]}`);

  return {
    rpcUrl,
    websocketUrl,
    payer,
    provider,
  };
};

export const getAssociatedTokenAccount = async ({
  owner,
  mint,
}: {
  owner: Address;
  mint: Address;
}) => {
  const addressEncoder = getAddressEncoder();

  const [pda, _bumpSeed] = await getProgramDerivedAddress({
    programAddress: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address,
    seeds: [
      addressEncoder.encode(owner),
      addressEncoder.encode(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
      ),
      addressEncoder.encode(mint),
    ],
  });

  return pda;
};

export const loadKeypairSigner = async (keypairPath: string) => {
  const secretKeyString = await fs.readFile(keypairPath, { encoding: "utf8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return createKeyPairSignerFromBytes(secretKey);
};

export type SolanaProviderFactory = {
  rpc: ReturnType<typeof createSolanaRpc>;
  sendAndConfirmTransaction: ReturnType<
    typeof sendAndConfirmTransactionFactory
  >;
};

export const createLocalSolanaProvider =
  async (): Promise<SolanaProviderFactory> => {
    const rpc = createSolanaRpc("http://localhost:8899");
    const rpcSubscriptions = createSolanaRpcSubscriptions(
      "ws://localhost:8900",
    );
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });

    return {
      rpc,
      sendAndConfirmTransaction,
    };
  };

export const executeWithSolanaProvider = async ({
  provider,
  signer,
  instructions,
  commitment = "finalized",
}: {
  provider: SolanaProviderFactory;
  signer: KeyPairSigner;
  instructions: IInstruction[];
  commitment?: "processed" | "confirmed" | "finalized";
}) => {
  const recentBlockhash = await provider.rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) =>
      setTransactionMessageLifetimeUsingBlockhash(recentBlockhash.value, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
  );

  const signedTx = await signTransactionMessageWithSigners(transactionMessage);

  await provider.sendAndConfirmTransaction(signedTx, {
    commitment,
  });
};
