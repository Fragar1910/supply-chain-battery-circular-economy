// Auto-generated file - do not edit manually
// Generated from RecyclingManager.sol

export const RecyclingManagerABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ADMIN_ROLE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "AUDITOR_ROLE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DEFAULT_ADMIN_ROLE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "RECYCLER_ROLE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "UPGRADE_INTERFACE_VERSION",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "auditRecycling",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "approved",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "batchRecordMaterials",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "materials",
        "type": "tuple[]",
        "internalType": "struct RecyclingManager.MaterialBatch[]",
        "components": [
          {
            "name": "material",
            "type": "uint8",
            "internalType": "enum RecyclingManager.MaterialType"
          },
          {
            "name": "recoveredKg",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "inputKg",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "batteryRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract BatteryRegistry"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "completeRecycling",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "processHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getGlobalRecoveryStats",
    "inputs": [],
    "outputs": [
      {
        "name": "lithium",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "cobalt",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "nickel",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "copper",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalBatteries",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMaterialBreakdown",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "lithium",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "cobalt",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "nickel",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "copper",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "manganese",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "aluminum",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "graphite",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMaterialRecoveryHistory",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "material",
        "type": "uint8",
        "internalType": "enum RecyclingManager.MaterialType"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct RecyclingManager.MaterialRecovery[]",
        "components": [
          {
            "name": "material",
            "type": "uint8",
            "internalType": "enum RecyclingManager.MaterialType"
          },
          {
            "name": "recoveredKg",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "inputKg",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "recoveryRate",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "recoveryDate",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "recoveredBy",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecyclingData",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct RecyclingManager.RecyclingData",
        "components": [
          {
            "name": "bin",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "status",
            "type": "uint8",
            "internalType": "enum RecyclingManager.RecyclingStatus"
          },
          {
            "name": "method",
            "type": "uint8",
            "internalType": "enum RecyclingManager.RecyclingMethod"
          },
          {
            "name": "recycler",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "receivedDate",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "completionDate",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "totalInputWeightKg",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "totalRecoveredWeightKg",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "overallRecoveryRate",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "facilityHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "processHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "isAudited",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRoleAdmin",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalMaterialRecovered",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "material",
        "type": "uint8",
        "internalType": "enum RecyclingManager.MaterialType"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "globalMaterialRecovery",
    "inputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum RecyclingManager.MaterialType"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "grantAuditorRole",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "grantRecyclerRole",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "grantRole",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "hasRole",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "admin",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_batteryRegistry",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_roleManager",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isInRecycling",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proxiableUUID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "recordMaterialRecovery",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "material",
        "type": "uint8",
        "internalType": "enum RecyclingManager.MaterialType"
      },
      {
        "name": "recoveredKg",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "inputKg",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "renounceRole",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "callerConfirmation",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "revokeRole",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "roleManager",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract RoleManager"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setBatteryRegistry",
    "inputs": [
      {
        "name": "newRegistry",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setRoleManager",
    "inputs": [
      {
        "name": "newRoleManager",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "startRecycling",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "method",
        "type": "uint8",
        "internalType": "enum RecyclingManager.RecyclingMethod"
      },
      {
        "name": "inputWeightKg",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "facilityHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "supportsInterface",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalBatteriesInRecycling",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalBatteriesRecycled",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "updateRecyclingStatus",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "newStatus",
        "type": "uint8",
        "internalType": "enum RecyclingManager.RecyclingStatus"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeToAndCall",
    "inputs": [
      {
        "name": "newImplementation",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "BatchMaterialsRecovered",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "materialCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "totalRecoveredKg",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "recoveredBy",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GlobalRecoveryMilestone",
    "inputs": [
      {
        "name": "material",
        "type": "uint8",
        "indexed": true,
        "internalType": "enum RecyclingManager.MaterialType"
      },
      {
        "name": "totalRecoveredKg",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MaterialRecovered",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "material",
        "type": "uint8",
        "indexed": true,
        "internalType": "enum RecyclingManager.MaterialType"
      },
      {
        "name": "recoveredKg",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "recoveryRate",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "recoveredBy",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RecyclingAudited",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "auditor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "approved",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      },
      {
        "name": "timestamp",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RecyclingCompleted",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "totalRecoveredKg",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "overallRecoveryRate",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "recycler",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "timestamp",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RecyclingStarted",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "recycler",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "method",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum RecyclingManager.RecyclingMethod"
      },
      {
        "name": "inputWeightKg",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "timestamp",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RecyclingStatusUpdated",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "oldStatus",
        "type": "uint8",
        "indexed": true,
        "internalType": "enum RecyclingManager.RecyclingStatus"
      },
      {
        "name": "newStatus",
        "type": "uint8",
        "indexed": true,
        "internalType": "enum RecyclingManager.RecyclingStatus"
      },
      {
        "name": "updatedBy",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoleAdminChanged",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "previousAdminRole",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "newAdminRole",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoleGranted",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "sender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoleRevoked",
    "inputs": [
      {
        "name": "role",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "sender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Upgraded",
    "inputs": [
      {
        "name": "implementation",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AccessControlBadConfirmation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AccessControlUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "neededRole",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "AddressEmptyCode",
    "inputs": [
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1967InvalidImplementation",
    "inputs": [
      {
        "name": "implementation",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1967NonPayable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FailedCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidInitialization",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotInitializing",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UUPSUnauthorizedCallContext",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UUPSUnsupportedProxiableUUID",
    "inputs": [
      {
        "name": "slot",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  }
] as const;

export type RecyclingManagerABI = typeof RecyclingManagerABI;
