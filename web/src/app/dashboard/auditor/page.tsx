'use client';

import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddCarbonEmissionForm } from '@/components/forms/AddCarbonEmissionForm';
import { Shield, LeafyGreen, FileText, AlertTriangle } from 'lucide-react';

export default function AuditorDashboard() {
  const { address, isConnected } = useAccount();

  // Expected auditor address (account 6 from Anvil)
  const AUDITOR_ADDRESS = '0x976EA74026E726554dB657fA54763abd0C3a0aa9';
  const isAuditor = address?.toLowerCase() === AUDITOR_ADDRESS.toLowerCase();

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-amber-500/10 border-amber-500/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-500">Not Connected</p>
                <p className="text-sm text-amber-400 mt-1">
                  Please connect your wallet to access the Auditor Dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuditor) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-500">Access Denied</p>
                <p className="text-sm text-red-400 mt-1">
                  You must be connected with the Auditor account (0x976...aa9) to access this dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Auditor Dashboard</h1>
          <p className="text-slate-400">
            Carbon footprint tracking and compliance verification
          </p>
        </div>
        <Shield className="h-12 w-12 text-blue-500" />
      </div>

      {/* Role Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-500">
            <Shield className="h-5 w-5" />
            Auditor Role
          </CardTitle>
          <CardDescription>
            Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">
            As a Carbon Auditor, you have the authority to:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-400 list-disc list-inside">
            <li>Record carbon emissions for battery lifecycle phases</li>
            <li>Add supporting evidence and documentation</li>
            <li>Track emissions across the entire supply chain</li>
            <li>Ensure EU Battery Regulation compliance</li>
          </ul>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emissions Tracked</CardTitle>
            <LeafyGreen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-slate-400">kg CO₂e recorded</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batteries Audited</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-slate-400">unique batteries</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emission Records</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-slate-400">total records</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Add Carbon Emission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AddCarbonEmissionForm />
        </div>

        {/* Sidebar: Guidelines */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">EU Battery Regulation 2023/1542</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-400">
              <div>
                <p className="font-semibold text-slate-300 mb-1">Lifecycle Phases</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Raw Material Extraction (typically ~21%)</li>
                  <li>Manufacturing (typically ~61%)</li>
                  <li>Transportation (typically ~14%)</li>
                  <li>First Life Usage (typically ~4%)</li>
                  <li>Second Life Usage</li>
                  <li>Recycling</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-400">
              <p>✓ Always verify battery BIN before recording</p>
              <p>✓ Include IPFS hash for supporting evidence</p>
              <p>✓ Provide detailed descriptions</p>
              <p>✓ Record emissions as soon as data is available</p>
              <p>✓ Ensure accuracy - blockchain records are immutable</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/10 border-amber-500/50">
            <CardHeader>
              <CardTitle className="text-sm text-amber-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-amber-500/80">
              <p>
                All carbon emission records are permanently stored on the blockchain and cannot be
                deleted. Please ensure all data is accurate before submission.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
