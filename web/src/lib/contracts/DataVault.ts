// Auto-generated file - do not edit manually
// Generated from DataVault.sol

export const DataVaultABI = [
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
    "name": "DATA_WRITER_ROLE",
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
    "name": "FLEET_OPERATOR_ROLE",
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
    "name": "MANUFACTURER_ROLE",
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
    "name": "OEM_ROLE",
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
    "name": "batchStoreParameters",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "updates",
        "type": "tuple[]",
        "internalType": "struct DataVault.ParameterUpdate[]",
        "components": [
          {
            "name": "key",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "value",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "category",
            "type": "uint8",
            "internalType": "enum DataVault.ParameterCategory"
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
    "name": "criticalEventCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deleteParameter",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "parameterKey",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getBatchParameters",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "keys",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      }
    ],
    "outputs": [
      {
        "name": "values",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBatteryParameters",
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
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCriticalEventCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCriticalEvents",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "startIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct DataVault.CriticalEvent[]",
        "components": [
          {
            "name": "eventType",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "severity",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "description",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "temperature",
            "type": "int16",
            "internalType": "int16"
          },
          {
            "name": "chargeLevel",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "location",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "eventDate",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "recordedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "recordedBy",
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
    "name": "getLatestTelemetry",
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
        "internalType": "struct DataVault.TelemetryRecord",
        "components": [
          {
            "name": "soc",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "soh",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "mileage",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "chargeCycles",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "avgTemperature",
            "type": "int16",
            "internalType": "int16"
          },
          {
            "name": "maxTemperature",
            "type": "int16",
            "internalType": "int16"
          },
          {
            "name": "depthOfDischarge",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "chargeRate",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "timestamp",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "recordedBy",
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
    "name": "getMaintenanceCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMaintenanceRecords",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "startIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct DataVault.MaintenanceRecord[]",
        "components": [
          {
            "name": "maintenanceType",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "description",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "componentsReplaced",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "bmsUpdate",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "technicianId",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "serviceDate",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "recordedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "recordedBy",
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
    "name": "getParameter",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "parameterKey",
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
    "name": "getParameterWithMetadata",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "parameterKey",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "value",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "metadata",
        "type": "tuple",
        "internalType": "struct DataVault.ParameterMetadata",
        "components": [
          {
            "name": "category",
            "type": "uint8",
            "internalType": "enum DataVault.ParameterCategory"
          },
          {
            "name": "exists",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "lastUpdated",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "lastUpdatedBy",
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
    "name": "getParametersByCategory",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "category",
        "type": "uint8",
        "internalType": "enum DataVault.ParameterCategory"
      }
    ],
    "outputs": [
      {
        "name": "keys",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      },
      {
        "name": "values",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
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
    "name": "getTelemetryCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTelemetryRecords",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "startIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct DataVault.TelemetryRecord[]",
        "components": [
          {
            "name": "soc",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "soh",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "mileage",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "chargeCycles",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "avgTemperature",
            "type": "int16",
            "internalType": "int16"
          },
          {
            "name": "maxTemperature",
            "type": "int16",
            "internalType": "int16"
          },
          {
            "name": "depthOfDischarge",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "chargeRate",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "timestamp",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "recordedBy",
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
    "name": "grantDataWriterRole",
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
    "name": "grantFleetOperatorRole",
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
    "name": "grantManufacturerRole",
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
    "name": "grantOEMRole",
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
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "maintenanceCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "parameterCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "parameterExists",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "parameterKey",
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
    "name": "recordCriticalEvent",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "eventType",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "severity",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "description",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "temperature",
        "type": "int16",
        "internalType": "int16"
      },
      {
        "name": "chargeLevel",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "location",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "eventDate",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "recordMaintenance",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "maintenanceType",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "description",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "componentsReplaced",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "bmsUpdate",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "technicianId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "serviceDate",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "recordTelemetry",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "soc",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "soh",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "mileage",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "chargeCycles",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "avgTemperature",
        "type": "int16",
        "internalType": "int16"
      },
      {
        "name": "maxTemperature",
        "type": "int16",
        "internalType": "int16"
      },
      {
        "name": "depthOfDischarge",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "chargeRate",
        "type": "uint16",
        "internalType": "uint16"
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
    "name": "storeParameter",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "parameterKey",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "value",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "category",
        "type": "uint8",
        "internalType": "enum DataVault.ParameterCategory"
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
    "name": "telemetryCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalParametersStored",
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
    "name": "BatchParametersStored",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "parameterCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "updatedBy",
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
    "name": "BatteryRegistryUpdated",
    "inputs": [
      {
        "name": "oldRegistry",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newRegistry",
        "type": "address",
        "indexed": true,
        "internalType": "address"
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
    "name": "CriticalEventRecorded",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "recordIndex",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "eventType",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "severity",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "eventDate",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "recordedBy",
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
    "name": "MaintenanceRecorded",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "recordIndex",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "maintenanceType",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "technicianId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "serviceDate",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "recordedBy",
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
    "name": "ParameterDeleted",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "parameterKey",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "deletedBy",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ParameterStored",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "parameterKey",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "value",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "category",
        "type": "uint8",
        "indexed": true,
        "internalType": "enum DataVault.ParameterCategory"
      },
      {
        "name": "updatedBy",
        "type": "address",
        "indexed": false,
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
    "name": "ParameterUpdated",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "parameterKey",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "oldValue",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "newValue",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "updatedBy",
        "type": "address",
        "indexed": false,
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
    "name": "TelemetryRecorded",
    "inputs": [
      {
        "name": "bin",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "recordIndex",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "soh",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "soc",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "mileage",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "chargeCycles",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "recordedBy",
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

export type DataVaultABI = typeof DataVaultABI;
