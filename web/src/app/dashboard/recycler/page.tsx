'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useRole } from '@/hooks';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import {
  Recycle,
  Battery,
  TrendingUp,
  Leaf,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  Eye,
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
import { BatteryCard } from '@/components/battery';
import { DashboardLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { RecycleBatteryForm } from '@/components/forms';

export default function RecyclerDashboardPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { hasRole: isRecycler } = useRole('RoleManager', 'RECYCLER_ROLE');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showRecycleForm, setShowRecycleForm] = useState(false);

  // Mock data for batteries received for recycling
  const batteriesForRecycling = [
    {
      bin: 'NV-2023-000123',
      manufacturer: 'Northvolt AB',
      status: 'Recycled' as const,
      soh: 42,
      carbonFootprint: 5600,
      receiptDate: '2024-11-15',
      chemistry: 'NMC811',
      capacity: 75,
      weight: 450,
    },
    {
      bin: 'NV-2023-000124',
      manufacturer: 'Northvolt AB',
      status: 'SecondLife' as const,
      soh: 48,
      carbonFootprint: 5400,
      receiptDate: '2024-12-01',
      chemistry: 'LFP',
      capacity: 60,
      weight: 380,
    },
    {
      bin: 'NV-2023-000125',
      manufacturer: 'CATL',
      status: 'Recycled' as const,
      soh: 38,
      carbonFootprint: 5700,
      receiptDate: '2024-12-03',
      chemistry: 'NMC622',
      capacity: 80,
      weight: 480,
    },
  ];

  // Materials recovery data
  const materialsRecovered = [
    {
      material: 'Lithium',
      totalKg: 125,
      recoveredKg: 105,
      recoveryRate: 84,
      euTarget: 80, // EU 2031 target: 80%
      value: 15750, // EUR
    },
    {
      material: 'Cobalt',
      totalKg: 85,
      recoveredKg: 77,
      recoveryRate: 91,
      euTarget: 90,
      value: 4620,
    },
    {
      material: 'Nickel',
      totalKg: 180,
      recoveredKg: 165,
      recoveryRate: 92,
      euTarget: 90,
      value: 2970,
    },
    {
      material: 'Copper',
      totalKg: 95,
      recoveredKg: 87,
      recoveryRate: 92,
      euTarget: 90,
      value: 783,
    },
    {
      material: 'Aluminum',
      totalKg: 65,
      recoveredKg: 60,
      recoveryRate: 92,
      euTarget: 85,
      value: 150,
    },
    {
      material: 'Graphite',
      totalKg: 110,
      recoveredKg: 82,
      recoveryRate: 75,
      euTarget: 70,
      value: 410,
    },
  ];

  const recyclingMethods = [
    {
      method: 'Hydrometallurgical',
      batteriesProcessed: 45,
      avgRecoveryRate: 88,
      description: 'Chemical leaching process',
    },
    {
      method: 'Pyrometallurgical',
      batteriesProcessed: 28,
      avgRecoveryRate: 82,
      description: 'High temperature smelting',
    },
    {
      method: 'Direct Recycling',
      batteriesProcessed: 12,
      avgRecoveryRate: 95,
      description: 'Cathode material recovery',
    },
  ];

  const recoveryData = materialsRecovered.map((m) => ({
    stage: m.material,
    emissions: m.recoveredKg,
    color:
      m.material === 'Lithium'
        ? '#3b82f6'
        : m.material === 'Cobalt'
        ? '#10b981'
        : m.material === 'Nickel'
        ? '#8b5cf6'
        : m.material === 'Copper'
        ? '#f59e0b'
        : m.material === 'Aluminum'
        ? '#ef4444'
        : '#6366f1',
  }));

  const euComplianceStatus = {
    lithiumRecovery: {
      current: 84,
      target2027: 50,
      target2031: 80,
      compliant: true,
    },
    cobaltRecovery: {
      current: 91,
      target2027: 90,
      target2031: 95,
      compliant: true,
    },
    nickelRecovery: {
      current: 92,
      target2027: 90,
      target2031: 95,
      compliant: true,
    },
    copperRecovery: {
      current: 92,
      target2027: 90,
      target2031: 95,
      compliant: true,
    },
  };

  return (
    <ProtectedRoute requiredRoles={['RECYCLER_ROLE', 'ADMIN_ROLE']}>
      <DashboardLayout>
      <div className="px-4 md:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Recycle className="h-8 w-8 text-green-500" />
              <h1 className="text-3xl font-bold text-white">Recycler Dashboard</h1>
            </div>
            <p className="text-slate-400">
              Battery Recycling & Material Recovery Management
            </p>
          </div>
          <Button
            className="mt-4 md:mt-0"
            onClick={() => setShowRecycleForm(!showRecycleForm)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {showRecycleForm ? 'Hide Form' : 'Register Recycling'}
          </Button>
        </div>

        {/* Recycle Battery Form */}
        {showRecycleForm && (
          <div className="mb-8">
            <RecycleBatteryForm
              onSuccess={(bin) => {
                // Don't close form or navigate - let user see success messages and toasts
                // User can click "View Passport" button in success message
                console.log('Battery recycled:', bin);
              }}
              onError={(error) => {
                console.error('Recycling error:', error);
              }}
            />
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Batteries Recycled
              </CardTitle>
              <Recycle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {batteriesForRecycling.filter((b) => b.status === 'Recycled').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total processed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Materials Recovered
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {materialsRecovered
                  .reduce((sum, m) => sum + m.recoveredKg, 0)
                  .toFixed(0)}{' '}
                kg
              </div>
              <p className="text-xs text-slate-500 mt-1">Total weight</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Avg. Recovery Rate
              </CardTitle>
              <Leaf className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {(
                  materialsRecovered.reduce((sum, m) => sum + m.recoveryRate, 0) /
                  materialsRecovered.length
                ).toFixed(1)}
                %
              </div>
              <p className="text-xs text-slate-500 mt-1">Exceeds EU targets</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Material Value
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                €
                {materialsRecovered
                  .reduce((sum, m) => sum + m.value, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Recovered value</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="batteries">Batteries</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="compliance">EU Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Materials Recovery Chart */}
            <CarbonFootprintChart
              data={recoveryData}
              title="Materials Recovered (kg)"
              description="Total weight of materials recovered from battery recycling"
            />

            {/* Recycling Methods */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Recycling Methods</CardTitle>
                <CardDescription>Performance by process type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recyclingMethods.map((method) => (
                    <div
                      key={method.method}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{method.method}</h3>
                        <p className="text-sm text-slate-400">{method.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          {method.avgRecoveryRate}%
                        </div>
                        <p className="text-xs text-slate-500">
                          {method.batteriesProcessed} batteries
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batteries" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Batteries for Recycling</CardTitle>
                    <CardDescription>Received and processed batteries</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Export Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {batteriesForRecycling.map((battery) => (
                    <BatteryCard
                      key={battery.bin}
                      battery={battery}
                      onClick={() => router.push(`/passport/${battery.bin}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Materials Recovery Details</CardTitle>
                <CardDescription>
                  Breakdown by material type with EU targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {materialsRecovered.map((material) => {
                    const meetsTarget = material.recoveryRate >= material.euTarget;
                    return (
                      <div key={material.material} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {material.material}
                            </span>
                            {meetsTarget ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-white">
                              {material.recoveryRate}%
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              (Target: {material.euTarget}%)
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Total: </span>
                            <span className="text-white">{material.totalKg} kg</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Recovered: </span>
                            <span className="text-white">{material.recoveredKg} kg</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Value: </span>
                            <span className="text-white">€{material.value}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              meetsTarget ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${material.recoveryRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>EU Compliance Status</CardTitle>
                <CardDescription>
                  Compliance with EU Battery Regulation 2023/1542
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(euComplianceStatus).map(([key, compliance]) => {
                    const label = key
                      .replace('Recovery', ' Recovery')
                      .replace(/([A-Z])/g, ' $1')
                      .trim();
                    return (
                      <div
                        key={key}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-white capitalize">{label}</h3>
                          <Badge variant={compliance.compliant ? 'success' : 'destructive'}>
                            {compliance.compliant ? 'Compliant' : 'Non-Compliant'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Current: </span>
                            <span className="text-white font-semibold">
                              {compliance.current}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Target 2027: </span>
                            <span className="text-white">{compliance.target2027}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Target 2031: </span>
                            <span className="text-white">{compliance.target2031}%</span>
                          </div>
                        </div>
                        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${compliance.current}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-500">
                        Full Compliance Achieved
                      </p>
                      <p className="text-sm text-green-400 mt-1">
                        All recovery rates meet or exceed EU 2031 targets
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
