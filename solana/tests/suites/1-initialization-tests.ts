import { expect } from "chai";
import {
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  transfer,
} from "@solana/spl-token";
import {
  createNosMint,
  getTokenBalance,
  getUsers,
  mapUsers,
  mintNosTo,
} from "../utils";

export default function suite() {
  describe("mints and users", function () {
    it("can create mint", async function () {
      expect(
        (
          await createNosMint(this.connection, this.payer, this.publicKey)
        ).toString()
      ).to.equal(this.mint.toString());
    });

    it("can create main user and fund mint", async function () {
      // ata
      expect(
        (
          await createAssociatedTokenAccount(
            this.connection,
            this.payer,
            this.mint,
            this.publicKey
          )
        ).toString()
      ).to.equal(this.accounts.user.toString());

      // fund user
      await mintNosTo(this, this.accounts.user, this.constants.mintSupply);
      this.balances.user += this.constants.mintSupply;
      expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(
        this.balances.user
      );
    });

    it("can create more funded users and nodes", async function () {
      // users & nodes
      this.users.users = await getUsers(this, 10);
      this.users.nodes = await getUsers(this, 10);
      [this.users.node1, this.users.node2, ...this.users.otherNodes] =
        this.users.nodes;
      [
        this.users.user1,
        this.users.user2,
        this.users.user3,
        this.users.user4,
        ...this.users.otherUsers
      ] = this.users.users;
    });
  });
}
