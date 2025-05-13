import { BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PublicKey } from "@solana/web3.js";

export const calculateStakeAge = (timestamp: number) => {
  const now = Date.now() / 1000;
  const stakeAge = (now - timestamp) / 100;
  const maxStakeAge = (1000 * 24 * 60 * 60) / 100;
  return Math.min(stakeAge, maxStakeAge);
};

export function isValidSolanaAddress(address: string) {
  try {
    const decoded = bs58.decode(address);

    if (decoded.length !== 32) {
      return false;
    }

    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

export function extractAuthorizedSolanaAddress(text: string) {
  const pattern =
    /I authorize my tokens to be claimed at the following Solana address:\s*([1-9A-HJ-NP-Za-km-z]{32,44})/;
  const match = text.match(pattern);

  if (match) {
    const address = match[1];
    try {
      new PublicKey(address);
      return address;
    } catch {
      return null;
    }
  }
  return null; // No match found
}

export function calculateApy({
  yourStake,
  totalStaked,
  totalRewards,
}: {
  yourStake: BN;
  totalStaked: BN;
  totalRewards: number;
}) {
  const parsedStake = yourStake.div(new BN(1e6)).toNumber();
  const parsedTotalStaked = totalStaked.div(new BN(1e6)).toNumber();

  const yourStakePercentage = parsedStake / parsedTotalStaked;
  const yourTotalRewards = yourStakePercentage * totalRewards;
  const totalApy = (yourTotalRewards / parsedStake) * 100;

  return totalApy.toFixed(2);
}

export function calculatePendingRewards({
  reflection,
  rate,
  weightedAmount,
}: {
  reflection: BN;
  rate: BN;
  weightedAmount: BN;
}) {
  const reward = reflection.div(rate).sub(weightedAmount);
  return +(reward.toNumber() / 1e6).toFixed(4);
}

export const calculateDue = (
  startTime: number,
  releaseRate: number,
  distributedTokens: number,
  amountAvailable: number,
): number => {
  // get now as a unix timestamp
  const now = Math.floor(new Date().getTime() / 1000);

  if (now < startTime) {
    return 0;
  }

  const poolAmount = (now - startTime) * releaseRate;

  const amountDue = poolAmount - distributedTokens;
  return Math.min(amountDue, amountAvailable * 1_000_000);
};

export function chunkArray(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
}
