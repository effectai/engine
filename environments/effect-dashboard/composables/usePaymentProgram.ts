import * as anchor from "@coral-xyz/anchor";
import type {
  Program,
  Idl,
  ProgramAccount,
  IdlAccounts,
} from "@coral-xyz/anchor";

import {
  address,
  createKeyPairSignerFromPrivateKeyBytes,
  getProgramDerivedAddress,
  getAddressEncoder,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  createKeyPairSignerFromBytes,
  SolanaError,
  type SolanaErrorCodeWithCause,
} from "@solana/kit";

import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";

import { useMutation, useQuery } from "@tanstack/vue-query";
import {
  EffectPaymentIdl,
  type EffectPayment,
  type EffectStaking,
} from "@effectai/idl";

import { buildEddsa } from "@effectai/protocol";
import type { ProofResponse } from "@effectai/protocol";

import {
  EFFECT_PAYMENT_PROGRAM_ADDRESS,
  fetchMaybeRecipientManagerDataAccount,
  getClaimProofsInstructionAsync,
  getInitInstructionAsync,
  getAssociatedTokenAccount,
} from "@effectai/program-sdk";

import {
  getCreateAssociatedTokenInstructionAsync,
  fetchMaybeToken,
} from "@solana-program/token";

export type EffectStakingProgramAccounts = IdlAccounts<EffectStaking>;
export type StakingAccount = ProgramAccount<
  EffectStakingProgramAccounts["stakeAccount"]
>;

export function usePaymentProgram() {
  const { mint } = useEffectConfig();
  const { rpc, rpcSubscriptions } = useSolanaRpc();
  const authStore = useAuthStore();
  const { privateKey } = storeToRefs(authStore);

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const useClaimWithProof = () =>
    useMutation({
      mutationKey: ["claimWithProof"],
      mutationFn: async (proofs: ProofResponse[]) => {
        return claimWithProofs(proofs);
      },
    });

  const claimWithProofs = async (proofs: ProofResponse[]) => {
    const sessionStore = useSessionStore();
    const { account, managerPublicKey } = sessionStore.useActiveSession();

    const signer = await createKeyPairSignerFromBytes(
      Buffer.from(privateKey.value, "hex"),
    );

    if (!account.value || !managerPublicKey.value) {
      throw new Error("No account or manager public key found");
    }

    const ata = await getAssociatedTokenAccount({
      mint: address(mint.toBase58()),
      owner: address(account.value.toBase58()),
    });

    const [recipientManagerDataAccount] = await getProgramDerivedAddress({
      programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
      seeds: [
        getAddressEncoder().encode(address(account.value.toBase58())),
        getAddressEncoder().encode(address(managerPublicKey.value.toBase58())),
      ],
    });

    const dataAccount = await fetchMaybeRecipientManagerDataAccount(
      rpc,
      recipientManagerDataAccount,
    );

    const config = useRuntimeConfig();
    const paymentAccount = config.public.PAYMENT_ACCOUNT;

    const eddsa = await buildEddsa();

    const initRecipientManagerDataAccountIx = await getInitInstructionAsync({
      authority: signer,
      mint: address(mint.toBase58()),
      managerAuthority: address(managerPublicKey.value.toBase58()),
    });

    const tokenAccount = await fetchMaybeToken(rpc, ata);

    const setComputeIx = getSetComputeUnitLimitInstruction({
      units: 400_000,
    });

    const setPriorityFeeIx = getSetComputeUnitPriceInstruction({
      microLamports: 100_000,
    });

    const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
      mint: address(mint.toBase58()),
      payer: signer,
      owner: signer.address,
    });

    const claimProofIx = await getClaimProofsInstructionAsync({
      paymentAccount: address(paymentAccount),
      mint: address(mint.toBase58()),
      recipientManagerDataAccount,
      recipientTokenAccount: ata,
      pubX: bigIntToBytes32(eddsa.F.toObject(proofs[0].r8?.R8_1)),
      pubY: bigIntToBytes32(eddsa.F.toObject(proofs[0].r8?.R8_2)),
      authority: signer,
      proofData: proofs.map((proof) => {
        if (!proof.signals) {
          throw new Error("Proof signals are missing!");
        }
        return {
          minNonce: Number(proof.signals.minNonce),
          maxNonce: Number(proof.signals.maxNonce),
          totalAmount: Number(proof.signals.amount),
          recipient: bigIntToBytes32(proof.signals.recipient),
          proof: convertProofToBytes(proof),
        };
      }),
    });

    try {
      const recentBlockhash = await rpc.getLatestBlockhash().send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            recentBlockhash.value,
            tx,
          ),
        // (tx) =>
        //   compressTransactionMessageUsingAddressLookupTables(tx, lookupAccount),
        (tx) =>
          appendTransactionMessageInstructions(
            dataAccount.exists ? [] : [initRecipientManagerDataAccountIx],
            tx,
          ),
        (tx) =>
          appendTransactionMessageInstructions(
            tokenAccount.exists ? [] : [createAtaIx],
            tx,
          ),
        (tx) =>
          appendTransactionMessageInstructions(
            [setComputeIx, setPriorityFeeIx, claimProofIx],
            tx,
          ),
      );

      const signedTx =
        await signTransactionMessageWithSigners(transactionMessage);

      await sendAndConfirmTransaction(signedTx, {
        commitment: "finalized",
      });
    } catch (e: any) {
      if (e instanceof SolanaError) {
        console.error(e.stack, e.context, e.cause);
      }

      throw e;
    }
  };

  const useRecipientManagerDataAccount = (
    account: Ref<string | null | undefined>,
    managerPublicKey: Ref<string | undefined>,
  ) => {
    return useQuery({
      queryKey: computed(() => ["remoteNonce", account, managerPublicKey]),
      queryFn: async () => {
        if (!account.value || !managerPublicKey.value) {
          throw new Error("No account or manager public key found");
        }

        console.log("refetching data account..");

        const [recipientManagerDataAccountAddress] =
          await getProgramDerivedAddress({
            programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
            seeds: [
              getAddressEncoder().encode(address(account.value)),
              getAddressEncoder().encode(address(managerPublicKey.value)),
            ],
          });

        const dataAccount = await fetchMaybeRecipientManagerDataAccount(
          rpc,
          recipientManagerDataAccountAddress,
        );

        return dataAccount;
      },
      enabled: computed(() => !!account.value && !!managerPublicKey.value),
    });
  };

  return {
    useClaimWithProof,
    claimWithProofs,
    useRecipientManagerDataAccount,
  };
}
