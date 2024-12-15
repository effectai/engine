/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/effect_rewards.json`.
 */
export type EffectRewards = {
  "address": "effectrewards",
  "metadata": {
    "name": "effectRewards",
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
          "name": "reflectionAccount",
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
                "account": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "intermediateRewardVaultTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "reflectionAccount"
              }
            ]
          }
        },
        {
          "name": "rewardVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "intermediateRewardVaultTokenAccount"
              }
            ]
          }
        },
        {
          "name": "stakeAccount",
          "writable": true
        },
        {
          "name": "rewardAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stakeAccount"
              }
            ]
          }
        },
        {
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "stakeAccount",
            "rewardAccount"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
          "name": "reflectionAccount",
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
                "account": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "rewardAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stakeAccount"
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
              "path": "stakeProgram"
            }
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "stakeAccount"
          ]
        },
        {
          "name": "stakeProgram",
          "address": "5f7WaR7jC3metyDTSq7YGAyq1HfCuoGMUVf9NHP578Dm"
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
          "name": "reflectionAccount",
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
              "path": "stakeProgram"
            }
          }
        },
        {
          "name": "rewardAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stakeAccount"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "stakeAccount"
          ]
        },
        {
          "name": "mint"
        },
        {
          "name": "stakeProgram",
          "address": "5f7WaR7jC3metyDTSq7YGAyq1HfCuoGMUVf9NHP578Dm"
        },
        {
          "name": "systemProgram",
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
          "name": "reflectionAccount",
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
          "name": "intermediateRewardVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "reflectionAccount"
              }
            ]
          }
        },
        {
          "name": "rewardVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "intermediateRewardVaultTokenAccount"
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
          "name": "stakeAccount"
        },
        {
          "name": "rewardAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stakeAccount"
              }
            ]
          }
        },
        {
          "name": "stakeVaultTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "stakeAccount"
              }
            ],
            "program": {
              "kind": "account",
              "path": "stakeProgram"
            }
          }
        },
        {
          "name": "reflectionAccount",
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
                "account": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "stakeProgram",
          "address": "5f7WaR7jC3metyDTSq7YGAyq1HfCuoGMUVf9NHP578Dm"
        }
      ],
      "args": []
    },
    {
      "name": "topup",
      "docs": [
        "Topup the [ReflectionAccount](#reflection-account) and [VaultAccount](#vault_token_account-account)."
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
          "name": "mint",
          "writable": true
        },
        {
          "name": "reflectionAccount",
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
          "name": "intermediateRewardVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "reflectionAccount"
              }
            ]
          }
        },
        {
          "name": "rewardVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "intermediateRewardVaultTokenAccount"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "reflectionAccount",
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
      "name": "rewardAccount",
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
      "name": "invalidVault",
      "msg": "This account has an invalid vault."
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "This account is not authorized to perform this action."
    },
    {
      "code": 6002,
      "name": "alreadyUnstaked",
      "msg": "This stake is already unstaked."
    },
    {
      "code": 6003,
      "name": "decreased",
      "msg": "This stake is not allowed to decrease."
    },
    {
      "code": 6004,
      "name": "noClaimableRewards",
      "msg": "No Claimable Rewards"
    },
    {
      "code": 6005,
      "name": "invalidMint",
      "msg": "Invalid Mint"
    }
  ],
  "types": [
    {
      "name": "reflectionAccount",
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
            "name": "totalReflection",
            "type": "u128"
          },
          {
            "name": "totalWeightedAmount",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "rewardAccount",
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
            "name": "weightedAmount",
            "type": "u128"
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
  ]
};
