/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/effect_rewards.json`.
 */
export type EffectRewards = {
  "address": "HJR3op52N7tNycXqQnVu8cDnxH7udp4pYi1ps9S1hdBz",
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
          "name": "user",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "relations": [
            "reflection"
          ]
        },
        {
          "name": "reflection",
          "writable": true
        },
        {
          "name": "reward",
          "writable": true
        },
        {
          "name": "stake"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "reward",
            "stake"
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
      "docs": [
        "Send [NOS](/tokens/token) to the [VaultAccount](#vault-account)."
      ],
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
          "name": "reflection",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "relations": [
            "reflection"
          ]
        },
        {
          "name": "vestingVaultTokenAccount",
          "writable": true
        },
        {
          "name": "vestingAccount",
          "writable": true
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
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
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
          "name": "reflection",
          "writable": true
        },
        {
          "name": "reward",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "reward"
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
          "name": "reflection",
          "writable": true
        },
        {
          "name": "stake"
        },
        {
          "name": "reward",
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
          "signer": true,
          "relations": [
            "stake"
          ]
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
              }
            ]
          }
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "address": "authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV"
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
          "name": "reward",
          "writable": true
        },
        {
          "name": "stake"
        },
        {
          "name": "reflection",
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
            "name": "rate",
            "type": "u128"
          },
          {
            "name": "totalReflection",
            "type": "u128"
          },
          {
            "name": "totalXefx",
            "type": "u128"
          },
          {
            "name": "vaultTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "rewardAccount",
      "docs": [
        "The `RewardAccount` struct holds all the information for any given user account."
      ],
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
            "name": "xefx",
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
            "name": "vaultTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "xefx",
            "type": "u128"
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
            "name": "isCloseable",
            "type": "bool"
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
            "name": "vaultTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "isPubliclyClaimable",
            "type": "bool"
          },
          {
            "name": "tag",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    }
  ]
};
