import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

import {
  decodeStakeAccount,
  EFFECT_STAKING_PROGRAM_ADDRESS,
  fetchAllMaybeStakeAccount,
  fetchAllStakeAccount,
  fetchMaybeStakeAccount,
  getStakeAccountCodec,
  getStakeAccountDecoder,
  getStakeAccountEncoder,
  getStakeInstructionAsync,
  getTopupInstructionAsync,
  getUnstakeInstructionAsync,
  STAKE_ACCOUNT_DISCRIMINATOR,
  type StakeAccount,
} from "@effectai/stake";

import {
  deriveRewardAccountsPda,
  deriveStakingRewardAccountPda,
  EFFECT_REWARDS_PROGRAM_ADDRESS,
  fetchMaybeRewardAccount,
  getEnterInstructionAsync,
  getRewardAccountDecoder,
  getSyncInstructionAsync,
  REWARD_ACCOUNT_DISCRIMINATOR,
} from "@effectai/reward";

import {
  assertAccountsExist,
  decodeAccount,
  fetchEncodedAccount,
  generateKeyPairSigner,
  getBase58Codec,
  getBase58Encoder,
  getBase64Codec,
  type Address,
  type Base58EncodedBytes,
  type KeyPairSigner,
} from "@solana/kit";
import { getCreateAssociatedTokenInstructionAsync } from "@solana-program/token";
import {
  buildTopupInstruction,
  buildUnstakeInstruction,
} from "@effectai/solana-utils";

const SECONDS_PER_DAY = 86400;

export function useStakingProgram() {
  const { connection } = useConnection();
  const { mint } = useEffectConfig();
  const { address: walletAddress, signer } = useWallet();

  const queryClient = useQueryClient();

  const useUnstake = () =>
    useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey.includes("stake");
          },
        });
      },
      mutationFn: async ({
        stakeAccount,
        amount,
      }: {
        stakeAccount: Address;
        amount: number;
      }) => {
        if (!signer.value) {
          throw new Error("No signer available");
        }

        const userTokenAccount = await connection.getTokenAccountAddress(
          walletAddress.value,
          mint,
        );

        const unstakeIx = await buildUnstakeInstruction({
          mint,
          stakeAccount,
          signer: signer.value,
          amount: amount * 1_000_000,
          userTokenAccount,
          rpc: connection.rpc,
        });

        return await connection.sendTransactionFromInstructions({
          feePayer: signer.value as unknown as KeyPairSigner,
          maximumClientSideRetries: 3,
          instructions: unstakeIx,
        });
      },
    });

  const useTopup = () =>
    useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey.includes("stake");
          },
        });
      },
      mutationFn: async ({
        stakeAccount,
        amount,
      }: {
        stakeAccount: Address;
        amount: number;
      }) => {
        if (!signer.value) {
          throw new Error("No signer available");
        }

        const userTokenAccount = await connection.getTokenAccountAddress(
          walletAddress.value,
          mint,
        );

        const topupInstructions = await buildTopupInstruction({
          mint,
          stakeAccount,
          amount: amount * 1_000_000,
          userTokenAccount,
          rpc: connection.rpc,
          signer: signer.value,
        });

        return await connection.sendTransactionFromInstructions({
          feePayer: signer.value as unknown as KeyPairSigner,
          maximumClientSideRetries: 3,
          instructions: topupInstructions,
        });
      },
    });

  const useStake = () =>
    useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey.includes("stake");
          },
        });
      },
      mutationFn: async ({ amount }: { amount: number }) => {
        const userTokenAccount = await connection.getTokenAccountAddress(
          walletAddress.value,
          mint,
        );

        if (!signer.value) {
          throw new Error("No signer available");
        }

        const stakeAccount = await generateKeyPairSigner();

        const stakeInstruction = await getStakeInstructionAsync({
          mint,
          stakeAccount,
          amount: amount * 1_000_000,
          duration: 30 * SECONDS_PER_DAY,
          authority: signer.value,
          userTokenAccount,
        });

        const enterRewardPoolIx = await getEnterInstructionAsync({
          mint,
          stakeAccount: stakeAccount.address,
          authority: signer.value,
        });

        return await connection.sendTransactionFromInstructions({
          feePayer: signer.value as unknown as KeyPairSigner,
          instructions: [stakeInstruction, enterRewardPoolIx],
          maximumClientSideRetries: 3,
        });
      },
    });

  const useGetStakeAccountQuery = () => {
    console.log("useGetStakeAccountQuery");
    return useQuery({
      queryKey: ["stake", walletAddress],
      retry: 0,
      queryFn: async () => {
        if (!walletAddress.value) {
          console.error("No wallet address found");
          throw new Error("Could not get wallet address");
        }

        const [stakingAccount] = await connection.rpc
          .getProgramAccounts(EFFECT_STAKING_PROGRAM_ADDRESS, {
            encoding: "base64",
            filters: [
              {
                memcmp: {
                  offset: 0n,
                  bytes: getBase58Codec().decode(STAKE_ACCOUNT_DISCRIMINATOR),
                },
              },
              {
                memcmp: {
                  offset: 8n + 8n,
                  encoding: "base58",
                  bytes: walletAddress.value,
                },
              },
            ],
          })
          .send();

        if (!stakingAccount) {
          throw new Error("No staking account found");
        }

        const stakeAccount = getStakeAccountCodec().decode(
          getBase64Codec().encode(
            (stakingAccount.account.data as unknown as [string, string])[0],
          ),
        );

        return {
          address: stakingAccount.pubkey,
          account: stakeAccount as StakeAccount,
        };
      },
    });
  };

  return {
    useStake,
    useUnstake,
    useTopup,
    useGetStakeAccountQuery,
  };
}

//
// export function useStakingProgram() {
//   console.log("useStakingProgram");
//   const { connection } = useConnection();
//   const { mint } = useEffectConfig();
//   const { address: walletAddress } = useWallet();
//
//   // const { rewardsProgram } = useRewardProgram();
//   const queryClient = useQueryClient();
//
//   const useUnstake = () =>
//     useMutation({
//       onSuccess: () => {
//         queryClient.invalidateQueries({
//           predicate: (query) => {
//             return (
//               query.queryKey.includes("stake") ||
//               query.queryKey.includes("unstake")
//             );
//           },
//         });
//       },
//       mutationFn: async ({
//         stakeAccount,
//         amount,
//       }: {
//         stakeAccount: StakingAccount;
//         amount: number;
//       }) => {
//         if (!publicKey.value) {
//           throw new Error("Could not get public key");
//         }
//
//         const ata = getAssociatedTokenAddressSync(mint, publicKey.value);
//
//         const { stakingRewardAccount } = useDeriveStakingRewardAccount({
//           stakingAccount: stakeAccount.publicKey,
//           programId: rewardsProgram.value.programId,
//         });
//
//         const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
//           microLamports: 100_000,
//         });
//
//         // create a new pubkey for unstake vestment
//         const vestmentAccount = Keypair.generate();
//
//         return await stakeProgram.value.methods
//           .unstake(new anchor.BN(amount * 1000000))
//           .preInstructions([
//             addPriorityFee,
//             ...((await connection.getAccountInfo(stakingRewardAccount))
//               ? [
//                   await rewardsProgram.value.methods
//                     .claim()
//                     .accounts({
//                       stakeAccount: stakeAccount.publicKey,
//                       recipientTokenAccount: ata,
//                     })
//                     .instruction(),
//                   await rewardsProgram.value.methods
//                     .close()
//                     .accounts({
//                       stakeAccount: stakeAccount.publicKey,
//                     })
//                     .instruction(),
//                 ]
//               : []),
//           ])
//           .accounts({
//             recipientTokenAccount: ata,
//             stakeAccount: stakeAccount.publicKey,
//             vestingAccount: vestmentAccount.publicKey,
//             mint,
//           })
//           .postInstructions([
//             await rewardsProgram.value.methods
//               .enter()
//               .accounts({
//                 mint,
//                 stakeAccount: stakeAccount.publicKey,
//               })
//               .instruction(),
//           ])
//           .signers([vestmentAccount])
//           .rpc();
//       },
//     });
//
//   const useTopUp = () =>
//     useMutation({
//       onSuccess: () => {
//         queryClient.invalidateQueries({
//           predicate: (query) => {
//             return query.queryKey.includes("stake");
//           },
//         });
//       },
//       mutationFn: async ({
//         stakeAccount,
//         amount,
//       }: {
//         stakeAccount: StakingAccount;
//         amount: number;
//       }) => {
//         if (!publicKey.value) {
//           throw new Error("Could not get public key");
//         }
//
//         const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
//           microLamports: 100_000,
//         });
//
//         const ata = getAssociatedTokenAddressSync(mint, publicKey.value);
//
//         const { stakingRewardAccount } = useDeriveStakingRewardAccount({
//           stakingAccount: stakeAccount.publicKey,
//           programId: rewardsProgram.value.programId,
//         });
//
//         try {
//           return await stakeProgram.value.methods
//             .topup(new anchor.BN(amount * 1000000))
//             .preInstructions([
//               addPriorityFee,
//               ...((await connection.getAccountInfo(stakingRewardAccount))
//                 ? []
//                 : [
//                     await rewardsProgram.value.methods
//                       .enter()
//                       .accounts({
//                         mint,
//                         stakeAccount: stakeAccount.publicKey,
//                       })
//                       .instruction(),
//                   ]),
//             ])
//             .accounts({
//               userTokenAccount: ata,
//               stakeAccount: stakeAccount.publicKey,
//             })
//             .postInstructions([
//               ...(
//                 await rewardsProgram.value.methods
//                   .sync()
//                   .accounts({
//                     stakeAccount: stakeAccount.publicKey,
//                   })
//                   .transaction()
//               ).instructions,
//             ])
//             .rpc();
//         } catch (e) {
//           console.log(e);
//
//           throw e;
//         }
//       },
//     });
//
//   const useStake = () =>
//     useMutation({
//       onSuccess: () => {
//         queryClient.invalidateQueries({
//           predicate: (query) => {
//             return query.queryKey.includes("stake");
//           },
//         });
//       },
//       mutationFn: async ({ amount }: { amount: number }) => {
//         const ata = connection.getTokenAccountAddress(walletAddress, mint);
//
//         // const stakerATA = await connection.getAccountInfo(ata);
//
//         // if (!stakerATA) {
//         //   throw new Error("Could not get staker ATA");
//         // }
//         // //
//         // const preInstructions: TransactionInstruction[] = [];
//         // const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
//         //   microLamports: 100_000,
//         // });
//         // preInstructions.push(addPriorityFee);
//         //
//         // const stakeAccount = Keypair.generate();
//
//         //
//         // await stakeProgram.value.methods
//         //   .stake(
//         //     new anchor.BN(amount * 1000000),
//         //     new anchor.BN(30 * SECONDS_PER_DAY),
//         //   )
//         //   .accounts({
//         //     stakeAccount: stakeAccount.publicKey,
//         //     userTokenAccount: ata,
//         //     mint,
//         //   })
//         //   .preInstructions(preInstructions)
//         //   .postInstructions([
//         //     ...(
//         //       await rewardsProgram.value.methods
//         //         .enter()
//         //         .accounts({
//         //           mint,
//         //           stakeAccount: stakeAccount.publicKey,
//         //         })
//         //         .transaction()
//         //     ).instructions,
//         //   ])
//         //   .signers([stakeAccount])
//         //   .rpc();
//       },
//     });
//
//   const useGetStakeAccount = () => {
//     const query = useQuery({
//       queryKey: ["stake", publicKey, "claim"],
//       retry: 0,
//       queryFn: async () => {
//         if (!publicKey.value) {
//           throw new Error("Could not get public key");
//         }
//
//         const stakingAccounts =
//           await stakeProgram.value.account.stakeAccount.all([
//             {
//               memcmp: {
//                 offset: 8 + 8,
//                 encoding: "base58",
//                 bytes: publicKey.value.toBase58(),
//               },
//             },
//           ]);
//
//         return stakingAccounts[0];
//       },
//     });
//
//     // computed helpers
//     const amount = computed(() => query.data.value?.account?.amount);
//     const amountFormatted = computed(() => {
//       const amount = query.data.value?.account?.amount;
//       return amount ? amount.toNumber() / 1000000 : 0;
//     });
//
//     const unstakeDays = computed(
//       () =>
//         query.data.value?.account?.lockDuration &&
//         query.data.value.account.lockDuration.toNumber() / SECONDS_PER_DAY,
//     );
//
//     return { ...query, amount, unstakeDays, amountFormatted };
//   };
//
//   return {
//     stakeProgram,
//     rewardsProgram,
//     useStake,
//     useUnstake,
//     useTopUp,
//     useGetStakeAccount,
//   };
// }
