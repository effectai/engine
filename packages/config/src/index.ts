import { localnet } from "./profiles/localnet";
import { mainnet } from "./profiles/mainnet";

export * from "./schema";

export const profiles = {
  localnet,
  mainnet,
} as const;

export type ProfileName = keyof typeof profiles;
