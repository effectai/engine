import {
  type Base58EncodedBytes,
  getBase58Codec,
  type RpcMainnet,
  type SolanaRpcApiMainnet,
} from "@solana/kit";
import {
  EFFECT_STAKING_PROGRAM_ADDRESS,
  STAKE_ACCOUNT_DISCRIMINATOR,
} from "./@generated";

export const fetchStakingAccountsByWalletAddress = async ({
  walletAddress,
  rpc,
}: {
  walletAddress: string;
  rpc: RpcMainnet<SolanaRpcApiMainnet>;
}) => {
  return await rpc
    .getProgramAccounts(EFFECT_STAKING_PROGRAM_ADDRESS, {
      encoding: "base64",
      filters: [
        {
          memcmp: {
            encoding: "base58",
            offset: 0n,
            bytes: getBase58Codec().decode(
              STAKE_ACCOUNT_DISCRIMINATOR,
            ) as unknown as Base58EncodedBytes,
          },
        },
        {
          memcmp: {
            offset: 8n + 8n,
            encoding: "base58",
            bytes: walletAddress as unknown as Base58EncodedBytes,
          },
        },
      ],
    })
    .send();
};
