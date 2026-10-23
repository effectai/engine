import { localnet } from "./profiles/localnet.js";
import { mainnet } from "./profiles/mainnet.js";

export * from "./schema";

export const profiles = {
  localnet,
  mainnet,
} as const;

export type ProfileName = keyof typeof profiles;
