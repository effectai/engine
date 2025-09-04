import { z } from "zod";

export const ProfileSchema = z.object({
  NAME: z.enum(["localnet", "mainnet"]),
  EFFECT_CLUSTER: z
    .enum(["localnet", "devnet", "testnet", "mainnet"])
    .default("mainnet"),

  EFFECT_SPL_MINT: z.string().min(32, "SPL mint address required"),
  EFFECT_SOLANA_RPC_NODE_URL: z.url(),
  EFFECT_SOLANA_RPC_WS_URL: z.url(),
});

export type Profile = z.infer<typeof ProfileSchema>;
