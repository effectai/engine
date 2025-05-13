import {
  ABICache,
  Action,
  Session,
  Transaction,
  TransactionHeader,
} from "@wharfkit/session";
import { WalletPluginPrivateKey } from "@wharfkit/wallet-plugin-privatekey";

export const createDummyEosTransactionWithMemo = async (memo: string) => {
  const session = new Session({
    permissionLevel: {
      actor: "effectai",
      permission: "active",
    },
    chain: {
      id: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
      url: "https://eos.greymass.com",
    },
    walletPlugin: new WalletPluginPrivateKey(
      "5K5UuCj9PmMSFTyiWzTtPF4VmUftVqScM3QJd9HorrZGCt4LgLu"
    ),
  });

  const abi = new ABICache(session.client);
  const eosAbi = await abi.getAbi("eosio.token");

  const action = Action.from(
    {
      account: "effecttokens",
      name: "issue",
      authorization: [
        {
          actor: "effectai",
          permission: "active",
        },
      ],
      data: {
        to: "effectai",
        quantity: "0 EFX",
        memo,
      },
    },
    eosAbi
  );

  // serialize the transaction
  const txHeader = TransactionHeader.from({
    expiration: 0,
    ref_block_num: 11,
    ref_block_prefix: 32,
    delay_sec: 0,
  });

  const tx = Transaction.from({
    actions: [action],
    ...txHeader,
  });

  return { tx, session };
};
