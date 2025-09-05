import {
  COMPUTE_BUDGET_PROGRAM_ADDRESS,
  ComputeBudgetInstruction,
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
  estimateComputeUnitLimitFactory,
  identifyComputeBudgetInstruction,
} from "@solana-program/compute-budget";
import type {
  RpcSubscriptions,
  RpcSubscriptionsMainnet,
  RpcSubscriptionsTransportWithCluster,
} from "@solana/rpc-subscriptions";
import {
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  createSolanaRpcFromTransport,
  createSolanaRpcSubscriptions,
  createSolanaRpcSubscriptionsApi,
  createTransactionMessage,
  getSignatureFromTransaction,
  Instruction,
  isInstructionWithData,
  isWritableRole,
  pipe,
  RpcMainnet,
  sendTransactionWithoutConfirmingFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  SolanaError,
  SolanaRpcApiMainnet,
  TransactionMessage,
  TransactionSigner,
} from "@solana/kit";
import { createRecentSignatureConfirmationPromiseFactory } from "@solana/transaction-confirmation";

export const getPriorityFeeEstimate = async (
  rpc: ReturnType<typeof createSolanaRpcFromTransport>,
  supportsGetPriorityFeeEstimate: boolean,
  transactionMessage: TransactionMessage,
  abortSignal: AbortSignal | null = null,
): Promise<number> => {
  const accountKeys = [
    ...new Set([
      ...transactionMessage.instructions.flatMap((instruction: Instruction) =>
        (instruction.accounts ?? [])
          .filter((account) => isWritableRole(account.role))
          .map((account) => account.address),
      ),
    ]),
  ];

  // If the RPC doesn't support getPriorityFeeEstimate, use the median of the recent fees
  if (!supportsGetPriorityFeeEstimate) {
    const recentFeesResponse = await rpc
      .getRecentPrioritizationFees([...accountKeys])
      .send({ abortSignal });
    const recentFeesValues = recentFeesResponse.reduce(
      (accumulator: any, current: any) => {
        if (current.prioritizationFee > 0n) {
          return [...accumulator, current.prioritizationFee];
        } else {
          return accumulator;
        }
      },
      [],
    );

    // Return the median fee
    // @ts-expect-error TODO: typing error from original helius-smart-transactions-web3js2. Fix this.
    recentFeesValues.sort((a, b) => Number(a - b));
    return Number(recentFeesValues[Math.floor(recentFeesValues.length / 2)]);
  }
  // Get a priority fee estimate, using Helius' `getPriorityFeeEstimate` method on Helius mainnet

  const { priorityFeeEstimate } = await rpc
    .getPriorityFeeEstimate({
      accountKeys,
      options: {
        // See https://docs.helius.dev/solana-apis/priority-fee-api
        // Per Evan at Helius 20250213: recommended: true is not longer preferred,
        // instead use priorityLevel: "High"
        priorityLevel: "High",
      },
    })
    .send({ abortSignal });

  return priorityFeeEstimate;
};

export const getComputeUnitEstimate = async (
  rpc: ReturnType<typeof createSolanaRpcFromTransport>,
  transactionMessage: TransactionMessage,
  abortSignal: AbortSignal | null = null,
) => {
  // add placeholder instruction for CU price if not already present
  // web3js estimate will add CU limit but not price
  // both take CUs, so we need both in the simulation
  const hasExistingComputeBudgetPriceInstruction =
    transactionMessage.instructions.some(
      (instruction) =>
        instruction.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS &&
        isInstructionWithData(instruction) &&
        identifyComputeBudgetInstruction(instruction) ===
          ComputeBudgetInstruction.SetComputeUnitPrice,
    );

  const transactionMessageToSimulate = hasExistingComputeBudgetPriceInstruction
    ? transactionMessage
    : appendTransactionMessageInstruction(
        getSetComputeUnitPriceInstruction({ microLamports: 0n }),
        transactionMessage,
      );

  const computeUnitEstimateFn = estimateComputeUnitLimitFactory({ rpc });
  // TODO: computeUnitEstimateFn expects an explicit 'undefined' for abortSignal,
  // fix upstream
  //@ts-expect-error
  return computeUnitEstimateFn(transactionMessageToSimulate, {
    abortSignal: abortSignal ?? undefined,
  });
};

export const executeTransaction = async ({
  rpc,
  rpcSubscriptions,
  instructions,
  signer,
  commitment = "finalized",
}: {
  rpc: ReturnType<typeof createSolanaRpcFromTransport>;
  rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  instructions: Instruction[];
  signer: TransactionSigner;
  commitment?: "processed" | "confirmed" | "finalized";
}) => {
  try {
    const abortSignal = new AbortController().signal;

    const sendTransaction = sendTransactionWithoutConfirmingFactory({ rpc });

    const getRecentSignatureConfirmationPromise =
      createRecentSignatureConfirmationPromiseFactory({
        rpc,
        rpcSubscriptions: rpcSubscriptions as any,
      });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    let transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (message) =>
        setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
      (message) => setTransactionMessageFeePayerSigner(signer, message),
      (message) => appendTransactionMessageInstructions(instructions, message),
    );

    const [priorityFeeEstimate, computeUnitEstimate] = await Promise.all([
      getPriorityFeeEstimate(rpc, false, transactionMessage, abortSignal),
      getComputeUnitEstimate(rpc, transactionMessage, abortSignal),
    ]);

    const setComputeUnitPriceInstruction = getSetComputeUnitPriceInstruction({
      microLamports: BigInt(priorityFeeEstimate),
    });

    const setComputeUnitLimitInstruction = getSetComputeUnitLimitInstruction({
      units: Math.ceil(computeUnitEstimate * 1.1),
    });

    transactionMessage = appendTransactionMessageInstructions(
      [setComputeUnitPriceInstruction, setComputeUnitLimitInstruction],
      transactionMessage,
    );

    const signedTransaction =
      await signTransactionMessageWithSigners(transactionMessage);
    const signature = getSignatureFromTransaction(signedTransaction);

    //@ts-expect-error
    await sendTransaction(signedTransaction, {
      commitment,
    });

    await getRecentSignatureConfirmationPromise({
      abortSignal,
      commitment,
      signature,
    });

    return signature;
  } catch (e) {
    if (e instanceof SolanaError) {
      console.error("SolanaError: ", e.context);
    } else {
      console.error("Transaction error: ", e);
    }

    throw e;
  }
};
