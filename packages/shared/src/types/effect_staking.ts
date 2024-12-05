/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/effect_staking.json`.
 */
export type EffectStaking = {
  "address": "3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw",
  "metadata": {
    "name": "effectStaking",
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
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "stake",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
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
          "name": "tokenProgram",
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
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "stake",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultTokenAccount",
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
      "name": "stakeGenesis",
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
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "stake",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "claimVault",
          "writable": true,
          "signer": true
        },
        {
          "name": "claimAccount",
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
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "stakeStartTime",
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
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
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
          "name": "tokenProgram",
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
          "name": "vaultTokenAccount",
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
          "name": "vestingAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "rewardAccount",
          "writable": true
        },
        {
          "name": "vestingVaultAccount",
          "writable": true
        },
        {
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "vestingProgram",
          "address": "GSzDavs4yP5jqnVTnjjmJ9DJ5yUQ6AB7vBTNv2BBmaSe"
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
      "name": "notUnstaked",
      "msg": "This stake is not yet unstaked."
    },
    {
      "code": 6005,
      "name": "locked",
      "msg": "This stake is still locked."
    },
    {
      "code": 6006,
      "name": "vaultNotEmpty",
      "msg": "This vault is not empty."
    },
    {
      "code": 6007,
      "name": "durationTooLong",
      "msg": "The stake duration is too long."
    },
    {
      "code": 6008,
      "name": "durationTooShort",
      "msg": "The stake duration is too short."
    },
    {
      "code": 6009,
      "name": "vaultAuthorityMismatch",
      "msg": "The vault authority does not match."
    },
    {
      "code": 6010,
      "name": "amountNotEnough",
      "msg": "The stake amount is not enough."
    },
    {
      "code": 6011,
      "name": "alreadyStaked",
      "msg": "This stake is already staked."
    },
    {
      "code": 6012,
      "name": "invalidRewardAccount",
      "msg": "Invalid reward account."
    },
    {
      "code": 6013,
      "name": "invalidStakeAccount",
      "msg": "Invalid stake account."
    },
    {
      "code": 6014,
      "name": "stakeNotEmpty",
      "msg": "Stake acount is not empty."
    }
  ],
  "types": [
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
      "name": "stakeDurationMax",
      "type": "u128",
      "value": "31536000"
    },
    {
      "name": "stakeDurationMin",
      "type": "u128",
      "value": "2592000"
    },
    {
      "name": "stakeMinimumAmount",
      "type": "u64",
      "value": "0"
    }
  ]
};
