import type { Connection, PublicKey } from "@solana/web3.js";

export const getTokenBalance = async (owner: PublicKey, mint: PublicKey) => {};

export const getSolanaBalance = async (
  owner: PublicKey,
  connection: Connection
) => {
  return connection.getBalance(owner);
};
