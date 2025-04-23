import type { ProofResponse } from "@effectai/protocol";

export function bigIntToBytes32(num) {
	let hex = BigInt(num).toString(16);

	hex = hex.padStart(64, "0");

	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, (i + 1) * 2), 16);
	}
	return bytes;
}

export function concatenateUint8Arrays(arrays) {
	// Calculate total length
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	// Create new array with total length
	const result = new Uint8Array(totalLength);
	// Copy each array into result
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

export function convertProofToBytes(proof: ProofResponse) {
	// Convert pi_a components
	const pi_a = [bigIntToBytes32(proof.piA[0]), bigIntToBytes32(proof.piA[1])];

	// Convert pi_b components (note the reversed order within pairs)
	const pi_b = [
		// First pair
		bigIntToBytes32(proof.piB[0].row[1]), // Reversed order
		bigIntToBytes32(proof.piB[0].row[0]),
		// Second pair
		bigIntToBytes32(proof.piB[1].row[1]), // Reversed order
		bigIntToBytes32(proof.piB[1].row[0]),
	];

	// Convert pi_c components
	const pi_c = [bigIntToBytes32(proof.piC[0]), bigIntToBytes32(proof.piC[1])];

	// Concatenate all components
	const allBytes = concatenateUint8Arrays([...pi_a, ...pi_b, ...pi_c]);

	return allBytes;
}
