
## General 

**Common packages**  
All contracts now have their own **common package** that includes structs and struct logic.

This is a bit of an **Anchor hack**: the `#[account]` macro always expects a `declare_id!()` in the root `lib.rs`, and since only one `declare_id!()` can exist per package, a global shared structure isn't supported. To avoid circular dependencies while still sharing simple things like structs between packages, we've implemented this workaround.

An alternative would be to ditch the `#[account]` macro entirely and handle serialization/deserialization manually. However, that approach introduces a ton of boilerplate and potential for errors, so we opted for a cleaner solution here.

another alternative is to build better support for this into anchor through opening a PR, i've checked some of the tickets and it looks like they were hinting towards possibly implementing something like this in the future:

https://github.com/coral-xyz/anchor/issues/3285#issuecomment-2380573058

**Renamed fields to be more descriptive**  
 - renamed data accounts to always end on _account for example:
 
	stake -> stake_account.  
	reward -> reward_account.  

 - renamed token accounts to always end on _token_account, and prefix it with the type of token_account:  
	 vault -> staking_vault_token_account  
	 vault -> vesting_vault_token_account  
	 user -> user_token_account  

this is especially useful in instructions where multiple vault accounts were being called.

**Removed mint locks everywhere**  
old contracts included mint constraints on both the **reflection** and **staking** contracts, restricting operations to a single specific mint. While this approach is simple, it feels a bit limiting. By implementing good/secure validation and ensuring PDA/seed matching, we can enable our contracts to handle multiple mints, as long as they remain paired to the correct one. This unlocks some new potential features, Although it introduces added complexity in terms of extra constraints, the trade off seems worthwhile for the additional flexibility that it brings.

## Staking Contract  

**Added Vested unstake**  
unstakes now open a vesting contract with a built in delay of 10 days (configurable) and release linearly over a period of 30 days (configurable)

**Added Multiple stakes**  
Removed the PDA seeds from staking accounts, they are now created by passing a keypair and signing with it

**Added Genesis Stake**  
a instruction that tops up an existing stake account with a certain stake_start_time, only executable when signed by a vault account PDA that originated from the migration contract

**Added a dilute mechanic to topups**  
calling a topup instruction now dilutes the stake accounts `stake_start_time` field with a weighted average of the current stake time/amount

**removed unused instructions**  
removed extend, slash, restake, update_settings, withdraw instructions


## Vesting Contract

- added a 1 byte discriminator tag into the `vesting_account` used for clients to distinguish between different types of vesting contracts (e.g. unstakes, normal vesting etc.)

- removed the reward dependency from the vesting contracts

- added flag `is_restricted_claim` to vesting account when `true` only the authority is allowed to claim the vesting.

- added `update_authority` instruction to vesting contracts

## Reward  Contract
- a reward account is now derived from the seeds of a stake account, making their relation 1:1

- added a `claim_stream` instruction which expects a vesting account, and claims it.

- We can setup and configure a vesting account with `is_restricted_claim` and then call `update_authority` to set the owner to a PDA of the vesting contract, the vesting contract is then the only one that can claim it through calling `claim_stream`

- renamed xnos to `weighted_amount` 
- removed multiplier when calculating `weighted_amount`

- reflection account is now derived from the mint