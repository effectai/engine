import type { Address } from "@solana/kit";
import { address } from "@solana/kit";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  createTransactionSendingSigner,
  makeModifyAndSign,
  makeSignAndSend,
} from "../kit/wallet-standard-bridge";

export function useKitTransactionSendingSigner(opts: {
  wallet: Wallet;
  account: WalletAccount;
  chain: `solana:${string}`;
}) {
  const signAndSend = makeSignAndSend(opts.wallet, opts.account, opts.chain);

  const modifyAndSign = makeModifyAndSign(
    opts.wallet,
    opts.account,
    opts.chain,
  );

  return createTransactionSendingSigner({
    address: address(opts.account.address) as Address,
    signAndSend,
    modifyAndSign,
    defaultOptions: {
      preflightCommitment: "confirmed",
      skipPreflight: false,
    },
  });
}
