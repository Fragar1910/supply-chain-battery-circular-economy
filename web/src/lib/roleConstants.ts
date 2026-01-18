/**
 * Role Constants and Account Information
 *
 * Centralized role definitions and authorized accounts for the battery supply chain
 * Simplified approach: Uses address-based authorization instead of role hashes
 */

// Role hashes (kept for contract interactions if needed, but not used for UI authorization)
export const ROLES = {
  ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  MANUFACTURER_ROLE: '0xeefb95e842a3287179d933b4460be539a1d5af11aa8b325bb45c5c8dc92de4ed',
  OEM_ROLE: '0x3c9097c10f7e1eae9b190812e1f9842fb237e9fb2ed43764725aa007bcc1707c',
  OPERATOR_ROLE: '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929',
  RECYCLER_ROLE: '0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154',
  FLEET_OPERATOR_ROLE: '0x09dbbc4f4c1777380e818de38ff2b73d55e543b5f4634694a1e9215097fe26a0',
  AFTERMARKET_ROLE: '0xc7b4a89f7c0b9f0b3e7d8c0a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e',
} as const;

export interface AuthorizedAccount {
  address: `0x${string}`;
  accountNumber: number;
  name: string;
  description: string;
  roles: string[];
}

// Test accounts from Anvil with their roles (as assigned in SeedData.s.sol)
export const AUTHORIZED_ACCOUNTS: AuthorizedAccount[] = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    accountNumber: 0,
    name: 'Admin',
    description: 'System Administrator',
    roles: ['ADMIN_ROLE'],
  },
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    accountNumber: 1,
    name: 'Manufacturer',
    description: 'Northvolt AB',
    roles: ['MANUFACTURER_ROLE'],
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    accountNumber: 2,
    name: 'OEM',
    description: 'Tesla Inc',
    roles: ['OEM_ROLE'],
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    accountNumber: 3,
    name: 'Aftermarket User',
    description: 'Second Life Solutions',
    roles: ['AFTERMARKET_ROLE'],
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    accountNumber: 4,
    name: 'Recycler',
    description: 'Green Battery Recycling',
    roles: ['RECYCLER_ROLE'],
  },
  {
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    accountNumber: 5,
    name: 'Fleet Operator',
    description: 'EV Fleet Solutions',
    roles: ['OPERATOR_ROLE', 'FLEET_OPERATOR_ROLE'],
  },
];

/**
 * Get accounts that have a specific role
 */
export function getAccountsWithRole(roleName: keyof typeof ROLES): AuthorizedAccount[] {
  return AUTHORIZED_ACCOUNTS.filter((account) =>
    account.roles.includes(roleName)
  );
}

/**
 * Get accounts that have ANY of the specified roles
 */
export function getAccountsWithAnyRole(roleNames: (keyof typeof ROLES)[]): AuthorizedAccount[] {
  return AUTHORIZED_ACCOUNTS.filter((account) =>
    roleNames.some((role) => account.roles.includes(role))
  );
}

/**
 * Check if an address matches any authorized account
 */
export function findAccountByAddress(address: string): AuthorizedAccount | undefined {
  return AUTHORIZED_ACCOUNTS.find(
    (account) => account.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Check if an address has a specific role (address-based, no contract calls)
 */
export function hasRole(address: string | undefined, roleName: keyof typeof ROLES): boolean {
  if (!address) return false;
  const account = findAccountByAddress(address);
  return account?.roles.includes(roleName) ?? false;
}

/**
 * Check if an address has ANY of the specified roles
 */
export function hasAnyRole(address: string | undefined, roleNames: (keyof typeof ROLES)[]): boolean {
  if (!address) return false;
  const account = findAccountByAddress(address);
  return roleNames.some((role) => account?.roles.includes(role)) ?? false;
}

/**
 * Specific role checkers for common use cases
 */
export const isAdmin = (address: string | undefined) => hasRole(address, 'ADMIN_ROLE');
export const isManufacturer = (address: string | undefined) => hasRole(address, 'MANUFACTURER_ROLE');
export const isOEM = (address: string | undefined) => hasRole(address, 'OEM_ROLE');
export const isFleetOperator = (address: string | undefined) => hasRole(address, 'OPERATOR_ROLE') || hasRole(address, 'FLEET_OPERATOR_ROLE');
export const isRecycler = (address: string | undefined) => hasRole(address, 'RECYCLER_ROLE');
export const isAftermarketUser = (address: string | undefined) => hasRole(address, 'AFTERMARKET_ROLE');

/**
 * Check if address can record maintenance (Fleet Operator, OEM, or Admin)
 */
export const canRecordMaintenance = (address: string | undefined) =>
  hasAnyRole(address, ['FLEET_OPERATOR_ROLE', 'OEM_ROLE', 'ADMIN_ROLE']);

/**
 * Check if address can record critical events (Fleet Operator, OEM, or Admin)
 */
export const canRecordCriticalEvent = (address: string | undefined) =>
  hasAnyRole(address, ['FLEET_OPERATOR_ROLE', 'OEM_ROLE', 'ADMIN_ROLE']);

/**
 * Check if address can update telemetry (Fleet Operator, OEM, or Admin)
 */
export const canUpdateTelemetry = (address: string | undefined) =>
  hasAnyRole(address, ['FLEET_OPERATOR_ROLE', 'OEM_ROLE', 'ADMIN_ROLE']);

/**
 * Check if address can integrate battery (OEM only)
 */
export const canIntegrateBattery = (address: string | undefined) =>
  hasRole(address, 'OEM_ROLE');

/**
 * Check if address can start second life for batteries (Aftermarket User or Admin)
 */
export const canStartSecondLife = (address: string | undefined) =>
  hasAnyRole(address, ['AFTERMARKET_ROLE', 'ADMIN_ROLE']);
