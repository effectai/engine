import {
  Address,
  type Base58EncodedBytes,
  getBase58Codec,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";
import {
  EFFECT_VESTING_PROGRAM_ADDRESS,
  VESTING_ACCOUNT_DISCRIMINATOR,
} from "./@generated/vesting";

export const getActiveVestingAccountsForTokenAccount = async ({
  rpc,
  tokenAccount,
}: {
  rpc: Rpc<SolanaRpcApi>;
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
