import { createWorkerNode } from "@effectai/protocol";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";

// export default defineNuxtPlugin(async (nuxt) => {
// 	const config = useRuntimeConfig();
// 	const privateKey = localStorage.getItem("privateKey");
// 	const privateKeyHex = Buffer.from(privateKey as string, "hex");
// 	const key = await generateKeyPairFromSeed(
// 		"Ed25519",
// 		privateKeyHex.slice(0, 32),
// 	);
// 	const node = await createWorkerNode(
// 		[config.public.MANAGER_MULTI_ADDRESS],
// 		key,
// 	);
// 	nuxt.provide("node", node);
// });
