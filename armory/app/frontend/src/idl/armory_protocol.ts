/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/armory_protocol.json`.
 */
export type ArmoryProtocol = {
  "address": "G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX",
  "metadata": {
    "name": "armoryProtocol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Armory Protocol"
  },
  "instructions": [
    {
      "name": "expireEntity",
      "discriminator": [
        243,
        65,
        58,
        215,
        196,
        77,
        65,
        92
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "entityRecord",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "domain",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "verifier",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "queryEntity",
      "discriminator": [
        235,
        86,
        79,
        205,
        43,
        40,
        9,
        214
      ],
      "accounts": [
        {
          "name": "entityRecord"
        }
      ],
      "args": [
        {
          "name": "domain",
          "type": "string"
        }
      ]
    },
    {
      "name": "registerEntity",
      "discriminator": [
        166,
        52,
        122,
        244,
        214,
        116,
        215,
        255
      ],
      "accounts": [
        {
          "name": "entityAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "entityRecord",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "domain",
          "type": "string"
        },
        {
          "name": "officialPubkey",
          "type": "pubkey"
        },
        {
          "name": "entityName",
          "type": "string"
        }
      ]
    },
    {
      "name": "revokeEntity",
      "discriminator": [
        184,
        110,
        140,
        250,
        157,
        169,
        179,
        215
      ],
      "accounts": [
        {
          "name": "verifierAuthority",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "entityRecord",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "domain",
          "type": "string"
        }
      ]
    },
    {
      "name": "updateVerifier",
      "discriminator": [
        198,
        42,
        44,
        241,
        47,
        104,
        225,
        255
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newVerifier",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "verifyEntity",
      "discriminator": [
        225,
        26,
        41,
        133,
        84,
        219,
        130,
        102
      ],
      "accounts": [
        {
          "name": "verifierAuthority",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "entityRecord",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "domain",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "entityRecord",
      "discriminator": [
        41,
        136,
        163,
        81,
        5,
        100,
        78,
        143
      ]
    },
    {
      "name": "registryConfig",
      "discriminator": [
        23,
        118,
        10,
        246,
        173,
        231,
        243,
        156
      ]
    }
  ],
  "events": [
    {
      "name": "entityExpired",
      "discriminator": [
        14,
        151,
        53,
        69,
        41,
        234,
        213,
        78
      ]
    },
    {
      "name": "entityRegistered",
      "discriminator": [
        207,
        100,
        27,
        194,
        243,
        88,
        104,
        198
      ]
    },
    {
      "name": "entityRevoked",
      "discriminator": [
        187,
        114,
        155,
        129,
        23,
        149,
        248,
        187
      ]
    },
    {
      "name": "entityVerified",
      "discriminator": [
        224,
        160,
        230,
        92,
        0,
        236,
        192,
        70
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "entityAlreadyRegistered",
      "msg": "An entity record for this domain already exists"
    },
    {
      "code": 6001,
      "name": "unauthorizedVerifier",
      "msg": "Unauthorized: signer is not the registered verifier"
    },
    {
      "code": 6002,
      "name": "alreadyVerified",
      "msg": "This entity record is already verified"
    },
    {
      "code": 6003,
      "name": "expireNotReady",
      "msg": "Expiration epoch has not yet passed"
    },
    {
      "code": 6004,
      "name": "domainTooLong",
      "msg": "Domain string exceeds maximum length of 64 characters"
    },
    {
      "code": 6005,
      "name": "entityNameTooLong",
      "msg": "Entity name exceeds maximum length of 100 characters"
    },
    {
      "code": 6006,
      "name": "unauthorizedAdmin",
      "msg": "Unauthorized: signer is not the admin"
    },
    {
      "code": 6007,
      "name": "invalidState",
      "msg": "Invalid state for this operation"
    }
  ],
  "types": [
    {
      "name": "entityExpired",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "domain",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "entityRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "domainHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "officialPubkey",
            "type": "pubkey"
          },
          {
            "name": "verificationStatus",
            "type": "bool"
          },
          {
            "name": "expirationEpoch",
            "type": "i64"
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "verifiedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "verifier",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "domain",
            "type": "string"
          },
          {
            "name": "entityName",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "entityRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "domain",
            "type": "string"
          },
          {
            "name": "officialPubkey",
            "type": "pubkey"
          },
          {
            "name": "registeredAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "entityRevoked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "domain",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "entityVerified",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "domain",
            "type": "string"
          },
          {
            "name": "officialPubkey",
            "type": "pubkey"
          },
          {
            "name": "expirationEpoch",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "registryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "verifier",
            "type": "pubkey"
          },
          {
            "name": "totalEntities",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "configSeed",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "entitySeed",
      "type": "bytes",
      "value": "[101, 110, 116, 105, 116, 121]"
    }
  ]
};
