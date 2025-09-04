import type { Address, KeyPairSigner } from "@solana/kit";
import { address, generateKeyPairSigner } from "@solana/kit";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  createUIWalletSigner,
  makeModifyAndSign,
  makeSignMessages,
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

  return createUIWalletSigner({
    address: address(opts.account.address) as Address,
    signAndSend,
    modifyAndSign,
    defaultOptions: {
      preflightCommitment: "confirmed",
      skipPreflight: false,
    },
  });
}
