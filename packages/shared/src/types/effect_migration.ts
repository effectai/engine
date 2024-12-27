/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/effect_migration.json`.
 */
export type EffectMigration = {
  "address": "effectmigration",
  "metadata": {
    "name": "effectMigration",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimStake",
      "discriminator": [
        62,
        145,
        133,
        242,
        244,
        59,
        53,
        139
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "stakeAccount"
          ]
        },
        {
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "migrationAccount",
          "writable": true
        },
        {
          "name": "migrationVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "migrationAccount"
              }
            ]
          }
        },
        {
          "name": "stakeAccount",
          "writable": true
        },
        {
          "name": "stakeVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stakeAccount"
              }
            ],
            "program": {
              "kind": "account",
              "path": "stakingProgram"
            }
          }
        },
        {
          "name": "rentReceiver",
          "writable": true,
          "address": "authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "migrationProgram",
          "address": "mkBkDyshkoJ3c1TdjNxwM4jUkA6qBbtSQHeMjr4atxH"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "stakingProgram",
          "address": "6EQ532strjkZpAvqd4JhtJxMppinnDJi7kynvBWut7C2"
        }
      ],
      "args": [
        {
          "name": "signature",
          "type": "bytes"
        },
        {
          "name": "message",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "createStakeClaim",
      "discriminator": [
        209,
        124,
        209,
        232,
        131,
        66,
        118,
        116
      ],
      "accounts": [
        {
          "name": "migrationAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "foreignAddress"
              }
            ]
          }
        },
        {
          "name": "claimVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "migrationAccount"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "address": "authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV"
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "foreignAddress",
          "type": "bytes"
        },
        {
          "name": "stakeStartTime",
          "type": "i64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "migrationAccount",
      "discriminator": [
        129,
        168,
        118,
        35,
        238,
        212,
        16,
        172
      ]
    },
    {
      "name": "stakeAccount",
      "discriminator": [
        80,
        158,
        67,
        124,
        50,
        189,
        192,
        255
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "messageInvalid",
      "msg": "Invalid message provided."
    },
    {
      "code": 6001,
      "name": "invalidSignature",
      "msg": "Invalid signature provided."
    },
    {
      "code": 6002,
      "name": "publicKeyMismatch",
      "msg": "Public key does not match the foreign public key."
    },
    {
      "code": 6003,
      "name": "invalidClaimAccount",
      "msg": "Invalid claim account provided."
    },
    {
      "code": 6004,
      "name": "invalidRecoveryId",
      "msg": "Invalid recovery id."
    },
    {
      "code": 6005,
      "name": "invalidActions",
      "msg": "Invalid action provided."
    },
    {
      "code": 6006,
      "name": "memoMismatch",
      "msg": "The memo in the transaction does not match the expected value."
    },
    {
      "code": 6007,
      "name": "memoNotFound",
      "msg": "Memo field not found in actions."
    },
    {
      "code": 6008,
      "name": "invalidMint",
      "msg": "Invalid mint provided."
    },
    {
      "code": 6009,
      "name": "invalidForeignAddress",
      "msg": "Invalid Foreign Address"
    },
    {
      "code": 6010,
      "name": "invalidStakeStartTime",
      "msg": "Invalid Stake Start Time"
    },
    {
      "code": 6011,
      "name": "claimingNotStarted",
      "msg": "Claming not started yet."
    }
  ],
  "types": [
    {
      "name": "migrationAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "foreignAddress",
            "type": "bytes"
          },
          {
            "name": "stakeStartTime",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "stakeAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "lockDuration",
            "type": "u64"
          },
          {
            "name": "stakeStartTime",
            "type": "i64"
          },
          {
            "name": "weightedAmount",
            "type": "u128"
          },
          {
            "name": "mint",
            "type": "pubkey"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "expectedMessage",
      "type": "string",
      "value": "\"Effect.AI: I authorize my tokens to be claimed at the following Solana address\""
    }
  ]
};
