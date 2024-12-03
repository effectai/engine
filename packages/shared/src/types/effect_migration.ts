/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/effect_migration.json`.
 */
export type EffectMigration = {
  "address": "BraRBZAVsUaxs46ob4gY5o9JvDHTGppChigyz7qwJm9g",
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
          "name": "claimAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "stakeAccount",
          "writable": true
        },
        {
          "name": "stakeVaultTokenAccount",
          "writable": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
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
          "address": "3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw"
        }
      ],
      "args": [
        {
          "name": "sig",
          "type": "bytes"
        },
        {
          "name": "message",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "claimTokens",
      "discriminator": [
        108,
        216,
        210,
        231,
        0,
        212,
        42,
        64
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
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
          "name": "claimAccount",
          "writable": true
        },
        {
          "name": "vaultAccount",
          "writable": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sig",
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
          "name": "claimAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "claimAccount"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "payerTokens",
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
          "name": "foreignPublicKey",
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
    },
    {
      "name": "createTokenClaim",
      "discriminator": [
        47,
        10,
        98,
        54,
        100,
        58,
        22,
        12
      ],
      "accounts": [
        {
          "name": "claimAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "claimAccount"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "payerTokens",
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
          "name": "foreignPublicKey",
          "type": "bytes"
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
      "name": "claimAccount",
      "discriminator": [
        113,
        109,
        47,
        96,
        242,
        219,
        61,
        165
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
      "name": "invalidMetadataAccount",
      "msg": "Invalid metadata provided."
    },
    {
      "code": 6004,
      "name": "invalidRecoveryId",
      "msg": "Invalid recovery id provided."
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
      "name": "invalidMessage",
      "msg": "Invalid transaction message."
    },
    {
      "code": 6008,
      "name": "memoNotFound",
      "msg": "Memo field not found in actions."
    }
  ],
  "types": [
    {
      "name": "claimAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "foreignPublicKey",
            "type": "bytes"
          },
          {
            "name": "claimType",
            "type": {
              "defined": {
                "name": "claimType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "claimType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "token",
            "fields": []
          },
          {
            "name": "stake",
            "fields": [
              {
                "name": "stakeStartTime",
                "type": "i64"
              }
            ]
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
            "name": "vaultTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "xefx",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "expectedMessage",
      "type": "string",
      "value": "\"Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: \""
    }
  ]
};
