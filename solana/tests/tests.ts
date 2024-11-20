// external imports
import { before } from "mocha";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { constants } from "./contstants";
import { pda } from "./utils";
import { utf8 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// local test suites
import initTests from "./suites/1-initialization-tests";
import stakingTests from "./suites/2-staking-tests";
import snapshotMigrationTests from "./suites/3-solana-snapshot-migration";

// types
import type { EffectAccounts, EffectExists, EffectVaults } from "./types/effect";

// run
describe("effect programs", async () => {
  before(async function () {
    // anchor
    this.provider = anchor.AnchorProvider.env();
    this.connection = this.provider.connection;

    // main user
    this.wallet = this.provider.wallet as anchor.Wallet;
    this.publicKey = this.wallet.publicKey;
    this.payer = this.wallet.payer;

    // programs
    this.stakingProgram = anchor.workspace.EffectStaking;

    // constant values
    this.constants = constants;
    this.mint = new PublicKey("devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP");

    // dynamic values
    this.total = {
      xefx: new BN(0),
      reflection: new BN(0),
      rate: constants.initialRate,
    };
    this.users = {
      user1: null,
      user2: null,
      user3: null,
      user4: null,
      otherUsers: null,
    };
    this.nodes = { node1: null, node2: null, otherNodes: null };
    this.balances = {
      user: 0,
      vaultStaking: 0,
    };

    this.exists = {} as EffectExists;
    this.exists.stake = false;

    // token vaults public keys
    this.vaults = {} as EffectVaults;
    this.vaults.staking = await pda(
      [utf8.encode("vault"), this.mint.toBuffer(), this.publicKey.toBuffer()],
      this.stakingProgram.programId
    );

    // public keys to be used in the instructions
    this.accounts = {} as EffectAccounts;
    this.accounts.systemProgram = anchor.web3.SystemProgram.programId;
    this.accounts.tokenProgram = TOKEN_PROGRAM_ID;
    this.accounts.stakingProgram = this.stakingProgram.programId;
    this.accounts.rent = anchor.web3.SYSVAR_RENT_PUBKEY;
    this.accounts.authority = this.publicKey;
    this.accounts.payer = this.publicKey;
    this.accounts.project = this.publicKey;
    this.accounts.mint = this.mint;
    this.accounts.user = await getAssociatedTokenAddress(
      this.mint,
      this.publicKey
    );
    this.accounts.deposit = this.accounts.user;
    this.accounts.settings = await pda(
      [utf8.encode("settings")],
      this.stakingProgram.programId
    );
    this.accounts.tokenAccount = this.accounts.user;
    this.accounts.stake = await pda(
      [utf8.encode("stake"), this.mint.toBuffer(), this.publicKey.toBuffer()],
      this.stakingProgram.programId
    );
  });

  switch (process.env.TEST_SCENARIO) {
    case "staking":
      describe("initialization", initTests);
      describe("staking", stakingTests);
      break;
    case "snapshot":
      describe("initialization", initTests);
      describe("snapshot", snapshotMigrationTests);
      break;
    default:
      describe("initialization", initTests);
      describe("staking", stakingTests);
      describe("snapshot", snapshotMigrationTests);
  }
});
