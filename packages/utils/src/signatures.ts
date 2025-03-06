// import { PublicKey, TransactionInstruction } from "@solana/web3.js";
// import { struct, u8, u16 } from "@solana/buffer-layout";
//
// const SIGNATURE_SIZE = 64;
// const PUBKEY_SIZE = 32;
// const HEADER_SIZE = 2;
// const SIGNATURE_OFFSETS_SIZE = 14;
//
// const ED25519_PROGRAM_ID = new PublicKey(
// 	"Ed25519SigVerify111111111111111111111111111",
// );
//
// //struct for the Ed25519 signature verification instruction
// const Ed25519SignatureOffsets = struct([
// 	u16("signature_offset"),
// 	u16("signature_instruction_index"),
// 	u16("public_key_offset"),
// 	u16("public_key_instruction_index"),
// 	u16("message_data_offset"),
// 	u16("message_data_size"),
// 	u16("message_instruction_index"),
// ]);
//
// /**
//  * Creates an Ed25519 signature verification instruction.
//  * @param paramsArray - Array of { signature, message, publicKey } objects.
//  * @returns A Solana TransactionInstruction.
//  */
// export function createEd25519Instruction(
// 	paramsArray: { signature: Buffer; message: Buffer; publicKey: Buffer }[],
// ): TransactionInstruction {
// 	if (paramsArray.length === 0) {
// 		throw new Error("At least one signature is required.");
// 	}
//
// 	const numSignatures = paramsArray.length;
// 	const offsetsStart = HEADER_SIZE + numSignatures * SIGNATURE_OFFSETS_SIZE;
// 	const instructionData = Buffer.alloc(offsetsStart);
//
// 	instructionData.writeUInt8(numSignatures, 0);
//
// 	//padding byte
// 	instructionData.writeUInt8(0, 1);
//
// 	let dynamicData = Buffer.alloc(0);
//
// 	paramsArray.forEach(({ signature, message, publicKey }, i) => {
// 		if (
// 			signature.length !== SIGNATURE_SIZE ||
// 			publicKey.length !== PUBKEY_SIZE
// 		) {
// 			throw new Error("Invalid signature or public key length.");
// 		}
//
// 		const signatureOffset = offsetsStart + dynamicData.length;
// 		const publicKeyOffset = signatureOffset + SIGNATURE_SIZE;
// 		const messageOffset = publicKeyOffset + PUBKEY_SIZE;
// 		const messageSize = message.length;
//
// 		dynamicData = Buffer.concat([dynamicData, signature, publicKey, message]);
//
// 		Ed25519SignatureOffsets.encode(
// 			{
// 				signature_offset: signatureOffset,
// 				signature_instruction_index: 0xffff,
// 				public_key_offset: publicKeyOffset,
// 				public_key_instruction_index: 0xffff,
// 				message_data_offset: messageOffset,
// 				message_data_size: messageSize,
// 				message_instruction_index: 0xffff,
// 			},
// 			instructionData,
// 			HEADER_SIZE + i * SIGNATURE_OFFSETS_SIZE,
// 		);
// 	});
//
// 	const finalInstructionData = Buffer.concat([instructionData, dynamicData]);
//
// 	return new TransactionInstruction({
// 		keys: [],
// 		programId: ED25519_PROGRAM_ID,
// 		data: finalInstructionData,
// 	});
// }
