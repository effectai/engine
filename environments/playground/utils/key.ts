import crypto from "node:crypto";

export function generateSeed() {
	return crypto.randomBytes(32);
}
