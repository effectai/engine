import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type {
  Program,
  Idl,
  ProgramAccount,
  IdlAccounts,
} from "@coral-xyz/anchor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useAnchorProvider } from "./useAnchorProvider";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  EffectPaymentIdl,
  type EffectPayment,
  type EffectStaking,
} from "@effectai/shared";

import { buildEddsa } from "circomlibjs";

import {
  createAssociatedTokenAccountIdempotent,
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { Payment, ProofResponse } from "@effectai/protocol";

const SECONDS_PER_DAY = 86400;

export type EffectStakingProgramAccounts = IdlAccounts<EffectStaking>;
export type StakingAccount = ProgramAccount<
  EffectStakingProgramAccounts["stakeAccount"]
>;

export function usePaymentProgram() {
  const { connection, mint } = useGlobalState();
  const { provider } = useAnchorProvider();

  const paymentProgram = computed(() => {
    return new anchor.Program(
      EffectPaymentIdl as Idl,
      provider.value || undefined,
    ) as unknown as Program<EffectPayment>;
  });

  const claimWithProof = async (proof: ProofResponse) => {
    const { publicKey } = useWallet();
    const workerStore = useWorkerStore();
    const { managerRecipientDataAccount, managerPublicKey } =
      storeToRefs(workerStore);

    if (!publicKey.value) {
      throw new Error("No public key found");
    }

    if (!managerPublicKey.value) {
      throw new Error("No manager public key found");
    }

    if (!managerRecipientDataAccount.value) {
      throw new Error("No manager recipient data account found");
    }

    const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

    const dataAccount =
      await paymentProgram.value.account.recipientManagerDataAccount.fetchNullable(
        managerRecipientDataAccount.value,
      );

    const eddsa = await buildEddsa();

    const tx = await paymentProgram.value.methods
      .claim(
        new anchor.BN(proof.signals?.minNonce),
        new anchor.BN(proof.signals?.maxNonce),
        new anchor.BN(proof.signals?.amount.toString()),
        bigIntToBytes32(eddsa.F.toObject(proof.R8?.R8_1)),
        bigIntToBytes32(eddsa.F.toObject(proof.R8?.R8_2)),
        Array.from(convertProofToBytes(proof)),
      )
      .accounts({
        recipientManagerDataAccount: managerRecipientDataAccount.value,
        paymentAccount: new PublicKey(
          "AahuY9eumjHYtp7qXJLDEFiHVjffZA6U4S8FWkDyDoVb",
        ),
        mint,
        recipientTokenAccount: ata,
      })
      .preInstructions([
        ...((await connection.getAccountInfo(ata))
          ? []
          : [
              createAssociatedTokenAccountIdempotentInstructionWithDerivation(
                publicKey.value,
                publicKey.value,
                mint,
              ),
            ]),
        ...(dataAccount
          ? []
          : [
              await paymentProgram.value.methods
                .init(managerPublicKey.value)
                .accounts({
                  mint,
                })
                .instruction(),
            ]),
      ])
      .rpc();
  };

  const deriveWorkerManagerDataAccount = (
    worker: PublicKey,
    manager: PublicKey,
  ) => {
    const [publicKey] = PublicKey.findProgramAddressSync(
      [worker.toBuffer(), manager.toBuffer()],
      paymentProgram.value.programId,
    );

    return publicKey;
  };

  const useRecipientManagerDataAccount = (managerPublicKey: PublicKey) => {
    const { publicKey } = useWallet();

    return useQuery({
      queryKey: [
        "recipientManagerDataAccount",
        publicKey,
        managerPublicKey.toBase58(),
      ],
      queryFn: async () => {
        if (!publicKey.value) {
          throw new Error("No public key found");
        }

        const managerDataAccount = deriveWorkerManagerDataAccount(
          publicKey.value,
          managerPublicKey,
        );

        const dataAccount =
          await paymentProgram.value.account.recipientManagerDataAccount.fetchNullable(
            managerDataAccount,
          );

        return dataAccount;
      },
    });
  };

  const fetchRemoteNonce = async (
    workerPublicKey: PublicKey,
    managerPublicKey: PublicKey,
  ) => {
    const managerDataAccount = deriveWorkerManagerDataAccount(
      workerPublicKey,
      managerPublicKey,
    );

    const result =
      await paymentProgram.value.account.recipientManagerDataAccount.fetchNullable(
        managerDataAccount,
      );

    return result ? BigInt(result.nonce) : null;
  };

  return {
    program: paymentProgram,
    fetchRemoteNonce,
    deriveWorkerManagerDataAccount,
    claimWithProof,
    useRecipientManagerDataAccount,
  };
}
