/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/effect_payment.json`.
 */
export type EffectPayment = {
  "address": "effectpayment",
  "metadata": {
    "name": "effectPayment",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claim",
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
          "name": "paymentAccount"
        },
        {
          "name": "paymentVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "paymentAccount"
              }
            ]
          }
        },
        {
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "recipientManagerDataAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "mint"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "minNonce",
          "type": "u32"
        },
        {
          "name": "maxNonce",
          "type": "u32"
        },
        {
          "name": "totalAmount",
          "type": "u64"
        },
        {
          "name": "pubX",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "pubY",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "proof",
          "type": {
            "array": [
              "u8",
              256
            ]
          }
        }
      ]
    },
    {
      "name": "createPaymentPool",
      "discriminator": [
        39,
        242,
        23,
        233,
        229,
        198,
        28,
        204
      ],
      "accounts": [
        {
          "name": "paymentAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "paymentVaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "paymentAccount"
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
          "name": "userTokenAccount",
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
          "name": "authorities",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "init",
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
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "recipientManagerDataAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "managerAuthority"
              }
            ]
          }
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
        }
      ],
      "args": [
        {
          "name": "managerAuthority",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "paymentAccount",
      "discriminator": [
        47,
        239,
        218,
        78,
        43,
        193,
        1,
        61
      ]
    },
    {
      "name": "recipientManagerDataAccount",
      "discriminator": [
        61,
        41,
        126,
        131,
        94,
        55,
        133,
        237
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized."
    },
    {
      "code": 6001,
      "name": "sigVerificationFailed",
      "msg": "Signature verification failed."
    },
    {
      "code": 6002,
      "name": "invalidProof",
      "msg": "Invalid Proof"
    },
    {
      "code": 6003,
      "name": "invalidPayment",
      "msg": "Invalid Payment"
    }
  ],
  "types": [
    {
      "name": "paymentAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          },
          {
            "name": "authorities",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "recipientManagerDataAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "type": "u32"
          }
        ]
      }
    }
  ]
};
