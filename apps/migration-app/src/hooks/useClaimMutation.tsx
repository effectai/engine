import {
  fetchStakingAccountsByWalletAddress,
  getStakeInstructionAsync,
} from "@effectai/stake";
import {
  type Address,
  type TransactionSigner,
  generateKeyPairSigner,
  address as toAddress,
} from "@solana/kit";
import { useMutation } from "@tanstack/react-query";
import type { Connection } from "solana-kite";
import { useProfileContext } from "@effectai/react";
import { getClaimStakeInstructionAsync } from "@effectai/migration";
import {
  executeTransaction,
  maybeCreateAssociatedTokenAccountInstructions,
} from "@effectai/solana-utils";

export const useClaimMutation = () => {
  const { mint } = useProfileContext();

  return useMutation({
    mutationKey: ["claim-migration"],
    mutationFn: async (args: {
      connection: Connection;
      migrationAccount: Address;
      signer: TransactionSigner;
      address: Address;
      signature: Uint8Array;
      message: Uint8Array;
    }) => {
      let stakeAccountToUse = null;
      const {
        connection,
        signer,
        address,
        signature,
        message,
        migrationAccount,
      } = args;

      //get stake accounts, if there is none, create one.
      const [stakeAccount] = await fetchStakingAccountsByWalletAddress({
        walletAddress: address,
        rpc: connection.rpc,
      });

      const instructions = [];

      const userTokenAccount = await connection.getTokenAccountAddress(
        address,
        mint,
      );

      const createAtaIx = await maybeCreateAssociatedTokenAccountInstructions({
        rpc: connection.rpc,
        tokenAddress: userTokenAccount,
        signer,
        owner: toAddress(address),
        mint,
      });
      instructions.push(...createAtaIx);

      if (!stakeAccount) {
        const newStakeAccount = await generateKeyPairSigner();
        stakeAccountToUse = newStakeAccount.address;

        const stakeIx = await getStakeInstructionAsync({
          mint,
          amount: 0,
          userTokenAccount,
          duration: 30 * 24 * 60 * 60,
          stakeAccount: newStakeAccount,
          authority: signer,
        });

        instructions.push(stakeIx);
      } else {
        stakeAccountToUse = stakeAccount.pubkey;
      }

      const claimIx = await getClaimStakeInstructionAsync({
        mint,
        recipientTokenAccount: userTokenAccount,
        signature,
        stakeAccount: stakeAccountToUse,
        message,
        authority: signer,
        migrationAccount,
      });

      return await executeTransaction({
        rpc: connection.rpc,
        rpcSubscriptions: connection.rpcSubscriptions,
        signer,
        instructions: [...instructions, claimIx],
        commitment: "confirmed",
      });
    },
  });
};
