// import { type Address, getProgramDerivedAddress } from "@solana/web3.js";

import { PublicKey } from "@solana/web3.js";

// export const deriveMetadataAndVaultFromPublicKey = async (
// 	payer: Address,
// 	mint: Address,
// 	foreignPubKey: Uint8Array,
// 	programId: Address,
// ) => {
// 	const [metadata] = await getProgramDerivedAddress({
// 		seeds: [payer, mint, foreignPubKey],
// 		programAddress: programId,
// 	});

// 	const [vault] = await getProgramDerivedAddress({
// 		seeds: [metadata],
// 		programAddress: programId,
// 	});

// 	return { metadata, vault };
// };

export const deriveMetadataAndVaultFromPublicKey = ({
	stakeStartTime,
	payer,
	mint,
	foreignPubKey,
	programId,
}: { 
	stakeStartTime: number,
	payer: PublicKey,
	mint: PublicKey,
	foreignPubKey: Uint8Array,
	programId: PublicKey,
}) => {

	const preSeed = stakeStartTime > 0 ? 'stake' : 'token';

	const [metadata] = PublicKey.findProgramAddressSync(
		[Buffer.from(preSeed), payer.toBuffer(), mint.toBuffer(), foreignPubKey],
		programId,
	);

	const [vault] = PublicKey.findProgramAddressSync(
		[metadata.toBuffer()],
		programId,
	);

	return { metadata, vault };
}