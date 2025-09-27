import {
  type Address,
  type Base58EncodedBytes,
  getBase58Codec,
  type RpcMainnet,
  type SolanaRpcApiMainnet,
} from "@solana/kit";
import {
  EFFECT_VESTING_PROGRAM_ADDRESS,
  VESTING_ACCOUNT_DISCRIMINATOR,
} from "./@generated";

export const getActiveVestingAccountsForTokenAccount = async ({
  rpc,
  tokenAccount,
}: {
  rpc: RpcMainnet<SolanaRpcApiMainnet>;
  tokenAccount: Address;
}) => {
  return await rpc
    .getProgramAccounts(EFFECT_VESTING_PROGRAM_ADDRESS, {
      encoding: "base64",
      filters: [
        {
          memcmp: {
            encoding: "base58",
            offset: 0n,
            bytes: getBase58Codec().decode(
              VESTING_ACCOUNT_DISCRIMINATOR,
            ) as unknown as Base58EncodedBytes,
          },
        },
        {
          memcmp: {
            offset: 8n + 32n,
            encoding: "base58",
            bytes: tokenAccount as unknown as Base58EncodedBytes,
          },
        },
      ],
    })
    .send();
};
