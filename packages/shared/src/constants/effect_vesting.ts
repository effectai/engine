export const effect_vesting = {
  "address": "GSzDavs4yP5jqnVTnjjmJ9DJ5yUQ6AB7vBTNv2BBmaSe",
  "metadata": {
    "name": "effect_vesting",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Effect Vesting."
  },
  "instructions": [
    {
      "name": "claim",
      "docs": [
        "Claim emission from a [PoolAccount](#pool-account) with claim type [`0`](#claim-type)"
      ],
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "vesting_account",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vesting_account"
              }
            ]
          }
        },
        {
          "name": "recipient_token_account",
          "writable": true,
          "relations": [
            "vesting_account"
          ]
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "close",
      "docs": [
        "Close a [PoolAccount](#pool-account) and [VaultAccount](#vault-account)."
      ],
      "discriminator": [
        98,
        165,
        201,
        177,
        108,
        65,
        206,
        96
      ],
      "accounts": [
        {
          "name": "vesting_account",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vesting_account"
              }
            ]
          }
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "vesting_account"
          ]
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "open",
      "docs": [
        "Open a [PoolAccount](#pool-account) and [VaultAccount](#vault-account)."
      ],
      "discriminator": [
        228,
        220,
        155,
        71,
        199,
        189,
        60,
        45
      ],
      "accounts": [
        {
          "name": "vesting_account",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vesting_account"
              }
            ]
          }
        },
        {
          "name": "recipient_token_account"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
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
          "name": "release_rate",
          "type": "u64"
        },
        {
          "name": "start_time",
          "type": "i64"
        },
        {
          "name": "is_closable",
          "type": "bool"
        },
        {
          "name": "is_restricted_claim",
          "type": "bool"
        },
        {
          "name": "tag",
          "type": {
            "option": {
              "array": [
                "u8",
                1
              ]
            }
          }
        }
      ]
    },
    {
      "name": "update_authority",
      "discriminator": [
        32,
        46,
        64,
        28,
        149,
        75,
        243,
        88
      ],
      "accounts": [
        {
          "name": "new_authority",
          "writable": true
        },
        {
          "name": "vesting_account",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "vesting_account"
          ]
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "update_recipient",
      "docs": [
        "Update the beneficiary in a [PoolAccount](#pool-account)."
      ],
      "discriminator": [
        55,
        190,
        61,
        121,
        131,
        132,
        8,
        54
      ],
      "accounts": [
        {
          "name": "recipient_token_account",
          "relations": [
            "vesting_account"
          ]
        },
        {
          "name": "new_recipient_token_account"
        },
        {
          "name": "vesting_account",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "VestingAccount",
      "discriminator": [
        102,
        73,
        10,
        233,
        200,
        188,
        228,
        216
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6001,
      "name": "NotStarted",
      "msg": "This pool has not started yet."
    },
    {
      "code": 6002,
      "name": "Underfunded",
      "msg": "This pool does not have enough funds."
    },
    {
      "code": 6003,
      "name": "NotCloseable",
      "msg": "This pool is not closeable."
    },
    {
      "code": 6004,
      "name": "WrongClaimType",
      "msg": "This pool has a different claim type."
    },
    {
      "code": 6005,
      "name": "WrongBeneficiary",
      "msg": "This pool does not match the beneficiary."
    },
    {
      "code": 6006,
      "name": "InvalidTokenAccount",
      "msg": "This pool has an invalid token account."
    },
    {
      "code": 6007,
      "name": "InvalidVault",
      "msg": "Invalid vault"
    },
    {
      "code": 6008,
      "name": "ClaimFailed",
      "msg": "Claim failed"
    }
  ],
  "types": [
    {
      "name": "VestingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "recipient_token_account",
            "type": "pubkey"
          },
          {
            "name": "distributed_tokens",
            "type": "u64"
          },
          {
            "name": "release_rate",
            "type": "u64"
          },
          {
            "name": "start_time",
            "type": "i64"
          },
          {
            "name": "is_closeable",
            "type": "bool"
          },
          {
            "name": "is_restricted_claim",
            "type": "bool"
          },
          {
            "name": "tag",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          }
        ]
      }
    }
  ]
} as const;
