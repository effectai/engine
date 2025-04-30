import * as anchor from "@coral-xyz/anchor";
import type {
  Program,
  Idl,
  ProgramAccount,
  IdlAccounts,
} from "@coral-xyz/anchor";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { PublicKey } from "@solana/web3.js";
import {
  EffectPaymentIdl,
  type EffectPayment,
  type EffectStaking,
} from "@effectai/shared";
import { buildEddsa } from "circomlibjs";

import {
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { ProofResponse } from "@effectai/protocol";

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

  const useClaimWithProof = () =>
    useMutation({
      mutationKey: ["claimWithProof"],
      mutationFn: async (proof: ProofResponse) => {
        if (!paymentProgram.value) {
          throw new Error("Payment program not initialized");
        }
        return claimWithProof(proof);
      },
    });

  const claimWithProof = async (proof: ProofResponse) => {
    const sessionStore = useSessionStore();
    const { account, managerPublicKey } = sessionStore.useActiveSession();

    const managerRecipientDataAccount = deriveWorkerManagerDataAccount(
      account.value,
      managerPublicKey.value,
    );

    const ata = getAssociatedTokenAddressSync(mint, account.value);

    const dataAccount =
      await paymentProgram.value.account.recipientManagerDataAccount.fetchNullable(
        managerRecipientDataAccount,
      );

    const eddsa = await buildEddsa();

    const tx = await paymentProgram.value.methods
      .claim(
        new anchor.BN(proof.signals?.minNonce),
        new anchor.BN(proof.signals?.maxNonce),
        new anchor.BN(proof.signals?.amount.toString()),
        bigIntToBytes32(eddsa.F.toObject(proof.r8?.R8_1)),
        bigIntToBytes32(eddsa.F.toObject(proof.r8?.R8_2)),
        Array.from(convertProofToBytes(proof)),
      )
      .preInstructions([
        ...((await connection.getAccountInfo(ata))
          ? []
          : [
              createAssociatedTokenAccountIdempotentInstructionWithDerivation(
                account.value,
                account.value,
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
      .accounts({
        recipientManagerDataAccount: managerRecipientDataAccount,
        paymentAccount: new PublicKey(
          "v9iz7onKpFnjj1AYieUyz4NNm1WfE4NCbizTWLiWtMY",
        ),
        mint,
        recipientTokenAccount: ata,
      })
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

  const useRecipientManagerDataAccount = (
    account: Ref<string | null | undefined>,
    managerPublicKey: Ref<string | undefined>,
  ) => {
    return useQuery({
      queryKey: ["dataAccount", account, managerPublicKey],
      queryFn: async () => {
        if (!account.value || !managerPublicKey.value) {
          throw new Error("No account or manager public key found");
        }

        const managerDataAccount = deriveWorkerManagerDataAccount(
          new PublicKey(account.value),
          new PublicKey(managerPublicKey.value),
        );

        const dataAccount =
          await paymentProgram.value.account.recipientManagerDataAccount.fetchNullable(
            managerDataAccount,
          );

        return dataAccount;
      },
      enabled: computed(() => !!account.value && !!managerPublicKey.value),
    });
  };

  return {
    program: paymentProgram,
    useClaimWithProof,
    useRecipientManagerDataAccount,
    deriveWorkerManagerDataAccount,
  };
}
