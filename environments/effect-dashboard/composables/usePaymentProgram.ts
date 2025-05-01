import * as anchor from "@coral-xyz/anchor";
import type {
  Program,
  Idl,
  ProgramAccount,
  IdlAccounts,
} from "@coral-xyz/anchor";

import { useMutation, useQuery } from "@tanstack/vue-query";
import { Keypair, PublicKey } from "@solana/web3.js";
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
import type { SolanaWallet } from "@web3auth/solana-provider";

export type EffectStakingProgramAccounts = IdlAccounts<EffectStaking>;
export type StakingAccount = ProgramAccount<
  EffectStakingProgramAccounts["stakeAccount"]
>;

const solanaWalletToAnchorWallet = (
  solanaWallet: SolanaWallet,
  publicKey: string,
) => {
  return {
    publicKey: new PublicKey(publicKey),
    signTransaction: async (
      tx: anchor.web3.Transaction | anchor.web3.VersionedTransaction,
    ) => {
      const signedTx = await solanaWallet.signTransaction(tx);
      return signedTx;
    },
    signAllTransactions: async (txs: anchor.web3.Transaction[]) => {
      const signedTxs = await solanaWallet.signAllTransactions(txs);
      return signedTxs;
    },
  };
};

export function usePaymentProgram() {
  const { connection, mint } = useGlobalState();
  const { solanaWallet, account } = useWeb3Auth();

  const wallet = solanaWalletToAnchorWallet(solanaWallet.value, account.value);
  const provider = new anchor.AnchorProvider(connection, wallet, {});

  const paymentProgram = computed(() => {
    return new anchor.Program(
      EffectPaymentIdl as Idl,
      provider || undefined,
    ) as unknown as Program<EffectPayment>;
  });

  const useClaimWithProof = () =>
    useMutation({
      mutationKey: ["claimWithProof"],
      mutationFn: async (proof: ProofResponse) => {
        return claimWithProof(proof);
      },
    });

  const claimWithProof = async (proof: ProofResponse) => {
    const sessionStore = useSessionStore();
    const { account, managerPublicKey } = sessionStore.useActiveSession();

    if (!proof.signals) {
      throw new Error("No valid proof found");
    }

    if (!account.value || !managerPublicKey.value) {
      throw new Error("No account or manager public key found");
    }

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
        new anchor.BN(proof.signals.minNonce).toNumber(),
        new anchor.BN(proof.signals.maxNonce).toNumber(),
        new anchor.BN(proof.signals.amount.toString()),
        Array.from(bigIntToBytes32(eddsa.F.toObject(proof.r8?.R8_1))),
        Array.from(bigIntToBytes32(eddsa.F.toObject(proof.r8?.R8_2))),
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
        paymentAccount: new PublicKey(proof.signals.paymentAccount),
        mint,
        recipientTokenAccount: ata,
      })
      .rpc();

    return tx;
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
    claimWithProof,
    useRecipientManagerDataAccount,
    deriveWorkerManagerDataAccount,
  };
}
