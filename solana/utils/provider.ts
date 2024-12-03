import { getPayer, getRpcUrl } from "@effectai/utils";
import * as anchor from "@coral-xyz/anchor";

export const loadProvider = async () => {
	const rpcUrl = await getRpcUrl();
	const connection = new anchor.web3.Connection(rpcUrl);

	const payer = await getPayer();
	const wallet = new anchor.Wallet(payer);

	const provider = new anchor.AnchorProvider(connection, wallet);

    return {
        payer,
        provider,
    }
};
