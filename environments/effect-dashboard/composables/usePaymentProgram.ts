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
  getAddressDecoder,
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
  type MaybeAccount,
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
  getInitInstructionAsync,
  getClaimProofsInstructionAsync,
} from "@effectai/payment";

//
// import {
//   EFFECT_PAYMENT_PROGRAM_ADDRESS,
//   fetchMaybeRecipientManagerDataAccount,
//   getClaimProofsInstructionAsync,
//   getInitInstructionAsync,
//   getAssociatedTokenAccount,
// } from "@effectai/program-sdk";
//

import {
  getCreateAssociatedTokenInstructionAsync,
  fetchMaybeToken,
} from "@solana-program/token";
import { getAssociatedTokenAccount } from "@effectai/utils";

export type EffectStakingProgramAccounts = IdlAccounts<EffectStaking>;
export type StakingAccount = ProgramAccount<
  EffectStakingProgramAccounts["stakeAccount"]
>;

export function usePaymentProgram() {
  const { mint } = useEffectConfig();
  const { rpc, rpcSubscriptions } = useSolanaRpc();

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const claimWithProof = async (
    proof: ProofResponse,
    managerPublicKey: string,
  ) => {
    const { account, privateKey } = useAuth();
    assertExists(account.value, "account is not set");

    if (!privateKey.value) {
      throw new Error("Private key is not set");
    }

    const signer = await createKeyPairSignerFromBytes(
      Buffer.from(privateKey.value, "hex"),
    );

    const ata = await getAssociatedTokenAccount({
      mint: address(mint.toBase58()),
      owner: address(account.value),
    });

    const [recipientManagerDataAccount] = await getProgramDerivedAddress({
      programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
      seeds: [
        getAddressEncoder().encode(address(account.value)),
        getAddressEncoder().encode(address(managerPublicKey)),
      ],
    });

    const dataAccount = await fetchMaybeRecipientManagerDataAccount(
      rpc,
      recipientManagerDataAccount,
    );

    const eddsa = await buildEddsa();

    const initRecipientManagerDataAccountIx = await getInitInstructionAsync({
      authority: signer,
      mint: address(mint.toBase58()),
      managerAuthority: address(managerPublicKey),
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
      paymentAccount: address(proof.signals?.paymentAccount),
      mint: address(mint.toBase58()),
      recipientManagerDataAccount,
      recipientTokenAccount: ata,
      pubX: bigIntToBytes32(proof.signals.pubX),
      pubY: bigIntToBytes32(proof.signals.pubY),
      authority: signer,
      minNonce: proof.signals.minNonce,
      maxNonce: proof.signals.maxNonce,
      totalAmount: proof.signals.amount,
      proof: convertProofToBytes(proof),
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
      console.log("signedTx", signedTx);

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

  const getRecipientManagerDataAccount = async (
    account: string,
    managerPublicKey: string,
  ): Promise<
    MaybeAccount<IdlAccounts<EffectPayment>["recipientManagerDataAccount"]>
  > => {
    const [recipientManagerDataAccountAddress] = await getProgramDerivedAddress(
      {
        programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
        seeds: [
          getAddressEncoder().encode(address(account)),
          getAddressEncoder().encode(address(managerPublicKey)),
        ],
      },
    );

    return fetchMaybeRecipientManagerDataAccount(
      rpc,
      recipientManagerDataAccountAddress,
    );
  };

  const useRecipientManagerDataAccountQuery = (
    account: Ref<string | null | undefined>,
    managerPublicKey: Ref<string | undefined | null>,
  ) => {
    return useQuery({
      queryKey: computed(() => ["remoteNonce", account, managerPublicKey]),
      queryFn: async () => {
        if (!account.value || !managerPublicKey.value) {
          throw new Error("No account or manager public key found");
        }

        return getRecipientManagerDataAccount(
          account.value,
          managerPublicKey.value,
        );
      },
      enabled: computed(() => !!account.value && !!managerPublicKey.value),
    });
  };

  return {
    claimWithProof,
    getRecipientManagerDataAccount,
    useRecipientManagerDataAccountQuery,
  };
}
