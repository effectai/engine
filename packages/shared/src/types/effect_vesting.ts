/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/effect_vesting.json`.
 */
export type EffectVesting = {
  "address": "GSzDavs4yP5jqnVTnjjmJ9DJ5yUQ6AB7vBTNv2BBmaSe",
  "metadata": {
    "name": "effectVesting",
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
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "recipientTokenAccount",
          "writable": true,
          "relations": [
            "vestingAccount"
          ]
        },
        {
          "name": "vestingAccount",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
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
          "name": "vaultTokenAccount",
          "writable": true,
          "relations": [
            "vestingAccount"
          ]
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "vestingAccount",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "vestingAccount"
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
          "name": "vestingAccount",
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
                "path": "vestingAccount"
              }
            ]
          }
        },
        {
          "name": "recipientTokenAccount"
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
      "args": [
        {
          "name": "releaseRate",
          "type": "u64"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "isClosable",
          "type": "bool"
        },
        {
          "name": "isPubliclyClaimable",
          "type": "bool"
        },
        {
          "name": "tag",
          "type": {
            "option": {
              "array": [
                "u8",
                8
              ]
            }
          }
        }
      ]
    },
    {
      "name": "updateAuthority",
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
          "name": "newAuthority",
          "writable": true
        },
        {
          "name": "vestingAccount",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "vestingAccount"
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
      "name": "updateRecipient",
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
          "name": "recipientTokenAccount",
          "relations": [
            "vestingAccount"
          ]
        },
        {
          "name": "newRecipientTokenAccount"
        },
        {
          "name": "vestingAccount",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
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
      "name": "notStarted",
      "msg": "This pool has not started yet."
    },
    {
      "code": 6001,
      "name": "underfunded",
      "msg": "This pool does not have enough funds."
    },
    {
      "code": 6002,
      "name": "notCloseable",
      "msg": "This pool is not closeable."
    },
    {
      "code": 6003,
      "name": "wrongClaimType",
      "msg": "This pool has a different claim type."
    },
    {
      "code": 6004,
      "name": "wrongBeneficiary",
      "msg": "This pool does not match the beneficiary."
    },
    {
      "code": 6005,
      "name": "invalidTokenAccount",
      "msg": "This pool has an invalid token account."
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6007,
      "name": "invalidVault",
      "msg": "Invalid vault"
    }
  ],
  "types": [
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
