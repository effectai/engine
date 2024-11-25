import type { GlobalSetupContext } from "vitest/node";

export default async function setup({ provide }: GlobalSetupContext) {
	// global setup for tests
}

declare module "vitest" {
	export interface ProvidedContext {
		tokenMint: string;
        tokenAccount: string;
	}
}
