'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import {
  Battery,
  Users,
  Leaf,
  TrendingUp,
  QrCode,
  ArrowLeft,
  Factory,
  Truck,
  Recycle,
  Package,
  Car,
  Zap,
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
import { BatteryCard, BatteryData } from '@/components/battery/BatteryCard';
import { BatteryCardWithData } from '@/components/battery/BatteryCardWithData';
import { CarbonFootprintChart } from '@/components/charts/CarbonFootprintChart';
import { QRScanner } from '@/components/battery/QRScanner';
import { DashboardLayout } from '@/components/layout';
import { UpdateSOHForm, StartSecondLifeForm, TransferOwnershipForm, AcceptTransferForm, AuditRecyclingForm, AddCarbonEmissionForm } from '@/components/forms';

export default function DashboardPage() {
  const { address, isConnected } = useWallet();
  const [showScanner, setShowScanner] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Read contract data
  const { data: totalBatteries } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'totalBatteriesRegistered',
    query: { enabled: isConnected },
  });

  const { data: totalActors } = useReadContract({
    address: CONTRACTS.RoleManager.address,
    abi: CONTRACTS.RoleManager.abi,
    functionName: 'totalActors',
    query: { enabled: isConnected },
  });

  // TODO: Replace with real data from carbon footprint contract
  const carbonData = [
    { stage: 'Mining', emissions: 1200, color: '#3b82f6' },
    { stage: 'Manufacturing', emissions: 3400, color: '#10b981' },
    { stage: 'Transport', emissions: 800, color: '#8b5cf6' },
    { stage: 'Usage', emissions: 200, color: '#f59e0b' },
  ];

  // All seed batteries - Using seed data BINs (automatically registered by deploy-and-seed.sh)
  // Each BatteryCardWithData component will fetch real data from blockchain
  // Total: 16 batteries (9 original + 4 vehicle + 3 recycling)
  const allSeedBatteryBins = [
    // Original 9 batteries
    'NV-2024-001234', // Manufactured
    'NV-2024-002345', // FirstLife (SOH 85%)
    'NV-2024-003456', // SecondLife (SOH 72%)
    'NV-2024-004567', // SecondLife (SOH 52%)
    'NV-2024-005678', // Recycled
    'NV-2024-006789', // FirstLife (SOH 78%)
    'NV-2024-007890', // FirstLife (SOH 75%)
    'NV-2024-008901', // FirstLife (SOH 73%)
    'NV-2024-009012', // FirstLife (SOH 77%)

    // New: Vehicle integration batteries (Integrated state with VINs)
    'NV-2024-001236', // Tesla Model 3 (VIN: 5YJ3E1EA1KF000001)
    'NV-2024-001237', // Tesla Model Y (VIN: 5YJYGDEE0MF000002)
    'NV-2024-001238', // Ford Mustang Mach-E (VIN: 3FMTK3SU5MMA00003)
    'NV-2024-001239', // Tesla Model 3 (VIN: 5YJ3E1EA2KF000004)

    // New: Recycling batteries (EndOfLife state)
    'NV-2023-000123', // Old battery (SOH 35%)
    'NV-2023-000124', // Old battery (SOH 38%)
    'NV-2023-000125', // Old battery (SOH 42%)
  ];

  const handleScan = (bin: string) => {
    setShowScanner(false);
    window.location.href = `/passport/${bin}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet Required</CardTitle>
            <CardDescription>
              Please connect your wallet to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 md:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Battery Lifecycle Overview</p>
          </div>
          <Button onClick={() => setShowScanner(true)} className="mt-4 md:mt-0">
            <QrCode className="h-4 w-4 mr-2" />
            Scan Battery QR
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Total Batteries
              </CardTitle>
              <Battery className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalBatteries?.toString() || '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tracked on blockchain
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Supply Chain Actors
              </CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalActors?.toString() || '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verified participants
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Avg. Carbon Footprint
              </CardTitle>
              <Leaf className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">5.2</div>
              <p className="text-xs text-slate-500 mt-1">
                tons CO₂ per battery
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Avg. SOH
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">89%</div>
              <p className="text-xs text-slate-500 mt-1">
                State of Health
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links to Role Dashboards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          <Link href="/dashboard/supplier">
            <Card className="bg-gradient-to-br from-green-900/50 to-slate-900/50 border-green-800 hover:border-green-600 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Package className="h-10 w-10 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-white">Supplier</h3>
                    <p className="text-sm text-slate-400">Component supply</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          
          <Link href="/dashboard/manufacturer">
            <Card className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border-blue-800 hover:border-blue-600 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Factory className="h-10 w-10 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-white">Manufacturer</h3>
                    <p className="text-sm text-slate-400">Register batteries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          
          <Link href="/dashboard/oem">
            <Card className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-800 hover:border-purple-600 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Truck className="h-10 w-10 text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-white">OEM</h3>
                    <p className="text-sm text-slate-400">Vehicle integration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/fleet-operator">
            <Card className="bg-gradient-to-br from-amber-900/50 to-slate-900/50 border-amber-800 hover:border-amber-600 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Car className="h-10 w-10 text-amber-400" />
                  <div>
                    <h3 className="font-semibold text-white">Fleet Operator</h3>
                    <p className="text-sm text-slate-400">First life usage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/aftermarket">
            <Card className="bg-gradient-to-br from-cyan-900/50 to-slate-900/50 border-cyan-800 hover:border-cyan-600 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Zap className="h-10 w-10 text-cyan-400" />
                  <div>
                    <h3 className="font-semibold text-white">Aftermarket</h3>
                    <p className="text-sm text-slate-400">Second life apps</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/recycler">
            <Card className="bg-gradient-to-br from-yellow-900/50 to-slate-900/50 border-yellow-800 hover:border-yellow-600 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Recycle className="h-10 w-10 text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-white">Recycler</h3>
                    <p className="text-sm text-slate-400">Material recovery</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="transfers">Transfers</TabsTrigger>
              <TabsTrigger value="secondlife">Second Life</TabsTrigger>
              <TabsTrigger value="audits">Audits</TabsTrigger>
            </TabsList>

            {selectedTab === 'audits' && (
              <Link href="/dashboard/auditor">
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <Leaf className="h-4 w-4 mr-2" />
                  Carbon Audit Dashboard
                </Button>
              </Link>
            )}
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Carbon Footprint Chart */}
            <CarbonFootprintChart
              data={carbonData}
              title="Carbon Footprint Distribution"
              description="Average CO₂ emissions by supply chain stage"
            />

            {/* All Seed Batteries */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>All Seed Batteries</CardTitle>
                <CardDescription>
                  All 9 batteries registered in the seed data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allSeedBatteryBins.map((bin) => (
                    <BatteryCardWithData key={bin} bin={bin} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <UpdateSOHForm
              onSuccess={(bin, newSOH) => {
                console.log(`SOH updated for ${bin}: ${newSOH}%`);
                // Optionally navigate to passport or refresh data
              }}
              onError={(error) => {
                console.error('SOH update error:', error);
              }}
            />
          </TabsContent>

          <TabsContent value="transfers" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Initiate Transfer */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Initiate Transfer</h3>
                <TransferOwnershipForm
                  onSuccess={(bin, newOwner) => {
                    console.log(`Battery ${bin} transferred to ${newOwner}`);
                  }}
                  onError={(error) => {
                    console.error('Transfer error:', error);
                  }}
                />
              </div>

              {/* Accept/Reject Transfer */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Accept or Reject Transfer</h3>
                <AcceptTransferForm
                  onSuccess={(bin) => {
                    console.log(`Transfer processed for ${bin}`);
                  }}
                  onError={(error) => {
                    console.error('Accept transfer error:', error);
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="secondlife" className="space-y-6">
            <StartSecondLifeForm
              onSuccess={(bin) => {
                console.log(`Second life started for ${bin}`);
                window.location.href = `/passport/${bin}`;
              }}
              onError={(error) => {
                console.error('Second life error:', error);
              }}
            />
          </TabsContent>

          <TabsContent value="audits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AuditRecyclingForm
                onSuccess={(bin, approved) => {
                  console.log(`Audit completed for ${bin}: ${approved ? 'approved' : 'rejected'}`);
                  // Optionally navigate to passport or refresh data
                }}
                onError={(error) => {
                  console.error('Audit error:', error);
                }}
              />

              {/* Carbon Emission Form - Always visible */}
              <AddCarbonEmissionForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <QRScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
