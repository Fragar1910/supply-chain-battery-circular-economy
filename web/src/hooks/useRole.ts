'use client';

import { useReadContract } from 'wagmi';
import { CONTRACTS, ROLES } from '@/config/contracts';
import { useWallet } from './useWallet';

/**
 * Hook to check if the current user has a specific role
 * @param contractName - Name of the contract to check role in (usually 'BatteryRegistry' or 'RoleManager')
 * @param roleKey - Key of the role to check from ROLES constant
 */
export function useRole(
  contractName: 'BatteryRegistry' | 'RoleManager' | 'SupplyChainTracker' | 'DataVault' | 'CarbonFootprint' | 'SecondLifeManager' | 'RecyclingManager',
  roleKey: keyof typeof ROLES
) {
  const { address } = useWallet();
  const contract = CONTRACTS[contractName];
  const roleHash = ROLES[roleKey];

  const { data: hasRole, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'hasRole',
    args: [roleHash, address] as any,
    query: {
      enabled: !!address, // Only run query if user is connected
    },
  });

  return {
    hasRole: !!hasRole, // Convert to boolean (undefined/null/false -> false, true -> true)
    isLoading,
    refetch,
  };
}

/**
 * Hook to check multiple roles at once
 * @param contractName - Name of the contract to check roles in
 * @param roleKeys - Array of role keys to check
 */
export function useRoles(
  contractName: 'BatteryRegistry' | 'RoleManager' | 'SupplyChainTracker' | 'DataVault' | 'CarbonFootprint' | 'SecondLifeManager' | 'RecyclingManager',
  roleKeys: (keyof typeof ROLES)[]
) {
  const { address } = useWallet();
  const contract = CONTRACTS[contractName];

  const roleChecks = roleKeys.map((roleKey) => {
    const roleHash = ROLES[roleKey];
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'hasRole',
      args: [roleHash, address] as any,
      query: {
        enabled: !!address,
      },
    });
  });

  const roles = roleKeys.reduce((acc, roleKey, index) => {
    acc[roleKey] = !!roleChecks[index].data; // Convert to boolean
    return acc;
  }, {} as Record<keyof typeof ROLES, boolean>);

  const isLoading = roleChecks.some((check) => check.isLoading);
  const hasAnyRole = Object.values(roles).some((has) => has === true);

  return {
    roles,
    hasAnyRole,
    isLoading,
  };
}

/**
 * Hook to get the user's actor profile from RoleManager
 */
export function useActorProfile() {
  const { address } = useWallet();
  const contract = CONTRACTS.RoleManager;

  const { data: profile, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'getActorProfile',
    args: [address] as any,
    query: {
      enabled: !!address,
    },
  });

  return {
    profile,
    isLoading,
    refetch,
  };
}

/**
 * Hook to check if user has a specific role in RoleManager enum
 */
export function useHasActorRole(role: number) {
  const { address } = useWallet();
  const contract = CONTRACTS.RoleManager;

  const { data: hasRole, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'hasActorRole',
    args: [address, role] as any,
    query: {
      enabled: !!address,
    },
  });

  return {
    hasRole: !!hasRole, // Convert to boolean (undefined/null/false -> false, true -> true)
    isLoading,
    refetch,
  };
}
