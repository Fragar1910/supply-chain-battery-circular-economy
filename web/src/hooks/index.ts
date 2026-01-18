// Export all custom hooks
export { useWallet } from './useWallet';
export { useContract, useContractRead, useContractWrite } from './useContract';
export { useRole, useRoles, useActorProfile, useHasActorRole } from './useRole';
export { useContractEvents, useBatteryEvents } from './useContractEvents';
export { useToast } from './useToast';
export { useBatteryList, useBattery } from './useBatteryList';
export {
  useAvailableSecondLifeBatteries,
  useAvailableBattery,
  useSecondLifeBatteries,
  useSecondLifeData,
  useIsEligibleForSecondLife
} from './useAftermarketBatteries';
export { usePendingTransfer, usePendingTransfersCount } from './usePendingTransfers';
export { useTimelineEvents, getRoleName, getStateName } from './useTimelineEvents';
export { useTransferHistory } from './useTransferHistory';
export { useSecondLifeEvents } from './useSecondLifeEvents';
export { useRecyclingEvents } from './useRecyclingEvents';
export { useDataVaultEvents } from './useDataVaultEvents';
export { useSOHEvents } from './useSOHEvents';
export { useCarbonFootprintEvents } from './useCarbonFootprintEvents';
export type { BatteryEvent } from './useContractEvents';
export type { ToastOptions } from './useToast';
export type { BatteryFromChain } from './useBatteryList';
export type { AvailableBattery, SecondLifeBattery } from './useAftermarketBatteries';
export type { TimelineEvent } from './useTimelineEvents';
export type { TransferEvent } from './useTransferHistory';
export type { SecondLifeEvent } from './useSecondLifeEvents';
export type { RecyclingEvent } from './useRecyclingEvents';
export type { DataVaultEvent, TelemetryEvent, MaintenanceEvent, CriticalEvent } from './useDataVaultEvents';
export type { SOHUpdateEvent } from './useSOHEvents';
export type { CarbonEmissionEvent } from './useCarbonFootprintEvents';
