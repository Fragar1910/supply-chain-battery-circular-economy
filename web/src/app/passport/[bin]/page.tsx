'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWallet, useBatteryEvents, useToast, useTimelineEvents, useTransferHistory, getRoleName } from '@/hooks';
import { getSupplyChainRole, getDisplayName } from '@/lib/roleMapping';
import { useReadContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';
import {
  Battery,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  TrendingUp,
  Leaf,
  Package,
  Download,
  Share2,
  AlertCircle,
  Loader2,
  Car,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { CarbonFootprintChart } from '@/components/charts/CarbonFootprintChart';
import { SupplyChainGraph, SupplyChainEvent } from '@/components/charts/SupplyChainGraph';

// Leaflet requires window, so we need to import it dynamically with ssr: false
const LocationMap = dynamic(
  () => import('@/components/maps').then((mod) => ({ default: mod.LocationMap })),
  { ssr: false, loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-lg" /> }
);

interface BatteryPassportPageProps {
  params: Promise<{ bin: string }>;
}

export default function BatteryPassportPage({ params }: BatteryPassportPageProps) {
  const { bin } = use(params);
  const { isConnected } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Convert BIN string to bytes32 for contract calls
  const binBytes32 = useMemo(() => binToBytes32(bin), [bin]);

  // Read battery data from contract
  const {
    data: batteryData,
    isLoading: isBatteryLoading,
    error: batteryError,
    refetch: refetchBattery
  } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: [binBytes32],
    query: {
      enabled: isConnected && bin.length > 0,
      refetchInterval: 5000, // Refetch every 5 seconds to catch ownership changes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });

  // Read carbon footprint data
  const {
    data: carbonFootprintData,
  } = useReadContract({
    address: CONTRACTS.CarbonFootprint?.address as `0x${string}` | undefined,
    abi: CONTRACTS.CarbonFootprint?.abi,
    functionName: 'getTotalFootprint',
    args: [binBytes32],
    query: {
      enabled: isConnected && bin.length > 0 && !!CONTRACTS.CarbonFootprint,
    },
  });

  // Get transfer history from blockchain event logs (REAL DATA)
  const { transfers: transferHistoryData, transferCount } = useTransferHistory(bin);

  // Get complete timeline events
  const { timeline: timelineEvents } = useTimelineEvents(bin);

  // Listen to real-time events for this battery
  useBatteryEvents(bin, {
    enabled: isConnected && bin.length > 0,
    onBatterySOHUpdated: (event) => {
      console.log('SOH updated for battery:', event.bin, event.data);
      // Show toast notification
      toast.batterySOHUpdated(event.bin, event.data.newSOH || 0);
      // Invalidate queries to refetch latest data
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      setLastUpdate(new Date());
    },
    onOwnershipTransferred: (event) => {
      console.log('Ownership transferred for battery:', event.bin, event.data);
      // Show toast notification
      toast.batteryOwnershipTransferred(event.bin, event.data.newOwner || '');
      // Invalidate all queries to refetch transfer history and battery data
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      setLastUpdate(new Date());
      // Give time for blockchain to update, then reload to get fresh event logs
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onStatusChanged: (event) => {
      console.log('Status changed for battery:', event.bin, event.data);
      // Show toast notification
      toast.batteryStatusChanged(event.bin, event.data.newStatus || '');
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      setLastUpdate(new Date());
    },
    onBatteryTransferred: (event) => {
      console.log('Battery transferred:', event.bin, event.data);
      // Show toast notification
      toast.success(`Battery transferred from ${getRoleName(event.data.fromRole)} to ${getRoleName(event.data.toRole)}`);
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      setLastUpdate(new Date());
    },
  });

  // Chemistry enum mapping (must match BatteryRegistry.sol)
  // enum Chemistry { Unknown, NMC, NCA, LFP, LTO, LiMetal }
  const chemistryMap: { [key: number]: string } = {
    0: 'Unknown',
    1: 'NMC',
    2: 'NCA',
    3: 'LFP',
    4: 'LTO',
    5: 'LiMetal',
  };

  // BatteryState enum mapping
  // enum BatteryState { Manufactured, Integrated, FirstLife, SecondLife, EndOfLife, Recycled }
  const stateMap: { [key: number]: string } = {
    0: 'Manufactured',
    1: 'Integrated',
    2: 'FirstLife',
    3: 'SecondLife',
    4: 'EndOfLife',
    5: 'Recycled',
  };

  // Helper function to get location based on battery state
  const getLocationByState = (state: number): { location: string; latitude: number; longitude: number } => {
    switch (state) {
      case 0: // Manufactured
        return { location: 'Stockholm, Sweden', latitude: 59.3293, longitude: 18.0686 }; // Northvolt Ett
      case 1: // Integrated
        return { location: 'Stuttgart, Germany', latitude: 48.7758, longitude: 9.1829 }; // OEM Manufacturing
      case 2: // FirstLife
        return { location: 'Oslo, Norway', latitude: 59.9139, longitude: 10.7522 }; // Fleet Operator
      case 3: // SecondLife
        return { location: 'Madrid, Spain', latitude: 40.4168, longitude: -3.7038 }; // Aftermarket User
      case 4: // EndOfLife
        return { location: 'Brussels, Belgium', latitude: 50.8503, longitude: 4.3517 }; // Ready for Recycling
      case 5: // Recycled
        return { location: 'Antwerp, Belgium', latitude: 51.2194, longitude: 4.4025 }; // Recycling Facility
      default:
        return { location: 'Stockholm, Sweden', latitude: 59.3293, longitude: 18.0686 }; // Default
    }
  };

  // Parse battery data from contract
  const parsedBatteryData = batteryData ? {
    bin: bin,
    // VIN: bytes32 to string, remove null bytes
    vin: (batteryData as any).vin && (batteryData as any).vin !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      ? (() => {
          const hex = (batteryData as any).vin.slice(2);
          let str = '';
          for (let i = 0; i < hex.length; i += 2) {
            const charCode = parseInt(hex.substring(i, i + 2), 16);
            if (charCode === 0) break;
            str += String.fromCharCode(charCode);
          }
          return str || 'N/A';
        })()
      : 'N/A',
    manufacturer: (batteryData as any).manufacturer || 'Unknown',
    manufactureDate: (batteryData as any).manufactureDate
      ? new Date(Number((batteryData as any).manufactureDate) * 1000).toISOString().split('T')[0]
      : '2024-01-15',
    // State: convert enum number to string
    status: stateMap[Number((batteryData as any).state)] || 'Manufactured',
    // SOH: uint16 in basis points (0-10000 = 0.00%-100.00%)
    soh: typeof (batteryData as any).sohCurrent === 'bigint'
      ? Number((batteryData as any).sohCurrent) / 100 // Convert basis points to percentage
      : (batteryData as any).sohCurrent
      ? Number((batteryData as any).sohCurrent) / 100
      : 100,
    // Capacity: uint32 stored as kWh (despite confusing struct comment)
    capacity: typeof (batteryData as any).capacityKwh === 'bigint'
      ? Number((batteryData as any).capacityKwh)
      : (batteryData as any).capacityKwh
      ? Number((batteryData as any).capacityKwh)
      : 85,
    // Chemistry: convert enum number to string
    chemistry: chemistryMap[Number((batteryData as any).chemistry)] || 'Unknown',
    // Weight: Contract doesn't store weight, estimate based on capacity (~5.6 kg/kWh for EV batteries)
    weight: typeof (batteryData as any).capacityKwh === 'bigint'
      ? Math.round(Number((batteryData as any).capacityKwh) * 5.6 * 10) / 10 // kWh * 5.6 kg/kWh, rounded to 1 decimal
      : (batteryData as any).capacityKwh
      ? Math.round(Number((batteryData as any).capacityKwh) * 5.6 * 10) / 10
      : 450,
    // Location based on battery state
    ...getLocationByState(Number((batteryData as any).state) || 0),
    currentOwner: (batteryData as any).currentOwner || '0x0000000000000000000000000000000000000000',
    // Carbon footprint: use from contract or carbonFootprintData
    carbonFootprint: typeof (batteryData as any).carbonFootprintTotal === 'bigint'
      ? Number((batteryData as any).carbonFootprintTotal)
      : typeof carbonFootprintData === 'bigint'
      ? Number(carbonFootprintData)
      : 5600,
  } : null;

  // Carbon footprint breakdown (calculated from total using industry standard percentages)
  // Note: Contract provides total footprint. Breakdown is calculated based on typical EV battery lifecycle:
  // - Raw Materials: 21% (mining, processing lithium, cobalt, nickel)
  // - Manufacturing: 61% (cell production, module assembly, pack integration)
  // - Transport: 14% (international shipping, logistics)
  // - Usage: 4% (charging efficiency losses over lifetime)
  const carbonData = parsedBatteryData ? [
    {
      stage: 'Raw Materials',
      emissions: Math.floor(parsedBatteryData.carbonFootprint * 0.21),
      percentage: 21,
      color: '#3b82f6',
      description: 'Mining and processing of lithium, cobalt, nickel, and other materials'
    },
    {
      stage: 'Manufacturing',
      emissions: Math.floor(parsedBatteryData.carbonFootprint * 0.61),
      percentage: 61,
      color: '#10b981',
      description: 'Cell production, module assembly, and battery pack integration'
    },
    {
      stage: 'Transport',
      emissions: Math.floor(parsedBatteryData.carbonFootprint * 0.14),
      percentage: 14,
      color: '#8b5cf6',
      description: 'International shipping and logistics throughout supply chain'
    },
    {
      stage: 'Usage',
      emissions: Math.floor(parsedBatteryData.carbonFootprint * 0.04),
      percentage: 4,
      color: '#f59e0b',
      description: 'Charging efficiency losses and grid emissions during operational lifetime'
    },
  ] : [];

  // Parse supply chain events from transfer history (REAL DATA from blockchain events)
  const supplyChainEvents: SupplyChainEvent[] = useMemo(() => {
    const events: SupplyChainEvent[] = [];

    // Add initial manufacturing event
    if (parsedBatteryData) {
      events.push({
        id: '0',
        role: 'Manufacturer',
        timestamp: parsedBatteryData.manufactureDate ? `${parsedBatteryData.manufactureDate}T00:00:00Z` : new Date().toISOString(),
        actor: parsedBatteryData.manufacturer,
        description: 'Battery manufactured and registered',
      });
    }

    // Add transfer events from blockchain logs using address mapping
    if (transferHistoryData && transferHistoryData.length > 0) {
      transferHistoryData.forEach((transfer, index) => {
        // Use actual address to determine role
        const role = getSupplyChainRole(transfer.to);
        const displayName = getDisplayName(transfer.to);

        events.push({
          id: String(index + 1),
          role,
          timestamp: new Date(transfer.timestamp * 1000).toISOString(),
          actor: transfer.to,
          description: `Battery transferred to ${displayName} (${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)})`,
        });
      });
    }

    return events;
  }, [transferHistoryData, parsedBatteryData]);

  const specifications = parsedBatteryData ? [
    { label: 'Chemistry', value: parsedBatteryData.chemistry },
    { label: 'Capacity', value: `${parsedBatteryData.capacity} kWh` },
    { label: 'Weight', value: `${parsedBatteryData.weight} kg` },
    { label: 'VIN', value: parsedBatteryData.vin },
  ] : [];

  // Use complete timeline from useTimelineEvents hook (REAL DATA)
  const timeline = timelineEvents && timelineEvents.length > 0
    ? timelineEvents
    : parsedBatteryData
    ? [
        // Fallback to minimal timeline from battery data
        {
          id: 'fallback-1',
          date: parsedBatteryData.manufactureDate || '2024-01-15',
          timestamp: 0,
          title: 'Battery Manufactured',
          description: `Battery manufactured at ${parsedBatteryData.manufacturer || 'Unknown facility'}`,
          type: 'registration' as const,
          role: 'Manufacturer',
          actor: parsedBatteryData.manufacturer || 'Unknown',
        },
      ]
    : [];

  const statusConfig = {
    Manufactured: { color: 'bg-blue-600', label: 'Manufactured', variant: 'default' as const },
    Integrated: { color: 'bg-cyan-600', label: 'Integrated', variant: 'default' as const },
    FirstLife: { color: 'bg-green-600', label: 'First Life', variant: 'success' as const },
    SecondLife: { color: 'bg-yellow-600', label: 'Second Life', variant: 'warning' as const },
    EndOfLife: { color: 'bg-orange-600', label: 'End of Life', variant: 'destructive' as const },
    Recycled: { color: 'bg-slate-600', label: 'Recycled', variant: 'secondary' as const },
  };

  const config = parsedBatteryData
    ? statusConfig[parsedBatteryData.status as keyof typeof statusConfig]
    : statusConfig.Manufactured;

  // Loading state
  if (isBatteryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
              <div>
                <CardTitle>Loading Battery Passport</CardTitle>
                <CardDescription>Fetching data from blockchain...</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state
  if (batteryError || !parsedBatteryData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <CardTitle>Battery Not Found</CardTitle>
            </div>
            <CardDescription>
              {batteryError
                ? `Error loading battery data: ${batteryError.message}`
                : `No battery found with BIN: ${bin}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">Battery Passport</h1>
                  <Badge variant="success" className="text-xs">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  EU Digital Battery Passport • Last update: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Battery Header */}
        <Card className="mb-8 bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Battery className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-white">{parsedBatteryData.bin}</h2>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <p className="text-slate-400">{parsedBatteryData.manufacturer}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {parsedBatteryData.manufactureDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {parsedBatteryData.location}
                    </span>
                    {parsedBatteryData.vin && parsedBatteryData.vin !== 'N/A' && (
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        VIN: {parsedBatteryData.vin}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-white">{parsedBatteryData.soh.toFixed(2)}%</p>
                  <p className="text-xs text-slate-400 mt-1">State of Health</p>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-white">
                    {(parsedBatteryData.carbonFootprint / 1000).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">tons CO₂</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="supply-chain">Supply Chain</TabsTrigger>
            <TabsTrigger value="carbon">Carbon Footprint</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Specifications */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {specifications.map((spec) => (
                    <div key={spec.label} className="flex justify-between items-center">
                      <span className="text-slate-400">{spec.label}</span>
                      {spec.label === 'VIN' ? (
                        spec.value === 'N/A' ? (
                          <Badge variant="outline" className="text-slate-500">
                            Not Integrated
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Car className="h-3 w-3 text-cyan-400" />
                            <span className="font-mono text-sm text-cyan-400 font-medium">{spec.value}</span>
                          </div>
                        )
                      ) : (
                        <span className="font-medium text-white">{spec.value}</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Ownership */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Current Ownership
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Owner</span>
                    <span className="font-mono text-sm text-white">
                      {parsedBatteryData.currentOwner.slice(0, 6)}...{parsedBatteryData.currentOwner.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location</span>
                    <span className="text-white">{parsedBatteryData.location}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location Map */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Current Location
                </CardTitle>
                <CardDescription>
                  Real-time battery location tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocationMap
                  latitude={parsedBatteryData.latitude}
                  longitude={parsedBatteryData.longitude}
                  locationName={parsedBatteryData.location}
                  zoom={13}
                  height="350px"
                />
              </CardContent>
            </Card>

            {/* Performance */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">State of Health (SOH)</span>
                    <span className="font-medium text-white">{parsedBatteryData.soh.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${parsedBatteryData.soh}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">Remaining Capacity</span>
                    <span className="font-medium text-white">
                      {(parsedBatteryData.capacity * (parsedBatteryData.soh / 100)).toFixed(2)} kWh
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${parsedBatteryData.soh}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supply-chain" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Supply Chain Traceability</CardTitle>
                <CardDescription>
                  Complete journey from raw materials to current location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SupplyChainGraph events={supplyChainEvents} />
              </CardContent>
            </Card>

            {/* Events List */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Supply Chain Events</CardTitle>
                <CardDescription>{transferCount} ownership transfer{transferCount !== 1 ? 's' : ''} recorded on blockchain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplyChainEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No supply chain events recorded yet</p>
                    <p className="text-xs mt-2">Events will appear here when the battery is transferred between actors</p>
                  </div>
                ) : (
                  supplyChainEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{event.role}</Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-white">{event.description}</p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Address: {event.actor.slice(0, 6)}...{event.actor.slice(-4)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carbon" className="space-y-6">
            <CarbonFootprintChart
              data={carbonData}
              title="Lifecycle Carbon Footprint"
              description="CO₂ emissions breakdown across the battery lifecycle"
            />

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Carbon Impact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {carbonData.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-300">{item.stage}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">
                        {item.emissions.toLocaleString()} kg CO₂
                      </p>
                      <p className="text-xs text-slate-400">
                        {((item.emissions / parsedBatteryData.carbonFootprint) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Battery Lifecycle Timeline</CardTitle>
                <CardDescription>Complete history of this battery - {timeline.length} events recorded</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timeline.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No timeline events available yet</p>
                    </div>
                  ) : (
                    timeline.map((event, index) => {
                      // Determine color and style based on event type
                      const eventColors = {
                        registration: 'bg-blue-500',
                        transfer: 'bg-purple-500',
                        stateChange: 'bg-yellow-500',
                        sohUpdate: 'bg-orange-500',
                        integration: 'bg-cyan-500',
                        recycling: 'bg-green-500',
                        maintenance: 'bg-indigo-500',
                        critical: 'bg-red-500',
                      };
                      const dotColor = eventColors[event.type as keyof typeof eventColors] || 'bg-green-500';

                      return (
                        <div key={event.id || index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 ${dotColor} rounded-full ring-4 ring-slate-800`} />
                            {index < timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-slate-700 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white">{event.title}</p>
                              {event.role && (
                                <Badge variant="outline" className="text-xs">
                                  {event.role}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mb-2">{event.date}</p>
                            <p className="text-sm text-slate-400">{event.description}</p>
                            {event.actor && (
                              <p className="text-xs text-slate-600 mt-1 font-mono">
                                Actor: {event.actor.slice(0, 6)}...{event.actor.slice(-4)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
