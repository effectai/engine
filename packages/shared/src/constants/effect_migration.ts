export const effect_migration = {
  "address": "BraRBZAVsUaxs46ob4gY5o9JvDHTGppChigyz7qwJm9g",
  "metadata": {
    "name": "effect_migration",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claim_stake",
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
            "stake_account"
          ]
        },
        {
          "name": "recipient_token_account",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "claim_account",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true
        },
        {
          "name": "stake_account",
          "writable": true
        },
        {
          "name": "stake_vault_token_account",
          "writable": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "staking_program",
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
      "name": "claim_tokens",
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
          "name": "recipient_token_account",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "claim_account",
          "writable": true
        },
        {
          "name": "vault_account",
          "writable": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
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
      "name": "create_stake_claim",
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
          "name": "claim_account",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "claim_account"
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
          "signer": true,
          "address": "authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV"
        },
        {
          "name": "payer_tokens",
          "writable": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "foreign_public_key",
          "type": "bytes"
        },
        {
          "name": "stake_start_time",
          "type": "i64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "create_token_claim",
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
          "name": "claim_account",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "claim_account"
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
          "signer": true,
          "address": "authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV"
        },
        {
          "name": "payer_tokens",
          "writable": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "foreign_public_key",
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
      "name": "ClaimAccount",
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
      "name": "StakeAccount",
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
      "name": "MessageInvalid",
      "msg": "Invalid message provided."
    },
    {
      "code": 6001,
      "name": "InvalidSignature",
      "msg": "Invalid signature provided."
    },
    {
      "code": 6002,
      "name": "PublicKeyMismatch",
      "msg": "Public key does not match the foreign public key."
    },
    {
      "code": 6003,
      "name": "InvalidClaimAccount",
      "msg": "Invalid claim account provided."
    },
    {
      "code": 6004,
      "name": "InvalidRecoveryId",
      "msg": "Invalid recovery id."
    },
    {
      "code": 6005,
      "name": "InvalidActions",
      "msg": "Invalid action provided."
    },
    {
      "code": 6006,
      "name": "MemoMismatch",
      "msg": "The memo in the transaction does not match the expected value."
    },
    {
      "code": 6007,
      "name": "MemoNotFound",
      "msg": "Memo field not found in actions."
    },
    {
      "code": 6008,
      "name": "InvalidMint",
      "msg": "Invalid mint provided."
    },
    {
      "code": 6009,
      "name": "InvalidForeignPublicKey",
      "msg": "Invalid Foreign Public Key"
    },
    {
      "code": 6010,
      "name": "InvalidStakeStartTime",
      "msg": "Invalid Stake Start Time"
    }
  ],
  "types": [
    {
      "name": "ClaimAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "foreign_public_key",
            "type": "bytes"
          },
          {
            "name": "claim_type",
            "type": {
              "defined": {
                "name": "ClaimType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "ClaimType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Token",
            "fields": []
          },
          {
            "name": "Stake",
            "fields": [
              {
                "name": "stake_start_time",
                "type": "i64"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "StakeAccount",
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
            "name": "lock_duration",
            "type": "u64"
          },
          {
            "name": "stake_start_time",
            "type": "i64"
          },
          {
            "name": "vault_token_account",
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
      "name": "EXPECTED_MESSAGE",
      "type": "string",
      "value": "\"Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: \""
    }
  ]
} as const;
