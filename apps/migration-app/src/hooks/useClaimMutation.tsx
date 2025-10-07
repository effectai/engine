import {
  fetchStakingAccountsByWalletAddress,
  getStakeInstructionAsync,
} from "@effectai/staking";
import {
  type Address,
  type TransactionSigner,
  generateKeyPairSigner,
} from "@solana/kit";
import { getAssociatedTokenAccount } from "@effectai/solana-utils";
import { useMutation } from "@tanstack/react-query";
import type { Connection } from "solana-kite";
import { useProfileContext } from "@effectai/react";
import { getClaimStakeInstructionAsync } from "@effectai/migration";
import { executeTransaction } from "@effectai/solana-utils";
import { getCreateAssociatedTokenInstructionAsync } from "@solana-program/token";

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
        rpc: connection.rpc as any,
      });

      const instructions = [];

      const userTokenAccount = await getAssociatedTokenAccount({
        owner: address,
        mint,
      });

      const isClosed = await connection.checkTokenAccountIsClosed({
        tokenAccount: userTokenAccount,
      });

      if (isClosed) {
        const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
          mint: mint,
          owner: signer.address,
          payer: signer,
        });
        instructions.push(createAtaIx);
      }

      if (!stakeAccount) {
        const newStakeAccount = await generateKeyPairSigner();
        stakeAccountToUse = newStakeAccount.address;

        const stakeIx = await getStakeInstructionAsync({
          scope: mint,
          allowTopup: true,
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
