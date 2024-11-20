/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/effect_staking.json`.
 */
export type EffectStaking = {
  "address": "effScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE",
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
          "name": "user",
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
          "name": "tokenProgram",
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
      "name": "init",
      "docs": [
        "Initialize the [SettingsAccount](#settings-account)."
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
          "name": "settings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
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
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
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
      "name": "slash",
      "docs": [
        "Reduce a [StakeAccount](#stake-account)'s [NOS](/tokens/token) tokens.",
        "Slashing is a feature used by the Effect Protocol to punish bad actors."
      ],
      "discriminator": [
        204,
        141,
        18,
        161,
        8,
        177,
        92,
        142
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
          "name": "tokenAccount",
          "writable": true
        },
        {
          "name": "settings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "settings"
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
      "name": "stake",
      "docs": [
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
          "address": "devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP"
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "vault",
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
          "name": "user",
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
      "name": "updateSettings",
      "docs": [
        "Update the Slashing Authority and Token Account."
      ],
      "discriminator": [
        81,
        166,
        51,
        213,
        158,
        84,
        157,
        108
      ],
      "accounts": [
        {
          "name": "newAuthority"
        },
        {
          "name": "tokenAccount"
        },
        {
          "name": "settings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "settings"
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
          "name": "user",
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
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "settingsAccount",
      "discriminator": [
        63,
        89,
        203,
        155,
        76,
        237,
        115,
        58
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
      "name": "amountNotEnough",
      "msg": "This amount is not enough."
    },
    {
      "code": 6001,
      "name": "alreadyInitialized",
      "msg": "This stake is already running."
    },
    {
      "code": 6002,
      "name": "alreadyClaimed",
      "msg": "This stake is already claimed."
    },
    {
      "code": 6003,
      "name": "alreadyStaked",
      "msg": "This stake is already staked."
    },
    {
      "code": 6004,
      "name": "alreadyUnstaked",
      "msg": "This stake is already unstaked."
    },
    {
      "code": 6005,
      "name": "notUnstaked",
      "msg": "This stake is not yet unstaked."
    },
    {
      "code": 6006,
      "name": "locked",
      "msg": "This stake is still locked."
    },
    {
      "code": 6007,
      "name": "durationTooShort",
      "msg": "This stake duration is not long enough."
    },
    {
      "code": 6008,
      "name": "durationTooLong",
      "msg": "This stake duration is too long."
    },
    {
      "code": 6009,
      "name": "doesNotExist",
      "msg": "This stake account does not exist."
    },
    {
      "code": 6010,
      "name": "decreased",
      "msg": "This stake is not allowed to decrease."
    },
    {
      "code": 6011,
      "name": "invalidStakeAccount",
      "msg": "This stake does not belong to the authority."
    }
  ],
  "types": [
    {
      "name": "settingsAccount",
      "docs": [
        "The `SettingsAccount` struct holds the information about the",
        "slashing authority and token account."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "stakeAccount",
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
            "name": "timeUnstake",
            "type": "i64"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          },
          {
            "name": "xefx",
            "type": "u128"
          }
        ]
      }
    }
  ]
};
