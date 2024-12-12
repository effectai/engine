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
          "name": "reflection",
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
          "name": "rewardVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "reflection"
              }
            ]
          }
        },
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
      "name": "claimStream",
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
                "path": "vesting_vault_token_account.mint",
                "account": "tokenAccount"
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
                "path": "reflectionAccount"
              }
            ]
          }
        },
        {
          "name": "vestingAccount",
          "writable": true
        },
        {
          "name": "vestingVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vestingAccount"
              }
            ],
            "program": {
              "kind": "account",
              "path": "vestingProgram"
            }
          }
        },
        {
          "name": "claimAuthority",
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
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "vestingProgram",
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
          "name": "reflectionAccount"
        },
        {
          "name": "rewardAccount",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "rewardAccount"
          ]
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
                "path": "stake_vault_token_account.mint",
                "account": "tokenAccount"
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
          "name": "stakeProgram",
          "address": "3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw"
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
          "name": "rewardVaultTokenAccount",
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
          "name": "authority",
          "writable": true,
          "signer": true
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
          "name": "rewardAccount",
          "writable": true
        },
        {
          "name": "stakeAccount"
        },
        {
          "name": "reflectionAccount",
          "writable": true
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
    },
    {
      "name": "vestingAccount",
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
    },
    {
      "name": "vestingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "recipientTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "distributedTokens",
            "type": "u64"
          },
          {
            "name": "releaseRate",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "isCloseable",
            "type": "bool"
          },
          {
            "name": "isRestrictedClaim",
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
};
