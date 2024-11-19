import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const decimals = 1e6;
const secondsPerDay = 24 * 60 * 60;
const initialRate = new BN("3402823669209384634633746");

const constants = {
  allowedClockDelta: 3000,
  emission: 20,
  secondsPerDay,
  stakeDurationMin: 14 * secondsPerDay,
  stakeDurationMax: 365 * secondsPerDay,
  decimals,
  mintSupply: 1e7 * decimals,
  userSupply: 1e5 * decimals,
  jobPrice: decimals,
  feePercentage: 10,
  stakeAmount: 1e4 * decimals,
  stakeMinimum: 0,
  slashAmount: 1e3 * decimals,
  minimumNodeStake: 1e4 * decimals,
  feeAmount: 1e5 * decimals,
  jobTimeout: 5,
  jobExtendTimeout: 10,
  jobExpiration: 5,
  initialRate,

  stakingProgramAddress: new PublicKey(
    "effScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE"
  ),

  errors: {
    // generic errors
    Unauthorized: "This account is not authorized to perform this action.",
    InvalidAccount: "This account is not valid.",
    InvalidOwner: "This account is owned by an invalid program.",
    InvalidTokenAccount: "This token account is not valid.",
    InvalidMint: "This mint is invalid.",
    InvalidVault: "This account has an invalid vault.",
    VaultNotEmpty: "This vault is not empty.",

    // stake errors
    StakeAmountNotEnough: "This amount is not enough.",
    StakeAlreadyInitialized: "This stake is already running.",
    StakeAlreadyClaimed: "This stake is already claimed.",
    StakeAlreadyStaked: "This stake is already staked.",
    StakeAlreadyUnstaked: "This stake is already unstaked.",
    StakeNotUnstaked: "This stake is not yet unstaked.",
    StakeLocked: "This stake is still locked.",
    StakeDurationTooShort: "This stake duration is not long enough.",
    StakeDurationTooLong: "This stake duration is too long.",
    StakeDoesNotExist: "This stake account does not exist.",
    StakeDecreased: "This stake is not allowed to decrease.",
    InvalidStakeAccount: "This stake does not belong to the authority.",

    // anchor errors
    Solana8ByteConstraint:
      "8 byte discriminator did not match what was expected",
    SolanaAccountNotInitialized:
      "The program expected this account to be already initialized",
    SolanaTokenOwnerConstraint: "A token owner constraint was violated",
  },
};

export { constants };
