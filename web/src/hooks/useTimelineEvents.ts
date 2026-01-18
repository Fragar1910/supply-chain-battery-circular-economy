'use client';

import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';
import { useTransferHistory } from './useTransferHistory';
import { useSecondLifeEvents } from './useSecondLifeEvents';
import { useRecyclingEvents } from './useRecyclingEvents';
import { useDataVaultEvents } from './useDataVaultEvents';
import { useSOHEvents } from './useSOHEvents';
import { useCarbonFootprintEvents } from './useCarbonFootprintEvents';
import { getDisplayName } from '@/lib/roleMapping';

export interface TimelineEvent {
  id: string;
  date: string;
  timestamp: number;
  title: string;
  description: string;
  type: 'registration' | 'transfer' | 'stateChange' | 'sohUpdate' | 'integration' | 'recycling' | 'maintenance' | 'critical' | 'carbonFootprint';
  role?: string;
  actor?: string;
  metadata?: Record<string, any>;
}

// Role enum mapping from smart contract
const roleMap: { [key: number]: string } = {
  0: 'Unknown',
  1: 'Raw Material Supplier',
  2: 'Component Manufacturer',
  3: 'OEM',
  4: 'Fleet Operator',
  5: 'Aftermarket User',
  6: 'Recycler',
};

// BatteryState enum mapping
const stateMap: { [key: number]: string } = {
  0: 'Manufactured',
  1: 'Integrated',
  2: 'FirstLife',
  3: 'SecondLife',
  4: 'EndOfLife',
  5: 'Recycled',
};

/**
 * Hook to get complete timeline events for a battery from all contracts
 * Combines events from BatteryRegistry, SupplyChainTracker, and other lifecycle contracts
 */
export function useTimelineEvents(bin: string) {
  const binBytes32 = useMemo(() => binToBytes32(bin), [bin]);

  // Read battery data from BatteryRegistry
  const { data: batteryData } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: [binBytes32],
    query: {
      enabled: bin.length > 0,
    },
  });

  // Get transfer history from blockchain event logs
  const { transfers: transferHistory } = useTransferHistory(bin);

  // Get second life events from blockchain
  const { events: secondLifeEvents } = useSecondLifeEvents(bin);

  // Get recycling events from blockchain
  const { events: recyclingEvents } = useRecyclingEvents(bin);

  // Get DataVault events (telemetry, maintenance, critical)
  const { events: dataVaultEvents } = useDataVaultEvents(bin);

  // Get SOH update events
  const { events: sohEvents } = useSOHEvents(bin);

  // Get carbon footprint events
  const { events: carbonEvents } = useCarbonFootprintEvents(bin);

  // Parse and combine all events into timeline
  const timeline = useMemo(() => {
    const events: TimelineEvent[] = [];

    if (!batteryData) return events;

    const battery = batteryData as any;

    // 1. Battery Registration Event
    if (battery.manufactureDate) {
      const manufactureTimestamp = Number(battery.manufactureDate);
      events.push({
        id: `registration-${bin}`,
        date: new Date(manufactureTimestamp * 1000).toISOString().split('T')[0],
        timestamp: manufactureTimestamp,
        title: 'Battery Manufactured',
        description: `Battery manufactured by ${battery.manufacturer}`,
        type: 'registration',
        role: 'Component Manufacturer',
        actor: battery.manufacturer,
        metadata: {
          chemistry: battery.chemistry,
          capacityKwh: Number(battery.capacityKwh),
          sohManufacture: Number(battery.sohManufacture) / 100,
        },
      });
    }

    // 2. Transfer Events from blockchain event logs (REAL DATA)
    if (transferHistory && transferHistory.length > 0) {
      transferHistory.forEach((transfer, index) => {
        events.push({
          id: transfer.id,
          date: new Date(transfer.timestamp * 1000).toISOString().split('T')[0],
          timestamp: transfer.timestamp,
          title: `Ownership Transfer #${index + 1}`,
          description: `Battery transferred from ${transfer.from.slice(0, 6)}...${transfer.from.slice(-4)} to ${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)}`,
          type: 'transfer',
          role: 'Owner',
          actor: transfer.to,
          metadata: {
            from: transfer.from,
            to: transfer.to,
            blockNumber: transfer.blockNumber,
            transactionHash: transfer.transactionHash,
          },
        });
      });
    }

    // 3. Integration Event (if VIN is set)
    if (battery.vin && battery.vin !== '0x0000000000000000000000000000000000000000000000000000000000000000' && battery.integrationDate) {
      const integrationTimestamp = Number(battery.integrationDate);
      if (integrationTimestamp > 0) {
        // Parse VIN from bytes32
        const hex = battery.vin.slice(2);
        let vinStr = '';
        for (let i = 0; i < hex.length; i += 2) {
          const charCode = parseInt(hex.substring(i, i + 2), 16);
          if (charCode === 0) break;
          vinStr += String.fromCharCode(charCode);
        }

        events.push({
          id: `integration-${bin}`,
          date: new Date(integrationTimestamp * 1000).toISOString().split('T')[0],
          timestamp: integrationTimestamp,
          title: 'Battery Integrated into Vehicle',
          description: `Battery integrated into vehicle ${vinStr}`,
          type: 'integration',
          role: 'OEM',
          metadata: {
            vin: vinStr,
          },
        });
      }
    }

    // 4. Second Life Events from blockchain (REAL DATA)
    if (secondLifeEvents && secondLifeEvents.length > 0) {
      secondLifeEvents.forEach((slEvent) => {
        const applicationTypeNames = [
          'None', 'Home Energy Storage', 'Grid Stabilization', 'Renewable Storage',
          'Backup Power', 'Light EV', 'Commercial Storage', 'Other'
        ];
        const appTypeName = slEvent.applicationType !== undefined
          ? applicationTypeNames[slEvent.applicationType] || 'Unknown'
          : 'Unknown application';

        if (slEvent.type === 'started') {
          events.push({
            id: slEvent.id,
            date: new Date(slEvent.timestamp * 1000).toISOString().split('T')[0],
            timestamp: slEvent.timestamp,
            title: 'Started Second Life',
            description: `Battery repurposed for second life: ${appTypeName}. Operator: ${slEvent.operator.slice(0, 6)}...${slEvent.operator.slice(-4)}`,
            type: 'stateChange',
            role: 'Aftermarket User',
            actor: slEvent.operator,
            metadata: {
              newState: 'SecondLife',
              applicationType: slEvent.applicationType,
              transactionHash: slEvent.transactionHash,
            },
          });
        } else if (slEvent.type === 'ended') {
          events.push({
            id: slEvent.id,
            date: new Date(slEvent.timestamp * 1000).toISOString().split('T')[0],
            timestamp: slEvent.timestamp,
            title: 'Ended Second Life',
            description: `Second life ended. Battery ready for recycling.`,
            type: 'stateChange',
            role: 'Aftermarket User',
            actor: slEvent.operator,
            metadata: {
              transactionHash: slEvent.transactionHash,
            },
          });
        }
      });
    }

    // 5. Recycling Events from blockchain (REAL DATA)
    if (recyclingEvents && recyclingEvents.length > 0) {
      recyclingEvents.forEach((recyclingEvent) => {
        if (recyclingEvent.type === 'started') {
          events.push({
            id: recyclingEvent.id,
            date: new Date(recyclingEvent.timestamp * 1000).toISOString().split('T')[0],
            timestamp: recyclingEvent.timestamp,
            title: 'Recycling Started',
            description: `Battery received at recycling facility: ${recyclingEvent.facility?.slice(0, 6)}...${recyclingEvent.facility?.slice(-4)}`,
            type: 'recycling',
            role: 'Recycler',
            actor: recyclingEvent.facility,
            metadata: {
              transactionHash: recyclingEvent.transactionHash,
            },
          });
        } else if (recyclingEvent.type === 'completed') {
          events.push({
            id: recyclingEvent.id,
            date: new Date(recyclingEvent.timestamp * 1000).toISOString().split('T')[0],
            timestamp: recyclingEvent.timestamp,
            title: 'Recycling Completed',
            description: `Battery materials recovered and recycled according to EU regulations`,
            type: 'recycling',
            role: 'Recycler',
            actor: recyclingEvent.facility,
            metadata: {
              carbonFootprint: Number(battery.carbonFootprintTotal),
              transactionHash: recyclingEvent.transactionHash,
            },
          });
        }
      });
    }

    // 6. SOH Update Events from blockchain (REAL DATA)
    if (sohEvents && sohEvents.length > 0) {
      sohEvents.forEach((sohEvent) => {
        events.push({
          id: sohEvent.id,
          date: new Date(sohEvent.timestamp * 1000).toISOString().split('T')[0],
          timestamp: sohEvent.timestamp,
          title: 'State of Health Updated',
          description: `Battery SOH updated from ${sohEvent.previousSOH.toFixed(2)}% to ${sohEvent.newSOH.toFixed(2)}% (${sohEvent.cycles} cycles)`,
          type: 'sohUpdate',
          metadata: {
            previousSOH: sohEvent.previousSOH,
            currentSOH: sohEvent.newSOH,
            cyclesCompleted: sohEvent.cycles,
            transactionHash: sohEvent.transactionHash,
          },
        });
      });
    }

    // 7. Telemetry Events from DataVault (REAL DATA)
    if (dataVaultEvents && dataVaultEvents.length > 0) {
      dataVaultEvents.forEach((dvEvent) => {
        if (dvEvent.type === 'telemetry') {
          const recordedByName = getDisplayName(dvEvent.recordedBy);
          events.push({
            id: dvEvent.id,
            date: new Date(dvEvent.timestamp * 1000).toISOString().split('T')[0],
            timestamp: dvEvent.timestamp,
            title: 'Telemetry Recorded',
            description: `SOH: ${dvEvent.soh.toFixed(2)}%, SOC: ${dvEvent.soc.toFixed(2)}%, Mileage: ${dvEvent.mileage} km, Cycles: ${dvEvent.chargeCycles}. Recorded by ${recordedByName}`,
            type: 'sohUpdate', // Use sohUpdate type for visual consistency
            role: 'Fleet Operator',
            actor: dvEvent.recordedBy,
            metadata: {
              soh: dvEvent.soh,
              soc: dvEvent.soc,
              mileage: dvEvent.mileage,
              chargeCycles: dvEvent.chargeCycles,
              transactionHash: dvEvent.transactionHash,
            },
          });
        } else if (dvEvent.type === 'maintenance') {
          const maintenanceTypes = ['Inspection', 'Repair', 'Upgrade', 'Calibration', 'Testing', 'Other'];
          const maintenanceTypeName = maintenanceTypes[dvEvent.maintenanceType] || 'Maintenance';
          const recordedByName = getDisplayName(dvEvent.recordedBy);

          events.push({
            id: dvEvent.id,
            date: new Date(dvEvent.timestamp * 1000).toISOString().split('T')[0],
            timestamp: dvEvent.timestamp,
            title: `${maintenanceTypeName} Performed`,
            description: `Maintenance performed by ${dvEvent.technicianId}. Recorded by ${recordedByName}`,
            type: 'maintenance',
            role: 'Fleet Operator',
            actor: dvEvent.recordedBy,
            metadata: {
              maintenanceType: dvEvent.maintenanceType,
              technicianId: dvEvent.technicianId,
              serviceDate: dvEvent.serviceDate,
              transactionHash: dvEvent.transactionHash,
            },
          });
        } else if (dvEvent.type === 'critical') {
          const eventTypes = ['Overheating', 'Overcurrent', 'Overvoltage', 'Undervoltage', 'Short Circuit', 'Collision', 'Fire', 'Other'];
          const severityLevels = ['Low', 'Medium', 'High', 'Critical'];
          const eventTypeName = eventTypes[dvEvent.eventType] || 'Critical Event';
          const severityName = severityLevels[dvEvent.severity] || 'Unknown';
          const recordedByName = getDisplayName(dvEvent.recordedBy);

          events.push({
            id: dvEvent.id,
            date: new Date(dvEvent.timestamp * 1000).toISOString().split('T')[0],
            timestamp: dvEvent.timestamp,
            title: `⚠️ ${eventTypeName}`,
            description: `Critical event detected (${severityName} severity). Recorded by ${recordedByName}`,
            type: 'critical',
            role: 'Fleet Operator',
            actor: dvEvent.recordedBy,
            metadata: {
              eventType: dvEvent.eventType,
              severity: dvEvent.severity,
              eventDate: dvEvent.eventDate,
              transactionHash: dvEvent.transactionHash,
            },
          });
        }
      });
    }

    // 8. Carbon Footprint Events (REAL DATA)
    if (carbonEvents && carbonEvents.length > 0) {
      carbonEvents.forEach((carbonEvent) => {
        const recordedByName = getDisplayName(carbonEvent.recordedBy);

        events.push({
          id: carbonEvent.id,
          date: new Date(carbonEvent.timestamp * 1000).toISOString().split('T')[0],
          timestamp: carbonEvent.timestamp,
          title: `Carbon Emission Recorded: ${carbonEvent.phaseName}`,
          description: `${carbonEvent.kgCO2e.toLocaleString()} kg CO₂e added for ${carbonEvent.phaseName}. Recorded by ${recordedByName}`,
          type: 'carbonFootprint',
          role: 'Carbon Auditor',
          actor: carbonEvent.recordedBy,
          metadata: {
            phase: carbonEvent.phase,
            phaseName: carbonEvent.phaseName,
            kgCO2e: carbonEvent.kgCO2e,
            transactionHash: carbonEvent.transactionHash,
          },
        });
      });
    }

    // Sort all events chronologically
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }, [batteryData, transferHistory, secondLifeEvents, recyclingEvents, dataVaultEvents, sohEvents, carbonEvents, bin]);

  return {
    timeline,
    isLoading: !batteryData,
  };
}

/**
 * Get role display name from role number
 */
export function getRoleName(roleNumber: number): string {
  return roleMap[roleNumber] || 'Unknown';
}

/**
 * Get state display name from state number
 */
export function getStateName(stateNumber: number): string {
  return stateMap[stateNumber] || 'Unknown';
}
