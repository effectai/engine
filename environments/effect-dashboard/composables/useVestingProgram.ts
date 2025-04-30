import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { EffectVestingIdl, type EffectVesting } from "@effectai/shared";
import { useDeriveVestingAccounts } from "@effectai/utils";

export type EffectVestingProgramAccounts = anchor.IdlAccounts<EffectVesting>;
export type VestingAccount = anchor.ProgramAccount<
  EffectVestingProgramAccounts["vestingAccount"]
>;

export const useVestingProgram = () => {
  const appConfig = useRuntimeConfig();
  const { publicKey } = useWallet();
  const { provider } = useAnchorProvider();

  const mint = new PublicKey(appConfig.public.EFFECT_SPL_TOKEN_MINT);

  const queryClient = useQueryClient();

  const vestingProgram = computed(
    () =>
      new anchor.Program(
        EffectVestingIdl as Idl,
        provider.value || undefined,
      ) as unknown as Program<EffectVesting>,
  );

  const useGetVestingAccounts = () => {
    return useQuery({
      queryKey: ["vestingAccounts", publicKey, "unstake", "claim"],
      queryFn: async () => {
        if (!publicKey.value) {
          throw new Error("Could not get public key");
        }

        const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

        return await vestingProgram.value.account.vestingAccount.all([
          {
            memcmp: {
              offset: 8 + 32,
              encoding: "base58",
              bytes: ata.toBase58(),
            },
          },
        ]);
      },
    });
  };

  const useClaim = () => {
    return useMutation({
      onSuccess: ({ publicKey }) => {
        const { vestingVaultAccount } = useDeriveVestingAccounts({
          vestingAccount: publicKey,
          programId: vestingProgram.value.programId,
        });

        queryClient.invalidateQueries({
          predicate: (query) => {
            return (
              query.queryKey.includes("claim") ||
              query.queryKey.includes(vestingVaultAccount.toBase58())
            );
          },
        });
      },
      mutationFn: async ({
        address,
        vestingAccount,
      }: {
        vestingAccount: VestingAccount;
        address: PublicKey;
      }) => {
        if (!publicKey.value) {
          throw new Error("Could not get public key");
        }
        const preInstructions: TransactionInstruction[] = [];
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 100_000,
        });
        preInstructions.push(addPriorityFee);

        const ata = getAssociatedTokenAddressSync(mint, publicKey.value);
        let ataExists = false;
        try {
          ataExists =
            !!(await vestingProgram.value.provider.connection.getAccountInfo(
              ata,
            ));
        } catch (error) {
          console.log("ATA doesnt exists", ata.toString());
        }
        if (!ataExists) {
          try {
            preInstructions.push(
              createAssociatedTokenAccountInstruction(
                new PublicKey(publicKey.value),
                ata,
                new PublicKey(publicKey.value),
                mint,
              ),
            );
          } catch (e) {
            console.log("createAssociatedTokenAccountInstruction", e);
          }
        }

        const tx = await vestingProgram.value.methods
          .claim()
          .preInstructions(preInstructions)
          .accounts({
            vestingAccount: address,
            authority: publicKey.value,
          })
          .rpc();

        return vestingAccount;
      },
    });
  };

  const useGetActiveRewardVestingAccount = () => {
    return useQuery({
      queryKey: ["activeRewardVestingAccount"],
      queryFn: async () => {
        const config = useRuntimeConfig();
        const ACTIVE_REWARD_VESTING_ACCOUNT = new PublicKey(
          config.public.EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT,
        );
        const data = await vestingProgram.value.account.vestingAccount.fetch(
          ACTIVE_REWARD_VESTING_ACCOUNT,
        );

        const { vestingVaultAccount } = useDeriveVestingAccounts({
          vestingAccount: ACTIVE_REWARD_VESTING_ACCOUNT,
          programId: vestingProgram.value.programId,
        });

        return {
          vestingVaultAccount,
          account: data,
          publicKey: ACTIVE_REWARD_VESTING_ACCOUNT,
        };
      },
    });
  };

  return {
    useClaim,
    useGetVestingAccounts,
    vestingProgram,
    useGetActiveRewardVestingAccount,
  };
};
