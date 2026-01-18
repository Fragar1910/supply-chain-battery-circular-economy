'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useRole, useContractEvents, useToast } from '@/hooks';
import { useReadContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { CONTRACTS } from '@/config/contracts';
import {
  Factory,
  Battery,
  TrendingUp,
  Leaf,
  CheckCircle,
  AlertCircle,
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
import { RegisterBatteryForm } from '@/components/forms/RegisterBatteryForm';
import { ProtectedRoute } from '@/components/auth';

export default function ManufacturerDashboardPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { hasRole: isManufacturer } = useRole('RoleManager', 'MANUFACTURER_ROLE');
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Read total batteries from contract
  const { data: totalBatteries } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'totalBatteriesRegistered',
    query: {
      enabled: isConnected,
    },
  });

  // Listen to real-time events
  useContractEvents({
    enabled: isConnected,
    onBatteryRegistered: (event) => {
      console.log('New battery registered:', event.bin);
      // Show success notification
      toast.batteryRegistered(event.bin, {
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${event.bin}`),
        },
      });
      // Refresh battery count and list
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      setLastUpdate(new Date());
    },
    onBatterySOHUpdated: (event) => {
      console.log('SOH updated:', event.bin, event.data);
      toast.batterySOHUpdated(event.bin, event.data.newSOH || 0);
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      setLastUpdate(new Date());
    },
  });

  // Mock data for demonstration (in production, these would come from contract)
  const recentBatteries = [
    {
      bin: 'NV-2024-001234',
      manufacturer: 'Northvolt AB',
      status: 'Manufactured' as const,
      soh: 100,
      carbonFootprint: 5600,
      manufactureDate: '2024-12-01',
      chemistry: 'NMC811',
      capacity: 75,
    },
    {
      bin: 'NV-2024-001235',
      manufacturer: 'Northvolt AB',
      status: 'Manufactured' as const,
      soh: 100,
      carbonFootprint: 5400,
      manufactureDate: '2024-12-02',
      chemistry: 'LFP',
      capacity: 60,
    },
    {
      bin: 'NV-2024-001236',
      manufacturer: 'Northvolt AB',
      status: 'FirstLife' as const,
      soh: 98,
      carbonFootprint: 5700,
      manufactureDate: '2024-11-28',
      chemistry: 'NMC811',
      capacity: 80,
    },
    {
      bin: 'NV-2024-001237',
      manufacturer: 'Northvolt AB',
      status: 'Manufactured' as const,
      soh: 100,
      carbonFootprint: 5500,
      manufactureDate: '2024-12-03',
      chemistry: 'NCA',
      capacity: 85,
    },
  ];

  const productionStats = [
    { month: 'Nov', count: 145 },
    { month: 'Dec', count: 187 },
    { month: 'Jan', count: 203 },
    { month: 'Feb', count: 192 },
  ];

  const carbonDataByStage = [
    { stage: 'Raw Materials', emissions: 2100, color: '#3b82f6' },
    { stage: 'Cell Production', emissions: 2400, color: '#10b981' },
    { stage: 'Assembly', emissions: 900, color: '#8b5cf6' },
    { stage: 'Testing', emissions: 200, color: '#f59e0b' },
  ];

  const qualityMetrics = [
    { label: 'Pass Rate', value: 98.5, target: 98, color: 'green' },
    { label: 'SOH Initial', value: 100, target: 100, color: 'green' },
    { label: 'Defect Rate', value: 1.5, target: 2, color: 'green' },
  ];

  const certifications = [
    { name: 'ISO 9001', status: 'Active', expiry: '2025-06-30' },
    { name: 'ISO 14001', status: 'Active', expiry: '2025-08-15' },
    { name: 'EU Battery Passport', status: 'Active', expiry: '2026-12-31' },
    { name: 'UL 2054', status: 'Pending Renewal', expiry: '2024-12-31' },
  ];

  const handleBatteryRegistered = (bin: string) => {
    // Don't close the form automatically - let user see success messages and toasts
    // User can click "Register Another" or "Hide Form" manually
    console.log('Battery registered:', bin);
  };

  return (
    <ProtectedRoute requiredRoles={['MANUFACTURER_ROLE', 'ADMIN_ROLE']}>
      <DashboardLayout>
      <div className="px-4 md:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Factory className="h-8 w-8 text-green-500" />
              <h1 className="text-3xl font-bold text-white">Manufacturer Dashboard</h1>
              {isConnected && (
                <Badge variant="success" className="text-xs">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                  Live
                </Badge>
              )}
            </div>
            <p className="text-slate-400">
              Battery Production & Quality Control
              {isConnected && ` • Last update: ${lastUpdate.toLocaleTimeString()}`}
            </p>
          </div>
          <Button
            className="mt-4 md:mt-0"
            onClick={() => setShowRegisterForm(!showRegisterForm)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {showRegisterForm ? 'Hide Form' : 'Register New Battery'}
          </Button>
        </div>

        {/* Register Form */}
        {showRegisterForm && (
          <div className="mb-8">
            <RegisterBatteryForm
              onSuccess={handleBatteryRegistered}
              onError={(error) => console.error('Registration error:', error)}
            />
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Batteries Produced
              </CardTitle>
              <Battery className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalBatteries ? totalBatteries.toString() : '42'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total on blockchain</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Avg. SOH Initial
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">100%</div>
              <p className="text-xs text-slate-500 mt-1">Quality standard met</p>
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
              <div className="text-2xl font-bold text-white">5.5</div>
              <p className="text-xs text-slate-500 mt-1">tons CO₂ per battery</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Quality Pass Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">98.5%</div>
              <p className="text-xs text-slate-500 mt-1">Above target (98%)</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="batteries">Batteries</TabsTrigger>
            <TabsTrigger value="quality">Quality Control</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Carbon Footprint Chart */}
            <CarbonFootprintChart
              data={carbonDataByStage}
              title="Carbon Footprint by Production Stage"
              description="Total emissions breakdown during manufacturing process"
            />

            {/* Recent Batteries */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Recent Batteries</CardTitle>
                <CardDescription>Recently manufactured batteries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {recentBatteries.map((battery) => (
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

          <TabsContent value="batteries" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Batteries</CardTitle>
                    <CardDescription>
                      Complete list of manufactured batteries
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentBatteries.map((battery) => (
                    <div
                      key={battery.bin}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-green-500/50 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Battery className="h-5 w-5 text-green-500" />
                          <span className="font-mono text-sm text-slate-300">
                            {battery.bin}
                          </span>
                          <Badge
                            variant={
                              battery.status === 'Manufactured'
                                ? 'default'
                                : battery.status === 'FirstLife'
                                ? 'success'
                                : 'secondary'
                            }
                          >
                            {battery.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Chemistry: </span>
                            <span className="text-white">{battery.chemistry}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Capacity: </span>
                            <span className="text-white">{battery.capacity} kWh</span>
                          </div>
                          <div>
                            <span className="text-slate-400">SOH: </span>
                            <span className="text-white">{battery.soh}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Date: </span>
                            <span className="text-white">{battery.manufactureDate}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/passport/${battery.bin}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Performance against quality targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {qualityMetrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">
                          {metric.label}
                        </span>
                        <span className="text-sm text-slate-400">
                          {metric.value}% / {metric.target}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            metric.value >= metric.target
                              ? 'bg-green-500'
                              : metric.value >= metric.target * 0.9
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          } transition-all`}
                          style={{ width: `${Math.min(metric.value, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>Active and pending certifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div
                      key={cert.name}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        {cert.status === 'Active' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-white">{cert.name}</h3>
                          <p className="text-sm text-slate-400">Expires: {cert.expiry}</p>
                        </div>
                      </div>
                      <Badge
                        variant={cert.status === 'Active' ? 'success' : 'warning'}
                      >
                        {cert.status}
                      </Badge>
                    </div>
                  ))}
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
