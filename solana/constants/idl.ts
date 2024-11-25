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
          "name": "staker_tokens",
          "writable": true
        },
        {
          "name": "stake",
          "writable": true
        },
        {
          "name": "vault",
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
          "name": "vault",
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
          "name": "staker_tokens",
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
          "name": "vault",
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
          "name": "staker_tokens",
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
          "name": "vault",
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
          "name": "staker_tokens",
          "writable": true
        },
        {
          "name": "vault",
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
      "name": "withdraw",
      "docs": [
        "Withdraw  [NOS](/tokens/token) that is released after an [unstake](#unstake)"
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "staker_tokens",
          "writable": true
        },
        {
          "name": "vault",
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
      "name": "AmountNotEnough",
      "msg": "This amount is not enough."
    },
    {
      "code": 6001,
      "name": "AlreadyInitialized",
      "msg": "This stake is already running."
    },
    {
      "code": 6002,
      "name": "AlreadyClaimed",
      "msg": "This stake is already claimed."
    },
    {
      "code": 6003,
      "name": "AlreadyStaked",
      "msg": "This stake is already staked."
    },
    {
      "code": 6004,
      "name": "AlreadyUnstaked",
      "msg": "This stake is already unstaked."
    },
    {
      "code": 6005,
      "name": "NotUnstaked",
      "msg": "This stake is not yet unstaked."
    },
    {
      "code": 6006,
      "name": "Locked",
      "msg": "This stake is still locked."
    },
    {
      "code": 6007,
      "name": "DurationTooShort",
      "msg": "This stake duration is not long enough."
    },
    {
      "code": 6008,
      "name": "DurationTooLong",
      "msg": "This stake duration is too long."
    },
    {
      "code": 6009,
      "name": "DoesNotExist",
      "msg": "This stake account does not exist."
    },
    {
      "code": 6010,
      "name": "Decreased",
      "msg": "This stake is not allowed to decrease."
    },
    {
      "code": 6011,
      "name": "InvalidStakeAccount",
      "msg": "This stake does not belong to the authority."
    },
    {
      "code": 6012,
      "name": "IncorrectSigner",
      "msg": "This stake does not belong to the signer."
    },
    {
      "code": 6013,
      "name": "VaultAuthorityMismatch",
      "msg": "This stake does not belong to the vault."
    }
  ],
  "types": [
    {
      "name": "StakeAccount",
      "docs": [
        "The `StakeAccount` struct holds all the information for any given stake."
      ],
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
            "name": "vault",
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
      "name": "DURATION_MAX",
      "type": "u128",
      "value": "31536000"
    },
    {
      "name": "DURATION_MIN",
      "type": "u128",
      "value": "1209600"
    },
    {
      "name": "SECONDS_PER_DAY",
      "type": "u128",
      "value": "86400"
    },
    {
      "name": "STAKE_MINIMUM",
      "type": "u64",
      "value": "0"
    },
    {
      "name": "XEFX_DIV",
      "type": "u128",
      "value": "10512000"
    },
    {
      "name": "XEFX_PRECISION",
      "type": "u128",
      "value": "1000000000000000"
    }
  ]
} as const;
