import {
  EFFECT_PAYMENT_PROGRAM_ADDRESS,
  fetchMaybeRecipientManagerDataAccount,
  getClaimProofsInstructionAsync,
  getInitInstructionAsync,
} from "@effectai/payment";
import type { ProofResponse } from "@effectai/protobufs";
import {
  executeTransaction,
  getAssociatedTokenAccount,
} from "@effectai/solana-utils";
import {
  address,
  createKeyPairSignerFromBytes,
  getAddressEncoder,
  getProgramDerivedAddress,
  type MaybeAccount,
  SolanaError,
} from "@solana/kit";
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import {
  fetchMaybeToken,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getCreateAssociatedTokenInstructionAsync,
} from "@solana-program/token";
import { useMutation, useQuery } from "@tanstack/vue-query";

export function usePaymentProgram() {
  const { mint } = useEffectConfig();
  const { connection } = useConnection();

  const claimWithProof = async (
    proof: ProofResponse,
    managerPublicKey: string,
    paymentAccount: string,
  ) => {
    const { account, requestPrivateKey } = useAuth();
    assertExists(account.value, "account is not set");

    const privateKey = await requestPrivateKey();
    const signer = await createKeyPairSignerFromBytes(
      Buffer.from(privateKey, "hex"),
    );

    const claimWithProofIx = [];

    const ata = await getAssociatedTokenAccount({
      mint: address(mint),
      owner: address(account.value),
    });

    const [recipientManagerDataAccount] = await getProgramDerivedAddress({
      programAddress: address(EFFECT_PAYMENT_PROGRAM_ADDRESS),
      seeds: [
        getAddressEncoder().encode(address(account.value)),
        getAddressEncoder().encode(address(managerPublicKey)),
      ],
    });

    //check if ata exists
    const closed = await connection.checkTokenAccountIsClosed({
      tokenAccount: ata,
    });

    if (closed) {
      const createAtaIx =
        await getCreateAssociatedTokenIdempotentInstructionAsync({
          mint,
          payer: signer,
          owner: signer.address,
        });

      claimWithProofIx.push(createAtaIx);
    }

    const dataAccount = await fetchMaybeRecipientManagerDataAccount(
      connection.rpc,
      recipientManagerDataAccount,
    );

    if (!dataAccount.exists) {
      const initRecipientManagerDataAccountIx = await getInitInstructionAsync({
        authority: signer,
        mint: address(mint),
        managerAuthority: address(managerPublicKey),
      });

      claimWithProofIx.push(initRecipientManagerDataAccountIx);
    }

    const claimProofIx = await getClaimProofsInstructionAsync({
      paymentAccount: address(paymentAccount),
      mint: address(mint),
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

    claimWithProofIx.push(claimProofIx);

    try {
      console.log("executing tx", claimWithProofIx);
      await executeTransaction({
        rpc: connection.rpc,
        rpcSubscriptions: connection.rpcSubscriptions,
        signer,
        instructions: claimWithProofIx,
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
      connection.rpc,
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
