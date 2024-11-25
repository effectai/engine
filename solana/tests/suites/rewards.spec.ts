import { describe, it } from "vitest";
import { useAnchor } from "../helpers.js";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectRewards } from "../../target/types/effect_rewards.js";
const SECONDS_PER_DAY = 24 * 60 * 60;

describe("Effect Reward Program", async () => {
	const program = anchor.workspace.EffectRewards as Program<EffectRewards>;
	const { provider, wallet, payer, expectAnchorError } = useAnchor();

    describe("Reward Initialize", async () => {
        it.concurrent("should correctly initialize a stake account", async () => {
        });
    });

});
