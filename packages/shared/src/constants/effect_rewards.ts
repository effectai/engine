export const effect_rewards = {
  "address": "HJR3op52N7tNycXqQnVu8cDnxH7udp4pYi1ps9S1hdBz",
  "metadata": {
    "name": "effect_rewards",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Reflection rewards for Effect AI"
  },
  "instructions": [
    {
      "name": "claim",
      "docs": [
        "Claim rewards from a [RewardsAccount](#rewards-account) and [VaultAccount](#vault-account)."
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
          "name": "reflection_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "recipient_token_account.mint",
                "account": "TokenAccount"
              }
            ]
          }
        },
        {
          "name": "reward_vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "reflection_account"
              }
            ]
          }
        },
        {
          "name": "stake_account"
        },
        {
          "name": "reward_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stake_account"
              }
            ]
          }
        },
        {
          "name": "recipient_token_account",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "stake_account",
            "reward_account"
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
      "name": "claim_stream",
      "discriminator": [
        157,
        247,
        164,
        226,
        240,
        158,
        183,
        36
      ],
      "accounts": [
        {
          "name": "reflection_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vesting_vault_token_account.mint",
                "account": "TokenAccount"
              }
            ]
          }
        },
        {
          "name": "reward_vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "reflection_account"
              }
            ]
          }
        },
        {
          "name": "vesting_account",
          "writable": true
        },
        {
          "name": "vesting_vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vesting_account"
              }
            ],
            "program": {
              "kind": "account",
              "path": "vesting_program"
            }
          }
        },
        {
          "name": "claim_authority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "vesting_program",
          "address": "GSzDavs4yP5jqnVTnjjmJ9DJ5yUQ6AB7vBTNv2BBmaSe"
        }
      ],
      "args": []
    },
    {
      "name": "close",
      "docs": [
        "Close a [RewardsAccount](#rewards-account)."
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
          "name": "reflection_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "stake_vault_token_account.mint",
                "account": "TokenAccount"
              }
            ]
          }
        },
        {
          "name": "reward_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stake_account"
              }
            ]
          }
        },
        {
          "name": "stake_account",
          "writable": true
        },
        {
          "name": "stake_vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stake_account"
              }
            ],
            "program": {
              "kind": "account",
              "path": "stake_program"
            }
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "stake_account"
          ]
        },
        {
          "name": "stake_program",
          "address": "3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw"
        }
      ],
      "args": []
    },
    {
      "name": "enter",
      "docs": [
        "Initialize a [RewardsAccount](#rewards-account)."
      ],
      "discriminator": [
        139,
        49,
        209,
        114,
        88,
        91,
        77,
        134
      ],
      "accounts": [
        {
          "name": "reflection_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "stake_account",
          "writable": true
        },
        {
          "name": "stake_vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stake_account"
              }
            ],
            "program": {
              "kind": "account",
              "path": "stake_program"
            }
          }
        },
        {
          "name": "reward_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stake_account"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "stake_account"
          ]
        },
        {
          "name": "mint"
        },
        {
          "name": "stake_program",
          "address": "3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "init",
      "docs": [
        "Initialize the [ReflectionAccount](#reflection-account) and [VaultAccount](#vault_token_account-account)."
      ],
      "discriminator": [
        220,
        59,
        207,
        236,
        108,
        250,
        47,
        100
      ],
      "accounts": [
        {
          "name": "reflection_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "reward_vault_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "reflection_account"
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
      "args": []
    },
    {
      "name": "sync",
      "docs": [
        "Re-calculate reflection points."
      ],
      "discriminator": [
        4,
        219,
        40,
        164,
        21,
        157,
        189,
        88
      ],
      "accounts": [
        {
          "name": "stake_account"
        },
        {
          "name": "reward_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stake_account"
              }
            ]
          }
        },
        {
          "name": "stake_vault_token_account",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stake_account"
              }
            ],
            "program": {
              "kind": "account",
              "path": "stake_program"
            }
          }
        },
        {
          "name": "reflection_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "stake_vault_token_account.mint",
                "account": "TokenAccount"
              }
            ]
          }
        },
        {
          "name": "stake_program",
          "address": "3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "ReflectionAccount",
      "discriminator": [
        205,
        153,
        160,
        54,
        239,
        26,
        219,
        188
      ]
    },
    {
      "name": "RewardAccount",
      "discriminator": [
        225,
        81,
        31,
        253,
        84,
        234,
        171,
        129
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
    },
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
      "name": "NoClaimableRewards",
      "msg": "No Claimable Rewards"
    },
    {
      "code": 6005,
      "name": "InvalidMint",
      "msg": "Invalid Mint"
    }
  ],
  "types": [
    {
      "name": "ReflectionAccount",
      "docs": [
        "The `ReflectionAccount` struct holds all the information on the reflection pool."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "rate",
            "type": "u128"
          },
          {
            "name": "total_reflection",
            "type": "u128"
          },
          {
            "name": "total_weighted_amount",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "RewardAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "reflection",
            "type": "u128"
          },
          {
            "name": "weighted_amount",
            "type": "u128"
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
            "name": "weighted_amount",
            "type": "u128"
          },
          {
            "name": "mint",
            "type": "pubkey"
          }
        ]
      }
    },
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
