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
  AlertTriangle,
  Gauge,
  Thermometer,
  Zap,
  Eye,
  Activity,
  Clock,
  Plus,
  Wrench,
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
import { BatteryCard } from '@/components/battery';
import { DashboardLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import {
  UpdateTelemetryForm,
  RecordCriticalEventForm,
  RecordMaintenanceForm
} from '@/components/forms';

export default function FleetOperatorDashboardPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { hasRole: isFleetOperator } = useRole('RoleManager', 'FLEET_OPERATOR_ROLE');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showTelemetryForm, setShowTelemetryForm] = useState(false);
  const [showCriticalEventForm, setShowCriticalEventForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  // Mock data for fleet batteries
  const fleetBatteries = [
    {
      bin: 'NV-2024-001234',
      manufacturer: 'Northvolt Ett',
      status: 'FirstLife' as const,
      soh: 92,
      soc: 78,
      carbonFootprint: 5600,
      manufactureDate: '2023-06-15',
      chemistry: 'NMC811',
      capacity: 75,
      currentOwner: '0x9965...A4dc',
      mileage: 45230,
      chargeCycles: 342,
      avgTemperature: 32,
      lastMaintenanceDate: '2024-11-15',
    },
    {
      bin: 'NV-2024-002345',
      manufacturer: 'Northvolt Zwei',
      status: 'FirstLife' as const,
      soh: 85,
      soc: 65,
      carbonFootprint: 5400,
      manufactureDate: '2023-08-22',
      chemistry: 'LFP',
      capacity: 60,
      currentOwner: '0x9965...A4dc',
      mileage: 67890,
      chargeCycles: 478,
      avgTemperature: 35,
      lastMaintenanceDate: '2024-12-01',
    },
    {
      bin: 'NV-2024-003456',
      manufacturer: 'Northvolt Ett',
      status: 'FirstLife' as const,
      soh: 88,
      soc: 82,
      carbonFootprint: 5700,
      manufactureDate: '2023-09-10',
      chemistry: 'NMC811',
      capacity: 75,
      currentOwner: '0x9965...A4dc',
      mileage: 52100,
      chargeCycles: 390,
      avgTemperature: 31,
      lastMaintenanceDate: '2024-11-28',
    },
  ];

  // Critical events
  const criticalEvents = [
    {
      bin: 'NV-2024-002345',
      eventType: 'Overheating',
      severity: 'High',
      date: '2024-12-10',
      description: 'Temperature exceeded 45°C during fast charging',
    },
    {
      bin: 'NV-2024-001234',
      eventType: 'Deep Discharge',
      severity: 'Medium',
      date: '2024-12-05',
      description: 'SOC dropped below 10%',
    },
    {
      bin: 'NV-2024-003456',
      eventType: 'Fast Charge',
      severity: 'Low',
      date: '2024-12-01',
      description: 'DC fast charging at 150kW',
    },
  ];

  // Maintenance history
  const maintenanceHistory = [
    {
      bin: 'NV-2024-002345',
      date: '2024-12-01',
      type: 'Preventive',
      description: 'BMS software update v2.3.1',
      technician: 'Tech-042',
    },
    {
      bin: 'NV-2024-003456',
      date: '2024-11-28',
      type: 'Inspection',
      description: 'Thermal management system check',
      technician: 'Tech-019',
    },
    {
      bin: 'NV-2024-001234',
      date: '2024-11-15',
      type: 'Preventive',
      description: 'Coolant replacement',
      technician: 'Tech-042',
    },
  ];

  const severityConfig = {
    Low: { variant: 'default' as const, color: 'text-blue-400' },
    Medium: { variant: 'warning' as const, color: 'text-yellow-400' },
    High: { variant: 'destructive' as const, color: 'text-red-400' },
  };

  const avgSOH = (
    fleetBatteries.reduce((sum, b) => sum + b.soh, 0) / fleetBatteries.length
  ).toFixed(1);

  const avgMileage = Math.round(
    fleetBatteries.reduce((sum, b) => sum + b.mileage, 0) / fleetBatteries.length
  );

  const totalCycles = fleetBatteries.reduce((sum, b) => sum + b.chargeCycles, 0);

  return (
    <ProtectedRoute requiredRoles={['FLEET_OPERATOR_ROLE', 'OEM_ROLE', 'ADMIN_ROLE']}>
      <DashboardLayout>
        <div className="px-4 md:px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-8 w-8 text-amber-500" />
                <h1 className="text-3xl font-bold text-white">Fleet Operator Dashboard</h1>
              </div>
              <p className="text-slate-400">First Life Usage & Telemetry Monitoring</p>
            </div>
            <Button
              className="mt-4 md:mt-0 bg-amber-600 hover:bg-amber-700"
              onClick={() => setShowTelemetryForm(!showTelemetryForm)}
            >
              <Activity className="h-4 w-4 mr-2" />
              {showTelemetryForm ? 'Hide Form' : 'Update Telemetry'}
            </Button>
          </div>

          {/* Telemetry Update Form */}
          {showTelemetryForm && (
            <div className="mb-8">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle>Update Battery Telemetry</CardTitle>
                  <CardDescription>
                    Record comprehensive usage data, SOH, SOC, and operational metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UpdateTelemetryForm
                    onSuccess={(bin) => {
                      console.log(`Telemetry updated for ${bin}`);
                      setShowTelemetryForm(false);
                    }}
                    onError={(error) => {
                      console.error('Telemetry update error:', error);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Fleet Size
                </CardTitle>
                <Car className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {fleetBatteries.length}
                </div>
                <p className="text-xs text-slate-500 mt-1">Active vehicles</p>
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
                <div className="text-2xl font-bold text-white">{avgSOH}%</div>
                <p className="text-xs text-slate-500 mt-1">Fleet battery health</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Total Mileage
                </CardTitle>
                <Gauge className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {avgMileage.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">Avg. km per vehicle</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Charge Cycles
                </CardTitle>
                <Zap className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {totalCycles}
                </div>
                <p className="text-xs text-slate-500 mt-1">Total fleet cycles</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="batteries">My Batteries</TabsTrigger>
              <TabsTrigger value="events">Critical Events</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Fleet Health Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle>Fleet Health Distribution</CardTitle>
                    <CardDescription>Batteries by SOH range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-800">
                        <span className="text-white">Excellent (90-100%)</span>
                        <span className="text-lg font-bold text-green-400">
                          {fleetBatteries.filter((b) => b.soh >= 90).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-800">
                        <span className="text-white">Good (80-89%)</span>
                        <span className="text-lg font-bold text-yellow-400">
                          {fleetBatteries.filter((b) => b.soh >= 80 && b.soh < 90).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-900/20 border border-red-800">
                        <span className="text-white">Degraded (&lt;80%)</span>
                        <span className="text-lg font-bold text-red-400">
                          {fleetBatteries.filter((b) => b.soh < 80).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle>Recent Critical Events</CardTitle>
                    <CardDescription>Last 3 events requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {criticalEvents.slice(0, 3).map((event, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50"
                        >
                          <AlertTriangle
                            className={`h-5 w-5 ${
                              severityConfig[event.severity as keyof typeof severityConfig].color
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{event.eventType}</span>
                              <Badge
                                variant={
                                  severityConfig[event.severity as keyof typeof severityConfig]
                                    .variant
                                }
                                className="text-xs"
                              >
                                {event.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400">{event.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              BIN: {event.bin} • {event.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="batteries" className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle>My Fleet Batteries</CardTitle>
                  <CardDescription>All batteries under operation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fleetBatteries.map((battery) => (
                      <div
                        key={battery.bin}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Battery className="h-5 w-5 text-amber-500" />
                              <span className="font-semibold text-white">{battery.bin}</span>
                              <Badge variant="outline">{battery.chemistry}</Badge>
                            </div>
                            <p className="text-sm text-slate-400">{battery.manufacturer}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/passport/${battery.bin}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Passport
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 text-slate-400 mb-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>SOH</span>
                            </div>
                            <span className="text-white font-semibold">{battery.soh}%</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-slate-400 mb-1">
                              <Battery className="h-3 w-3" />
                              <span>SOC</span>
                            </div>
                            <span className="text-white font-semibold">{battery.soc}%</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-slate-400 mb-1">
                              <Gauge className="h-3 w-3" />
                              <span>Mileage</span>
                            </div>
                            <span className="text-white font-semibold">
                              {battery.mileage.toLocaleString()} km
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-slate-400 mb-1">
                              <Zap className="h-3 w-3" />
                              <span>Cycles</span>
                            </div>
                            <span className="text-white font-semibold">{battery.chargeCycles}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Avg. Temp: </span>
                            <span className="text-white">{battery.avgTemperature}°C</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Last Maintenance: </span>
                            <span className="text-white">{battery.lastMaintenanceDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              {/* Record Critical Event Form */}
              {showCriticalEventForm && (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle>Record Critical Event</CardTitle>
                    <CardDescription>
                      Log a critical event or incident for a battery
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecordCriticalEventForm
                      onSuccess={(bin) => {
                        console.log(`Critical event recorded for ${bin}`);
                        setShowCriticalEventForm(false);
                      }}
                      onError={(error) => {
                        console.error('Critical event recording error:', error);
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Critical Events Log</CardTitle>
                      <CardDescription>Events requiring attention or monitoring</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCriticalEventForm(!showCriticalEventForm)}
                      className="bg-red-900/20 hover:bg-red-900/40 border-red-800 text-red-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {showCriticalEventForm ? 'Hide Form' : 'Record New Event'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {criticalEvents.map((event, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={`h-6 w-6 ${
                              severityConfig[event.severity as keyof typeof severityConfig].color
                            } mt-1`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-white text-lg">
                                {event.eventType}
                              </span>
                              <Badge
                                variant={
                                  severityConfig[event.severity as keyof typeof severityConfig]
                                    .variant
                                }
                              >
                                {event.severity}
                              </Badge>
                            </div>
                            <p className="text-slate-300 mb-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>BIN: {event.bin}</span>
                              <span>•</span>
                              <span>{event.date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              {/* Record Maintenance Form */}
              {showMaintenanceForm && (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle>Record Maintenance</CardTitle>
                    <CardDescription>
                      Log maintenance, service, or inspection work
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecordMaintenanceForm
                      onSuccess={(bin) => {
                        console.log(`Maintenance recorded for ${bin}`);
                        setShowMaintenanceForm(false);
                      }}
                      onError={(error) => {
                        console.error('Maintenance recording error:', error);
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Maintenance History</CardTitle>
                      <CardDescription>Service records and inspections</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                      className="bg-blue-900/20 hover:bg-blue-900/40 border-blue-800 text-blue-300"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      {showMaintenanceForm ? 'Hide Form' : 'Record Maintenance'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maintenanceHistory.map((record, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-blue-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-white">{record.type}</span>
                              <Badge variant="outline">{record.technician}</Badge>
                            </div>
                            <p className="text-slate-300 mb-2">{record.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>BIN: {record.bin}</span>
                              <span>•</span>
                              <span>{record.date}</span>
                            </div>
                          </div>
                        </div>
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
