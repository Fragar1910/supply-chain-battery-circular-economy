// Contract addresses deployed on Anvil local testnet
// Chain ID: 31337
// Deployed: 2025-12-07

import {
  BatteryRegistryABI,
  RoleManagerABI,
  SupplyChainTrackerABI,
  DataVaultABI,
  CarbonFootprintABI,
  SecondLifeManagerABI,
  RecyclingManagerABI,
} from '@/lib/contracts';

// Anvil local chain configuration
export const ANVIL_CHAIN = {
  id: 31337,
  name: 'Anvil',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
} as const;

// Contract addresses and roles (automatically loaded from deployment artifacts)
// Run `cd sc && ./deploy-and-seed.sh` to update
import deployedAddresses from './deployed-addresses.json';
import deployedRolesJson from './deployed-roles.json';

// Type-safe roles import - ensures all expected roles are present
interface DeployedRoles {
  ADMIN_ROLE: string;
  COMPONENT_MANUFACTURER_ROLE: string;
  OEM_ROLE: string;
  FLEET_OPERATOR_ROLE: string;
  AFTERMARKET_USER_ROLE: string;
  RECYCLER_ROLE: string;
  AUDITOR_ROLE: string;
}

const deployedRoles = deployedRolesJson as DeployedRoles;

export const CONTRACT_ADDRESSES = {
  BatteryRegistry: deployedAddresses.BatteryRegistry as `0x${string}`,
  RoleManager: deployedAddresses.RoleManager as `0x${string}`,
  SupplyChainTracker: deployedAddresses.SupplyChainTracker as `0x${string}`,
  DataVault: deployedAddresses.DataVault as `0x${string}`,
  CarbonFootprint: deployedAddresses.CarbonFootprint as `0x${string}`,
  SecondLifeManager: deployedAddresses.SecondLifeManager as `0x${string}`,
  RecyclingManager: deployedAddresses.RecyclingManager as `0x${string}`,
} as const;

// Contract configurations with ABIs
export const CONTRACTS = {
  BatteryRegistry: {
    address: CONTRACT_ADDRESSES.BatteryRegistry,
    abi: BatteryRegistryABI,
  },
  RoleManager: {
    address: CONTRACT_ADDRESSES.RoleManager,
    abi: RoleManagerABI,
  },
  SupplyChainTracker: {
    address: CONTRACT_ADDRESSES.SupplyChainTracker,
    abi: SupplyChainTrackerABI,
  },
  DataVault: {
    address: CONTRACT_ADDRESSES.DataVault,
    abi: DataVaultABI,
  },
  CarbonFootprint: {
    address: CONTRACT_ADDRESSES.CarbonFootprint,
    abi: CarbonFootprintABI,
  },
  SecondLifeManager: {
    address: CONTRACT_ADDRESSES.SecondLifeManager,
    abi: SecondLifeManagerABI,
  },
  RecyclingManager: {
    address: CONTRACT_ADDRESSES.RecyclingManager,
    abi: RecyclingManagerABI,
  },
} as const;

// Admin account (Anvil default account #0)
export const ADMIN_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`;

// Role identifiers (automatically loaded from deployed RoleManager contract)
// Note: These update automatically when you run deploy-and-seed.sh
export const ROLES = {
  ADMIN_ROLE: deployedRoles.ADMIN_ROLE as `0x${string}`,
  COMPONENT_MANUFACTURER_ROLE: deployedRoles.COMPONENT_MANUFACTURER_ROLE as `0x${string}`,
  OEM_ROLE: deployedRoles.OEM_ROLE as `0x${string}`,
  FLEET_OPERATOR_ROLE: deployedRoles.FLEET_OPERATOR_ROLE as `0x${string}`,
  AFTERMARKET_USER_ROLE: deployedRoles.AFTERMARKET_USER_ROLE as `0x${string}`,
  RECYCLER_ROLE: deployedRoles.RECYCLER_ROLE as `0x${string}`,
  AUDITOR_ROLE: deployedRoles.AUDITOR_ROLE as `0x${string}`,

  // Legacy alias for backwards compatibility
  MANUFACTURER_ROLE: deployedRoles.COMPONENT_MANUFACTURER_ROLE as `0x${string}`,
} as const;

// Contract types for TypeScript
export type ContractName = keyof typeof CONTRACTS;
export type ContractAddress = (typeof CONTRACT_ADDRESSES)[keyof typeof CONTRACT_ADDRESSES];
