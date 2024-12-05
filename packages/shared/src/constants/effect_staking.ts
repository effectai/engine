export const effect_staking = {
  "address": "3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw",
  "metadata": {
    "name": "effect_staking",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Effect Staking Program."
  },
  "instructions": [
    {
      "name": "close",
      "docs": [
        "Close a [StakeAccount](#stake-account) and [VaultAccount](#vault-account)."
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
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "stake",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "stake"
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
      "name": "stake",
      "discriminator": [
        206,
        176,
        202,
        18,
        200,
        209,
        179,
        108
      ],
      "accounts": [
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "stake",
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
                "path": "stake"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
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
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "duration",
          "type": "u128"
        }
      ]
    },
    {
      "name": "stake_genesis",
      "discriminator": [
        254,
        31,
        23,
        18,
        216,
        245,
        224,
        83
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "stake",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "claim_vault",
          "writable": true,
          "signer": true
        },
        {
          "name": "claim_account",
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
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "stake_start_time",
          "type": "i64"
        }
      ]
    },
    {
      "name": "topup",
      "docs": [
        "Top-up `amount` of [NOS](/tokens/token) of a [StakeAccount](#stake-account)."
      ],
      "discriminator": [
        126,
        42,
        49,
        78,
        225,
        151,
        99,
        77
      ],
      "accounts": [
        {
          "name": "user_token_account",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "stake",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "docs": [
        "Start the unstake duration."
      ],
      "discriminator": [
        90,
        95,
        107,
        42,
        205,
        124,
        50,
        225
      ],
      "accounts": [
        {
          "name": "stake",
          "writable": true
        },
        {
          "name": "vault_token_account",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "vesting_account",
          "writable": true,
          "signer": true
        },
        {
          "name": "reward_account",
          "writable": true
        },
        {
          "name": "vesting_vault_account",
          "writable": true
        },
        {
          "name": "recipient_token_account",
          "writable": true
        },
        {
          "name": "vesting_program",
          "address": "GSzDavs4yP5jqnVTnjjmJ9DJ5yUQ6AB7vBTNv2BBmaSe"
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
          "name": "mint"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
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
      "name": "InvalidVault",
      "msg": "This account has an invalid vault."
    },
    {
      "code": 6001,
      "name": "Unauthorized",
      "msg": "This account is not authorized to perform this action."
    },
    {
      "code": 6002,
      "name": "AlreadyUnstaked",
      "msg": "This stake is already unstaked."
    },
    {
      "code": 6003,
      "name": "Decreased",
      "msg": "This stake is not allowed to decrease."
    },
    {
      "code": 6004,
      "name": "NotUnstaked",
      "msg": "This stake is not yet unstaked."
    },
    {
      "code": 6005,
      "name": "Locked",
      "msg": "This stake is still locked."
    },
    {
      "code": 6006,
      "name": "VaultNotEmpty",
      "msg": "This vault is not empty."
    },
    {
      "code": 6007,
      "name": "DurationTooLong",
      "msg": "The stake duration is too long."
    },
    {
      "code": 6008,
      "name": "DurationTooShort",
      "msg": "The stake duration is too short."
    },
    {
      "code": 6009,
      "name": "VaultAuthorityMismatch",
      "msg": "The vault authority does not match."
    },
    {
      "code": 6010,
      "name": "AmountNotEnough",
      "msg": "The stake amount is not enough."
    },
    {
      "code": 6011,
      "name": "AlreadyStaked",
      "msg": "This stake is already staked."
    },
    {
      "code": 6012,
      "name": "InvalidRewardAccount",
      "msg": "Invalid reward account."
    },
    {
      "code": 6013,
      "name": "InvalidStakeAccount",
      "msg": "Invalid stake account."
    },
    {
      "code": 6014,
      "name": "StakeNotEmpty",
      "msg": "Stake acount is not empty."
    }
  ],
  "types": [
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
      "name": "STAKE_DURATION_MAX",
      "type": "u128",
      "value": "31536000"
    },
    {
      "name": "STAKE_DURATION_MIN",
      "type": "u128",
      "value": "2592000"
    },
    {
      "name": "STAKE_MINIMUM_AMOUNT",
      "type": "u64",
      "value": "0"
    }
  ]
} as const;
