'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useRole, useAvailableSecondLifeBatteries, useSecondLifeBatteries, useAvailableBattery } from '@/hooks';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import {
  Zap,
  Battery,
  TrendingUp,
  Leaf,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Eye,
  Home,
  Building,
  Sun,
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
import { ProtectedRoute } from '@/components/auth';
import { StartSecondLifeForm } from '@/components/forms';

export default function AftermarketUserDashboardPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { hasRole: isAftermarketUser } = useRole('SecondLifeManager', 'AFTERMARKET_USER_ROLE');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showStartSecondLifeForm, setShowStartSecondLifeForm] = useState(false);

  // Fetch available and active second life batteries from blockchain
  const { batteries: availableBatteriesRaw, isLoading: loadingAvailable } = useAvailableSecondLifeBatteries();
  const { batteries: secondLifeBatteriesRaw, isLoading: loadingSecondLife } = useSecondLifeBatteries();

  // Use real data from blockchain or fallback to mock if not connected
  // TODO: Enhance with full battery details from blockchain
  const availableBatteries = isConnected && !loadingAvailable && availableBatteriesRaw.length > 0
    ? availableBatteriesRaw.map(b => ({
        bin: b.bin,
        manufacturer: 'Loading...', // Will be loaded individually
        status: 'Active' as const,
        soh: 75, // Placeholder - fetch from blockchain
        capacity: 75,
        carbonFootprint: 5000,
        chemistry: 'NMC811',
        cycles: 2500,
        manufactureDate: '2022-01-01',
        availableCapacity: 56.25,
      }))
    : [ // Fallback mock data
    {
      bin: 'NV-2022-000145',
      manufacturer: 'Northvolt AB',
      status: 'Active' as const,
      soh: 78,
      capacity: 75,
      carbonFootprint: 5200,
      chemistry: 'NMC811',
      cycles: 2800,
      manufactureDate: '2022-05-10',
      availableCapacity: 58.5, // 75 * 0.78
    },
    {
      bin: 'NV-2022-000146',
      manufacturer: 'CATL',
      status: 'Active' as const,
      soh: 72,
      capacity: 80,
      carbonFootprint: 5400,
      chemistry: 'LFP',
      cycles: 3200,
      manufactureDate: '2022-06-15',
      availableCapacity: 57.6,
    },
    {
      bin: 'NV-2023-000201',
      manufacturer: 'Northvolt AB',
      status: 'Active' as const,
      soh: 75,
      capacity: 60,
      carbonFootprint: 4800,
      chemistry: 'NMC622',
      cycles: 2500,
      manufactureDate: '2023-01-20',
      availableCapacity: 45.0,
    },
  ];

  // Mock data for batteries currently in second life
  const secondLifeBatteriesMock = [
    {
      bin: 'NV-2021-000089',
      applicationType: 'Residential Storage',
      applicationDescription: 'Solar home storage system with 10kW inverter',
      soh: 74,
      originalCapacity: 75,
      availableCapacity: 55.5,
      ownerOperator: 'John Smith Residence',
      location: 'Barcelona, Spain',
      startDate: '2024-03-15',
      energyStored: 12500, // kWh accumulated
      co2Avoided: 4.2, // tCO2e
      cyclesInSecondLife: 420,
      degradationRate: 0.8, // % per year
    },
    {
      bin: 'NV-2021-000091',
      applicationType: 'Commercial/Industrial',
      applicationDescription: 'Peak shaving for manufacturing facility',
      soh: 71,
      originalCapacity: 80,
      availableCapacity: 56.8,
      ownerOperator: 'GreenTech Manufacturing Inc',
      location: 'Madrid, Spain',
      startDate: '2024-06-01',
      energyStored: 8900,
      co2Avoided: 3.1,
      cyclesInSecondLife: 280,
      degradationRate: 0.7,
    },
    {
      bin: 'NV-2022-000112',
      applicationType: 'Renewable Integration',
      applicationDescription: 'Wind farm energy storage',
      soh: 76,
      originalCapacity: 100,
      availableCapacity: 76.0,
      ownerOperator: 'Iberdrola Renewables',
      location: 'Valencia, Spain',
      startDate: '2024-08-20',
      energyStored: 15200,
      co2Avoided: 5.8,
      cyclesInSecondLife: 180,
      degradationRate: 0.6,
    },
  ];

  // Use real data from blockchain or fallback to mock
  const secondLifeBatteries = isConnected && !loadingSecondLife && secondLifeBatteriesRaw.length > 0
    ? secondLifeBatteriesRaw.map(b => ({
        bin: b.bin,
        applicationType: 'Residential Storage',
        applicationDescription: 'Solar home storage system',
        soh: 74,
        originalCapacity: 75,
        availableCapacity: 55.5,
        ownerOperator: 'Loading...',
        location: 'Loading...',
        startDate: '2024-03-15',
        energyStored: 12500,
        co2Avoided: 4.2,
        cyclesInSecondLife: 420,
        degradationRate: 0.8,
      }))
    : secondLifeBatteriesMock;

  // Application type distribution
  const applicationDistribution = [
    { type: 'Residential Storage', count: 12, totalCapacity: 850, icon: '🏠' },
    { type: 'Commercial/Industrial', count: 8, totalCapacity: 680, icon: '🏢' },
    { type: 'Renewable Integration', count: 5, totalCapacity: 520, icon: '☀️' },
    { type: 'Microgrids', count: 3, totalCapacity: 240, icon: '⚡' },
    { type: 'EV Charging Stations', count: 4, totalCapacity: 320, icon: '🔌' },
    { type: 'Light Machinery', count: 2, totalCapacity: 140, icon: '🚜' },
    { type: 'Telecommunications', count: 1, totalCapacity: 80, icon: '📡' },
  ];

  // Calculate KPIs
  const totalSecondLifeBatteries = secondLifeBatteries.length;
  const avgSecondLifeSOH = (
    secondLifeBatteries.reduce((sum, b) => sum + b.soh, 0) / secondLifeBatteries.length
  ).toFixed(1);
  const totalEnergyStored = secondLifeBatteries.reduce((sum, b) => sum + b.energyStored, 0);
  const totalCO2Avoided = secondLifeBatteries.reduce((sum, b) => sum + b.co2Avoided, 0);

  // Performance data for chart
  const performanceData = [
    { stage: 'Jan 2024', emissions: 2400, color: '#3b82f6' },
    { stage: 'Feb 2024', emissions: 3100, color: '#10b981' },
    { stage: 'Mar 2024', emissions: 4200, color: '#8b5cf6' },
    { stage: 'Apr 2024', emissions: 5800, color: '#f59e0b' },
    { stage: 'May 2024', emissions: 7200, color: '#ef4444' },
    { stage: 'Jun 2024', emissions: 8900, color: '#6366f1' },
    { stage: 'Jul 2024', emissions: 10500, color: '#ec4899' },
    { stage: 'Aug 2024', emissions: 12100, color: '#14b8a6' },
    { stage: 'Sep 2024', emissions: 14800, color: '#f97316' },
    { stage: 'Oct 2024', emissions: 17200, color: '#a855f7' },
    { stage: 'Nov 2024', emissions: 20500, color: '#22c55e' },
    { stage: 'Dec 2024', emissions: 23800, color: '#06b6d4' },
  ];

  return (
    <ProtectedRoute
      requiredRoles={['AFTERMARKET_USER_ROLE', 'ADMIN_ROLE']}
      contractName="SecondLifeManager"
    >
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              Aftermarket User Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Manage second life applications for batteries (SOH: 70-80%)
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Batteries in Second Life
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-400">{totalSecondLifeBatteries}</span>
                  <span className="text-xs text-blue-400/60">active</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  +{availableBatteries.length} available for deployment
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Average Second Life SOH
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-400">{avgSecondLifeSOH}%</span>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Target range: 70-80%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Total Energy Stored
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-400">
                    {(totalEnergyStored / 1000).toFixed(1)}
                  </span>
                  <span className="text-xs text-purple-400/60">MWh</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Accumulated since deployment
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">
                  CO₂ Emissions Avoided
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-400">
                    {totalCO2Avoided.toFixed(1)}
                  </span>
                  <span className="text-xs text-emerald-400/60">tCO₂e</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Environmental impact savings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList className="bg-slate-900/50 border border-slate-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="available">Available Batteries</TabsTrigger>
              <TabsTrigger value="second-life">Second Life Batteries</TabsTrigger>
              <TabsTrigger value="performance">Performance Tracking</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Start Second Life Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Second Life Overview</h2>
                  <p className="text-sm text-slate-400">
                    Monitor and manage battery second life applications
                  </p>
                </div>
                <Button
                  onClick={() => setShowStartSecondLifeForm(!showStartSecondLifeForm)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {showStartSecondLifeForm ? 'Hidden Form' : 'Start Second Life'}
                </Button>
              </div>

              {/* Form */}
              {showStartSecondLifeForm && (
                <StartSecondLifeForm
                  onSuccess={(bin) => {
                    setShowStartSecondLifeForm(false);
                    router.refresh();
                  }}
                  onError={(error) => {
                    console.error('Failed to start second life:', error);
                  }}
                />
              )}

              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Energy Storage Trend</CardTitle>
                    <CardDescription>Cumulative energy stored over time (kWh)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CarbonFootprintChart
                      data={performanceData}
                      title="Energy Storage Trend"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Application Distribution</CardTitle>
                    <CardDescription>Batteries by application type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {applicationDistribution.map((app) => (
                        <div key={app.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{app.icon}</span>
                            <span className="text-sm text-slate-300">{app.type}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-xs">
                              {app.count} units
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {app.totalCapacity} kWh
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Second Life Deployments */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Second Life Deployments</CardTitle>
                  <CardDescription>Latest batteries deployed for second life applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {secondLifeBatteries.map((battery) => (
                      <div
                        key={battery.bin}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Battery className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-200">{battery.bin}</p>
                            <p className="text-xs text-slate-400">{battery.applicationType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">SOH</p>
                            <p className="text-sm font-semibold text-green-400">{battery.soh}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Capacity</p>
                            <p className="text-sm font-semibold text-blue-400">
                              {battery.availableCapacity.toFixed(1)} kWh
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/passport/${battery.bin}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Available Batteries Tab */}
            <TabsContent value="available" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Available Batteries for Second Life
                  </h2>
                  <p className="text-sm text-slate-400">
                    Batteries with SOH 70-80% suitable for repurposing
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {availableBatteries.length} batteries available
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableBatteries.map((battery) => (
                  <Card
                    key={battery.bin}
                    className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{battery.bin}</CardTitle>
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-400 border-green-500/30"
                        >
                          SOH {battery.soh}%
                        </Badge>
                      </div>
                      <CardDescription>{battery.manufacturer}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs">Chemistry</p>
                          <p className="text-slate-200 font-medium">{battery.chemistry}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Available Cap.</p>
                          <p className="text-blue-400 font-semibold">
                            {battery.availableCapacity.toFixed(1)} kWh
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Cycles</p>
                          <p className="text-slate-200">{battery.cycles.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Manufactured</p>
                          <p className="text-slate-200">{battery.manufactureDate}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setShowStartSecondLifeForm(true);
                            setSelectedTab('overview');
                          }}
                        >
                          <Zap className="mr-1 h-3 w-3" />
                          Start Second Life
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/passport/${battery.bin}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Second Life Batteries Tab */}
            <TabsContent value="second-life" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Active Second Life Batteries
                </h2>
                <p className="text-sm text-slate-400">
                  Currently deployed batteries in second life applications
                </p>
              </div>

              <div className="space-y-4">
                {secondLifeBatteries.map((battery) => (
                  <Card
                    key={battery.bin}
                    className="bg-slate-900/50 border-slate-800"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{battery.bin}</CardTitle>
                          <CardDescription>{battery.applicationType}</CardDescription>
                        </div>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-400">Current SOH</p>
                          <p className="text-lg font-semibold text-green-400">{battery.soh}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Available Capacity</p>
                          <p className="text-lg font-semibold text-blue-400">
                            {battery.availableCapacity.toFixed(1)} kWh
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Energy Stored</p>
                          <p className="text-lg font-semibold text-purple-400">
                            {battery.energyStored.toLocaleString()} kWh
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">CO₂ Avoided</p>
                          <p className="text-lg font-semibold text-emerald-400">
                            {battery.co2Avoided.toFixed(1)} tCO₂e
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-300 mb-2">
                          Application Details
                        </p>
                        <p className="text-sm text-slate-400 mb-2">
                          {battery.applicationDescription}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Owner:</span>{' '}
                            <span className="text-slate-300">{battery.ownerOperator}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Location:</span>{' '}
                            <span className="text-slate-300">{battery.location}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Start Date:</span>{' '}
                            <span className="text-slate-300">{battery.startDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Cycles:</span>{' '}
                            <span className="text-slate-300">{battery.cyclesInSecondLife}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/passport/${battery.bin}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Passport
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Performance Tracking Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Performance Tracking</h2>
                <p className="text-sm text-slate-400">
                  Monitor degradation, efficiency, and environmental impact
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle>SOH Degradation Over Time</CardTitle>
                    <CardDescription>Average SOH degradation rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {secondLifeBatteries.map((battery) => (
                        <div key={battery.bin} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">{battery.bin}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${battery.soh}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-green-400 w-12">
                              {battery.soh}%
                            </span>
                            <span className="text-xs text-slate-500">
                              -{battery.degradationRate}%/yr
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle>Environmental Impact</CardTitle>
                    <CardDescription>CO₂ emissions avoided by second life use</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Leaf className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-semibold text-emerald-400">
                            Total Impact
                          </span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400">
                          {totalCO2Avoided.toFixed(1)} tCO₂e
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Equivalent to {(totalCO2Avoided * 45).toFixed(0)} trees planted
                        </p>
                      </div>

                      <div className="space-y-2">
                        {secondLifeBatteries.map((battery) => (
                          <div
                            key={battery.bin}
                            className="flex items-center justify-between p-2 bg-slate-800/30 rounded"
                          >
                            <span className="text-xs text-slate-400">{battery.bin}</span>
                            <span className="text-sm font-semibold text-emerald-400">
                              {battery.co2Avoided.toFixed(1)} tCO₂e
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Application Types</h2>
                <p className="text-sm text-slate-400">
                  Distribution of batteries by second life application
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {applicationDistribution.map((app) => (
                  <Card
                    key={app.type}
                    className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{app.icon}</span>
                        <CardTitle className="text-base">{app.type}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-blue-400">{app.count}</span>
                          <span className="text-xs text-slate-400">batteries</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-semibold text-purple-400">
                            {app.totalCapacity}
                          </span>
                          <span className="text-xs text-slate-400">kWh total</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Avg: {(app.totalCapacity / app.count).toFixed(1)} kWh/battery
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
