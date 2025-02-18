import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  type TokenAmount,
} from "@solana/web3.js";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryReturnType,
} from "@tanstack/vue-query";

import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { EffectMigrationIdl, type EffectMigration } from "@effectai/shared";

import {
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  useDeriveMigrationAccounts,
  useDeriveStakingRewardAccount,
} from "@effectai/utils";
import type { StakingAccount } from "./useStakingProgram";

export type EffectMigrationProgramAccounts =
  anchor.IdlAccounts<EffectMigration>;
export type MigrationClaimAccount = anchor.ProgramAccount<
  EffectMigrationProgramAccounts["migrationAccount"]
>;

const SECONDS_PER_DAY = 86400;

export const useMigrationProgram = () => {
  const config = useRuntimeConfig();

  const { publicKey } = useWallet();
  const { connection } = useGlobalState();

  const { provider } = useAnchorProvider();
  const { rewardsProgram } = useStakingProgram();
  const { stakeProgram } = useStakingProgram();

  const queryClient = useQueryClient();

  const migrationProgram = computed(() => {
    return new anchor.Program(
      EffectMigrationIdl as Idl,
      provider.value || undefined
    ) as unknown as Program<EffectMigration>;
  });

  const useGetMigrationVaultBalance = (
    migrationAccount: MigrationClaimAccount["account"]
  ) => {
    return useQuery({
      queryKey: ["claim", "vault-balance", publicKey],
      queryFn: async () => {
        if (!publicKey.value) {
          throw new Error("Missing required data");
        }

        const { vaultAccount } = useDeriveMigrationAccounts({
          mint: new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT),
          foreignAddress: migrationAccount.foreignAddress,
          programId: migrationProgram.value.programId,
        });

        return await connection.getTokenAccountBalance(vaultAccount);
      },
    });
  };

  const useGetMigrationAccount = (
    foreignPublicKey: Ref<Uint8Array | undefined | null>
  ): UseQueryReturnType<MigrationClaimAccount["account"], Error> => {
    return useQuery({
      queryKey: ["claim", "accounts", foreignPublicKey.value],
      queryFn: async () => {
        if (!foreignPublicKey.value) {
          throw new Error("Missing required data");
        }

        const { migrationAccount } = useDeriveMigrationAccounts({
          mint: new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT),
          foreignAddress: foreignPublicKey.value,
          programId: migrationProgram.value.programId,
        });

        return await migrationProgram.value.account.migrationAccount.fetchNullable(
          migrationAccount
        );
      },
      enabled: computed(() => !!foreignPublicKey.value),
    });
  };

  const useClaim = () =>
    useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey.includes("claim");
          },
        });
      },
      mutationFn: async ({
        foreignPublicKey,
        signature,
        message,
      }: {
        foreignPublicKey: Uint8Array;
        signature: Uint8Array;
        message: Uint8Array;
      }) => {
        const { publicKey } = useWallet();

        if (!publicKey.value) {
          throw new Error("Not connected to a solana wallet");
        }

        const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT);
        const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

        const signers: Keypair[] = [];
        let stakingAccount: Keypair | StakingAccount | null = null;

        // check if user has an existing stakingAccount
        const stakingAccounts =
          await stakeProgram.value.account.stakeAccount.all([
            {
              memcmp: {
                offset: 8 + 8,
                encoding: "base58",
                bytes: publicKey.value.toBase58(),
              },
            },
          ]);

        if (stakingAccounts.length === 0) {
          stakingAccount = Keypair.generate();
          signers.push(stakingAccount);
        } else {
          stakingAccount = stakingAccounts[0];
        }

        const { stakingRewardAccount } = useDeriveStakingRewardAccount({
          stakingAccount: stakingAccount.publicKey,
          programId: rewardsProgram.value.programId,
        });

        const { migrationAccount } = useDeriveMigrationAccounts({
          mint,
          foreignAddress: foreignPublicKey,
          programId: migrationProgram.value.programId,
        });

        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 100_000,
        });

        return await migrationProgram.value.methods
          .claimStake(Buffer.from(signature), Buffer.from(message))
          .preInstructions([
            addPriorityFee,
            ...((await connection.getAccountInfo(ata))
              ? []
              : [
                  createAssociatedTokenAccountIdempotentInstructionWithDerivation(
                    publicKey.value,
                    publicKey.value,
                    mint
                  ),
                ]),
            ...(stakingAccounts.length === 0
              ? [
                  await stakeProgram.value.methods
                    .stake(
                      new anchor.BN(0),
                      new anchor.BN(30 * SECONDS_PER_DAY)
                    )
                    .accounts({
                      stakeAccount: stakingAccount.publicKey,
                      userTokenAccount: ata,
                      mint,
                    })
                    .signers(signers)
                    .instruction(),
                ]
              : []),
          ])
          .postInstructions([
            ...((await connection.getAccountInfo(stakingRewardAccount))
              ? []
              : [
                  await rewardsProgram.value.methods
                    .enter()
                    .accounts({
                      mint,
                      stakeAccount: stakingAccount.publicKey,
                    })
                    .signers(signers)
                    .instruction(),
                ]),
          ])
          .accounts({
            migrationAccount,
            mint,
            recipientTokenAccount: ata,
            stakeAccount: stakingAccount.publicKey,
          })
          .signers(signers)
          .rpc();
      },
    });

  return {
    migrationProgram,
    useGetMigrationAccount,
    useGetMigrationVaultBalance,
    useClaim,
  };
};
