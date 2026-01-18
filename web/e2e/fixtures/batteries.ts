/**
 * Test Battery Data
 * These batteries are seeded by deploy-and-seed.sh script
 */

// Original 9 batteries
export const SEED_BATTERIES = [
  'NV-2024-001234',
  'NV-2024-002345',
  'NV-2024-003456',
  'NV-2024-004567',
  'NV-2024-005678',
  'NV-2024-006789',
  'NV-2024-007890',
  'NV-2024-008901',
  'NV-2024-009012',
] as const;

// New batteries for vehicle integration (with VINs)
export const VEHICLE_BATTERIES = [
  { bin: 'NV-2024-001236', vin: '5YJ3E1EA1KF000001', model: 'Tesla Model 3' },
  { bin: 'NV-2024-001237', vin: '5YJYGDEE0MF000002', model: 'Tesla Model Y' },
  { bin: 'NV-2024-001238', vin: '3FMTK3SU5MMA00003', model: 'Ford Mustang Mach-E' },
  { bin: 'NV-2024-001239', vin: '5YJ3E1EA2KF000004', model: 'Tesla Model 3' },
] as const;

// New batteries for recycling (older batteries)
export const RECYCLING_BATTERIES = [
  'NV-2023-000123',
  'NV-2023-000124',
  'NV-2023-000125',
] as const;

// All batteries combined
export const ALL_BATTERIES = [
  ...SEED_BATTERIES,
  ...VEHICLE_BATTERIES.map(v => v.bin),
  ...RECYCLING_BATTERIES,
] as const;

export const TEST_BATTERY_PREFIX = 'TEST-E2E';

export function generateTestBatteryBIN(): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${TEST_BATTERY_PREFIX}-${timestamp}`;
}

export const BATTERY_STATES = {
  Manufactured: 0,
  Integrated: 1,
  FirstLife: 2,
  SecondLife: 3,
  EndOfLife: 4,
  Recycled: 5,
} as const;

export const BATTERY_CHEMISTRY = {
  NMC: 0,
  LFP: 1,
  NCA: 2,
  LTO: 3,
} as const;
