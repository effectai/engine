export const stakingIdl = {
  "address": "eR1sM73NpFqq7DSR5YDAgneWW29AZA8sRm1BFakzYpH",
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
      "name": "extend",
      "docs": [
        "Extend the `duration` of a [StakeAccount](#stake-account)."
      ],
      "discriminator": [
        228,
        127,
        0,
        1,
        227,
        154,
        54,
        168
      ],
      "accounts": [
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
        }
      ],
      "args": [
        {
          "name": "duration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "restake",
      "docs": [
        "Make a stake active again and reset the unstake time."
      ],
      "discriminator": [
        97,
        161,
        241,
        167,
        6,
        32,
        213,
        53
      ],
      "accounts": [
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
        }
      ],
      "args": []
    },
    {
      "name": "stake",
      "docs": [
        "Initialize the [SettingsAccount](#settings-account).",
        "Create a [StakeAccount](#stake-account) and [VaultAccount](#vault-account).",
        "Stake `amount` of [NOS](/tokens/token) tokens for `duration` fo seconds."
      ],
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
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
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
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
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
          "name": "claim_vault",
          "writable": true,
          "signer": true
        },
        {
          "name": "metadata"
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
          "name": "vesting_account_unchecked",
          "writable": true
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
          "address": "EabRXJfYfzbkTTq5546mxDiT5yv2k2rjjN4kY6c4S9Br"
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
            "name": "duration",
            "type": "u64"
          },
          {
            "name": "time_unstake",
            "type": "i64"
          },
          {
            "name": "time_stake",
            "type": "i64"
          },
          {
            "name": "vault_token_account",
            "type": "pubkey"
          },
          {
            "name": "vault_bump",
            "type": "u8"
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
