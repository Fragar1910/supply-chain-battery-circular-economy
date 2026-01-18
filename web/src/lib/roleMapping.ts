/**
 * Role mapping for Anvil test accounts
 * Maps Ethereum addresses to supply chain roles
 */

export interface RoleInfo {
  address: string;
  role: 'Supplier' | 'Manufacturer' | 'OEM' | 'FleetOperator' | 'SecondLife' | 'Recycler' | 'Auditor';
  displayName: string;
}

// Anvil test account addresses (lowercase for comparison)
export const ANVIL_ROLES: Record<string, RoleInfo> = {
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    role: 'Manufacturer',
    displayName: 'Manufacturer',
  },
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    role: 'OEM',
    displayName: 'OEM',
  },
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65': {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    role: 'Recycler',
    displayName: 'Recycler',
  },
  '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc': {
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    role: 'FleetOperator',
    displayName: 'Fleet Operator',
  },
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906': {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    role: 'SecondLife',
    displayName: 'Aftermarket User',
  },
  '0x976ea74026e726554db657fa54763abd0c3a0aa9': {
    address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    role: 'Auditor',
    displayName: 'Auditor',
  },
};

/**
 * Get role information from Ethereum address
 */
export function getRoleFromAddress(address: string): RoleInfo | null {
  const normalizedAddress = address.toLowerCase();
  return ANVIL_ROLES[normalizedAddress] || null;
}

/**
 * Get supply chain role for visualization
 * Returns role compatible with SupplyChainGraph component
 */
export function getSupplyChainRole(address: string): 'Supplier' | 'Manufacturer' | 'OEM' | 'Owner' | 'SecondLife' | 'Recycler' {
  const roleInfo = getRoleFromAddress(address);

  if (!roleInfo) {
    return 'Manufacturer'; // Default fallback
  }

  // Map roles to SupplyChainGraph compatible roles
  switch (roleInfo.role) {
    case 'Manufacturer':
      return 'Manufacturer';
    case 'OEM':
      return 'OEM';
    case 'FleetOperator':
      return 'Owner'; // Fleet operators shown as Owner in supply chain
    case 'SecondLife':
      return 'SecondLife';
    case 'Recycler':
      return 'Recycler';
    case 'Supplier':
      return 'Supplier';
    default:
      return 'Manufacturer';
  }
}

/**
 * Get display name for an address
 */
export function getDisplayName(address: string): string {
  const roleInfo = getRoleFromAddress(address);
  return roleInfo?.displayName || `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if address is a known role
 */
export function isKnownAddress(address: string): boolean {
  return getRoleFromAddress(address) !== null;
}
