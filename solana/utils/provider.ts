import { getPayer, getRpcUrl } from "@effectai/utils";
import * as anchor from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";

export const loadProvider = async () => {
	const rpcUrl = await getRpcUrl();
	const connection = new Connection(rpcUrl)
	
	const payer = await getPayer();
	const wallet = new anchor.Wallet(payer);

	const provider = new anchor.AnchorProvider(connection, wallet);

	const version = await provider.connection.getVersion();
	console.log(`Connected to Solana v${version["solana-core"]}`);


    return {
        payer,
        provider,
    }
};
