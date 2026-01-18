'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useRole } from '@/hooks';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import {
  Car,
  Battery,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Link2,
  Eye,
  ArrowRightLeft,
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
  Input,
  Label,
} from '@/components/ui';
import { BatteryCard } from '@/components/battery';
import { DashboardLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { IntegrateBatteryForm } from '@/components/forms';

export default function OEMDashboardPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { hasRole: isOEM } = useRole('RoleManager', 'OEM_ROLE');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showIntegrationForm, setShowIntegrationForm] = useState(false);

  // Mock data for vehicles
  const vehicles = [
    {
      vin: 'WBA12345678901234',
      model: 'Tesla Model 3',
      bin: 'NV-2024-001236',
      integrationDate: '2024-11-28',
      status: 'In Service',
      soh: 98,
      mileage: 5420,
    },
    {
      vin: 'WBA12345678901235',
      model: 'Tesla Model Y',
      bin: 'NV-2024-001237',
      integrationDate: '2024-12-03',
      status: 'In Service',
      soh: 99,
      mileage: 1250,
    },
    {
      vin: 'WBA12345678901236',
      model: 'Ford F-150 Lightning',
      bin: 'NV-2024-001238',
      integrationDate: '2024-12-05',
      status: 'Testing',
      soh: 100,
      mileage: 45,
    },
    {
      vin: 'WBA12345678901237',
      model: 'Rivian R1T',
      bin: 'NV-2024-001239',
      integrationDate: '2024-12-06',
      status: 'Ready for Delivery',
      soh: 100,
      mileage: 10,
    },
  ];

  const batteriesAvailable = [
    {
      bin: 'NV-2024-001240',
      manufacturer: 'Northvolt AB',
      status: 'Manufactured' as const,
      soh: 100,
      carbonFootprint: 5600,
      manufactureDate: '2024-12-07',
      chemistry: 'NMC811',
      capacity: 75,
    },
    {
      bin: 'NV-2024-001241',
      manufacturer: 'Northvolt AB',
      status: 'Manufactured' as const,
      soh: 100,
      carbonFootprint: 5400,
      manufactureDate: '2024-12-08',
      chemistry: 'LFP',
      capacity: 60,
    },
  ];

  const productionByMonth = [
    { month: 'Nov', vehicles: 1245 },
    { month: 'Dec', vehicles: 1387 },
    { month: 'Jan', vehicles: 1503 },
    { month: 'Feb', vehicles: 1492 },
  ];

  const statusConfig = {
    'In Service': { variant: 'success' as const, icon: CheckCircle },
    Testing: { variant: 'warning' as const, icon: AlertCircle },
    'Ready for Delivery': { variant: 'default' as const, icon: CheckCircle },
    Delivered: { variant: 'secondary' as const, icon: CheckCircle },
  };

  return (
    <ProtectedRoute requiredRoles={['OEM_ROLE', 'ADMIN_ROLE']}>
      <DashboardLayout>
      <div className="px-4 md:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-white">OEM Dashboard</h1>
            </div>
            <p className="text-slate-400">Vehicle Assembly & Battery Integration</p>
          </div>
          <Button
            className="mt-4 md:mt-0"
            onClick={() => setShowIntegrationForm(!showIntegrationForm)}
          >
            <Link2 className="h-4 w-4 mr-2" />
            {showIntegrationForm ? 'Hide Form' : 'Integrate Battery'}
          </Button>
        </div>

        {/* Integration Form */}
        {showIntegrationForm && (
          <div className="mb-8">
            <IntegrateBatteryForm
              onSuccess={(bin) => {
                // Don't close form or navigate - let user see success messages and toasts
                // User can click "View Passport" button in success message
                console.log('Battery integrated:', bin);
              }}
              onError={(error) => {
                console.error('Integration error:', error);
              }}
            />
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Vehicles Manufactured
              </CardTitle>
              <Car className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {vehicles.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Batteries Installed
              </CardTitle>
              <Battery className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {vehicles.filter((v) => v.status !== 'Testing').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Active integrations</p>
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
              <div className="text-2xl font-bold text-white">
                {(
                  vehicles.reduce((sum, v) => sum + v.soh, 0) / vehicles.length
                ).toFixed(1)}
                %
              </div>
              <p className="text-xs text-slate-500 mt-1">Avg. battery health</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Fleet Size
              </CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {vehicles.filter((v) => v.status === 'In Service').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Vehicles in service</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="available">Available Batteries</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Fleet Summary */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle>Fleet Summary</CardTitle>
                  <CardDescription>Vehicles by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      vehicles.reduce((acc, v) => {
                        acc[v.status] = (acc[v.status] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              statusConfig[status as keyof typeof statusConfig].variant
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle>Recent Integrations</CardTitle>
                  <CardDescription>Latest battery-vehicle pairings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vehicles.slice(0, 3).map((vehicle) => (
                      <div
                        key={vehicle.vin}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                            <span className="font-mono text-xs text-slate-400">
                              {vehicle.vin.slice(0, 12)}...
                            </span>
                          </div>
                          <p className="text-sm text-white">{vehicle.model}</p>
                          <p className="text-xs text-slate-500">
                            BIN: {vehicle.bin}
                          </p>
                        </div>
                        <Badge
                          variant={
                            statusConfig[vehicle.status as keyof typeof statusConfig]
                              .variant
                          }
                        >
                          {vehicle.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Vehicles</CardTitle>
                    <CardDescription>Complete fleet inventory</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicles.map((vehicle) => {
                    const config =
                      statusConfig[vehicle.status as keyof typeof statusConfig];
                    return (
                      <div
                        key={vehicle.vin}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Car className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold text-white">
                              {vehicle.model}
                            </span>
                            <Badge variant={config.variant}>{vehicle.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">VIN: </span>
                              <span className="text-white font-mono text-xs">
                                {vehicle.vin.slice(0, 12)}...
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">BIN: </span>
                              <span className="text-white">{vehicle.bin}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">SOH: </span>
                              <span className="text-white">{vehicle.soh}%</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Mileage: </span>
                              <span className="text-white">
                                {vehicle.mileage.toLocaleString()} km
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/passport/${vehicle.bin}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Battery
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Available Batteries</CardTitle>
                <CardDescription>
                  Manufactured batteries ready for integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {batteriesAvailable.map((battery) => (
                    <BatteryCard
                      key={battery.bin}
                      battery={battery}
                      onClick={() => {
                        setShowIntegrationForm(true);
                      }}
                    />
                  ))}
                </div>
                {batteriesAvailable.length === 0 && (
                  <div className="text-center py-8">
                    <Battery className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No batteries available for integration</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
