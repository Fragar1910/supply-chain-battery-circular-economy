'use client';

import { useState } from 'react';
import { useWallet, useRole } from '@/hooks';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import {
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  PlusCircle,
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
import { DashboardLayout } from '@/components/layout';

export default function SupplierDashboardPage() {
  const { isConnected } = useWallet();
  // TODO: Add SUPPLIER_ROLE to contract - const { hasRole: isSupplier } = useRole('RoleManager', 'ADMIN_ROLE');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data for materials
  const materials = [
    {
      id: '1',
      name: 'Lithium Carbonate',
      quantity: 15000,
      unit: 'kg',
      origin: 'Chile',
      certifications: ['ISO 14001', 'Sustainable Mining'],
      carbonFootprint: 1200,
      status: 'Available',
    },
    {
      id: '2',
      name: 'Cobalt',
      quantity: 8000,
      unit: 'kg',
      origin: 'DRC - Certified',
      certifications: ['RMI', 'Fairtrade'],
      carbonFootprint: 800,
      status: 'Low Stock',
    },
    {
      id: '3',
      name: 'Nickel Sulfate',
      quantity: 12000,
      unit: 'kg',
      origin: 'Indonesia',
      certifications: ['ISO 14001'],
      carbonFootprint: 950,
      status: 'Available',
    },
    {
      id: '4',
      name: 'Graphite',
      quantity: 20000,
      unit: 'kg',
      origin: 'China',
      certifications: ['ISO 9001'],
      carbonFootprint: 600,
      status: 'Available',
    },
  ];

  const recentShipments = [
    {
      id: 'SH-2024-001',
      material: 'Lithium Carbonate',
      quantity: 5000,
      destination: 'Northvolt AB - Sweden',
      status: 'In Transit',
      date: '2024-12-01',
    },
    {
      id: 'SH-2024-002',
      material: 'Cobalt',
      quantity: 2000,
      destination: 'CATL - China',
      status: 'Delivered',
      date: '2024-11-28',
    },
    {
      id: 'SH-2024-003',
      material: 'Nickel Sulfate',
      quantity: 3500,
      destination: 'LG Energy Solution - Korea',
      status: 'Pending',
      date: '2024-12-05',
    },
  ];

  const carbonDataByMaterial = [
    { stage: 'Lithium', emissions: 1200, color: '#3b82f6' },
    { stage: 'Cobalt', emissions: 800, color: '#10b981' },
    { stage: 'Nickel', emissions: 950, color: '#8b5cf6' },
    { stage: 'Graphite', emissions: 600, color: '#f59e0b' },
  ];

  const statusConfig = {
    Available: { variant: 'success' as const, icon: CheckCircle },
    'Low Stock': { variant: 'warning' as const, icon: AlertCircle },
    'Out of Stock': { variant: 'destructive' as const, icon: AlertCircle },
  };

  const shipmentStatusConfig = {
    'In Transit': { variant: 'default' as const },
    Delivered: { variant: 'success' as const },
    Pending: { variant: 'warning' as const },
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet Required</CardTitle>
            <CardDescription>
              Please connect your wallet to access the Supplier Dashboard
            </CardDescription>
          </CardHeader>
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
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-white">Supplier Dashboard</h1>
            </div>
            <p className="text-slate-400">Raw Materials Supply Management</p>
          </div>
          <Button className="mt-4 md:mt-0">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Material
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Total Materials
              </CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{materials.length}</div>
              <p className="text-xs text-slate-500 mt-1">Active materials</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Total Stock
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {materials.reduce((sum, m) => sum + m.quantity, 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">kg available</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Active Shipments
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {recentShipments.filter((s) => s.status === 'In Transit').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">In transit</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Avg. Carbon Footprint
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {(
                  materials.reduce((sum, m) => sum + m.carbonFootprint, 0) /
                  materials.length
                ).toFixed(0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">kg CO₂ per ton</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="shipments">Shipments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Carbon Footprint by Material */}
            <CarbonFootprintChart
              data={carbonDataByMaterial}
              title="Carbon Footprint by Material"
              description="CO₂ emissions per ton of raw material"
            />

            {/* Materials Grid */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Material Inventory</CardTitle>
                <CardDescription>Current stock of raw materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {materials.map((material) => {
                    const config = statusConfig[material.status as keyof typeof statusConfig];
                    const StatusIcon = config.icon;
                    return (
                      <div
                        key={material.id}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white mb-1">
                              {material.name}
                            </h3>
                            <p className="text-sm text-slate-400">{material.origin}</p>
                          </div>
                          <Badge variant={config.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {material.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stock</span>
                            <span className="font-medium text-white">
                              {material.quantity.toLocaleString()} {material.unit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Carbon Footprint</span>
                            <span className="font-medium text-white">
                              {material.carbonFootprint} kg CO₂/ton
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {material.certifications.map((cert) => (
                              <span
                                key={cert}
                                className="px-2 py-0.5 text-xs rounded bg-green-500/10 text-green-400 border border-green-500/20"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>All Materials</CardTitle>
                <CardDescription>Manage your raw materials inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materials.map((material) => {
                    const config = statusConfig[material.status as keyof typeof statusConfig];
                    const StatusIcon = config.icon;
                    return (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="h-5 w-5 text-blue-500" />
                            <h3 className="font-semibold text-white">{material.name}</h3>
                            <Badge variant={config.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {material.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Origin: </span>
                              <span className="text-white">{material.origin}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Stock: </span>
                              <span className="text-white">
                                {material.quantity.toLocaleString()} {material.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Carbon: </span>
                              <span className="text-white">
                                {material.carbonFootprint} kg CO₂/ton
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Certs: </span>
                              <span className="text-white">
                                {material.certifications.length}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Recent Shipments</CardTitle>
                <CardDescription>Track your material shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-slate-400">
                            {shipment.id}
                          </span>
                          <Badge variant={shipmentStatusConfig[shipment.status as keyof typeof shipmentStatusConfig].variant}>
                            {shipment.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-white mb-1">
                          {shipment.material}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Quantity: </span>
                            <span className="text-white">
                              {shipment.quantity.toLocaleString()} kg
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Destination: </span>
                            <span className="text-white">{shipment.destination}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Date: </span>
                            <span className="text-white">{shipment.date}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Track
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
