import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import type { Address, KeyPairSigner } from "@solana/kit";
import { buildClaimRewardsInstruction } from "@effectai/solana-utils";
import {
  fetchReflectionAccount,
  fetchMaybeRewardAccount,
  deriveRewardAccountsPda,
} from "@effectai/reward";

export const useRewardProgram = () => {
  const { connection } = useConnection();
  const { mint } = useEffectConfig();
  const { address: walletAddress, signer } = useWallet();

  const queryClient = useQueryClient();

  const getStakingRewardAccount = (stakingAccount: Ref<Address>) => {
    return useQuery({
      queryKey: ["stakingRewardAccount", stakingAccount],
      queryFn: async () => {
        if (!stakingAccount.value) {
          throw new Error("Staking account is not defined");
        }

        return await fetchMaybeRewardAccount(
          connection.rpc,
          stakingAccount.value,
        );
      },
    });
  };

  const getRewardAccounts = async () => {
    return useQuery({
      queryKey: ["rewardAccounts"],
      queryFn: async () => {
        if (!walletAddress.value) {
          throw new Error("Unable to get wallet address");
        }

        const {
          reflectionAccount,
          intermediaryReflectionVaultAccount,
          reflectionVaultAccount,
        } = await deriveRewardAccountsPda({ mint });

        const reflectionAccountData = await fetchReflectionAccount(
          connection.rpc,
          reflectionAccount,
        );

        //sum balance of vault account + intermediary account
        const accounts = Promise.all(
          [reflectionVaultAccount, intermediaryReflectionVaultAccount].map(
            (account) =>
              connection.getTokenAccountBalance({ tokenAccount: account }),
          ),
        );

        const balance = (await accounts).reduce((acc, curr) => {
          return acc + curr.uiAmount || 0;
        }, 0);

        return {
          reflectionAccount: reflectionAccountData,
          totalBalance: balance,
        };
      },
    });
  };

  const useClaimRewards = () => {
    return useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey.includes("claim");
          },
        });
      },
      mutationFn: async ({
        stakeAccount,
      }: {
        stakeAccount: Address;
      }) => {
        if (!walletAddress.value || !signer.value) {
          throw new Error("Unable to get wallet address or signer");
        }

        const { activeRewardVestingAccount } = useEffectConfig();

        const userTokenAccount = await connection.getTokenAccountAddress(
          walletAddress.value,
          mint,
        );

        const claimRewardsIxs = await buildClaimRewardsInstruction({
          signer: signer.value,
          rpc: connection.rpc,
          vestingAccount: activeRewardVestingAccount,
          stakeAccount: stakeAccount,
          recipientTokenAccount: userTokenAccount,
          mint: mint,
        });

        return await connection.sendTransactionFromInstructions({
          feePayer: signer.value as unknown as KeyPairSigner,
          maximumClientSideRetries: 3,
          instructions: claimRewardsIxs,
        });
      },
    });
  };

  return {
    useClaimRewards,
    getStakingRewardAccount,
    getRewardAccounts,
  };
};
