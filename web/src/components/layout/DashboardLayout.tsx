'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet, useRole } from '@/hooks';
import { Bell, Battery } from 'lucide-react';
import { Button } from '@/components/ui';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { address, isConnected } = useWallet();

  // Get user roles from RoleManager
  const { hasRole: isAdmin } = useRole('RoleManager', 'ADMIN_ROLE');
  const { hasRole: isManufacturer } = useRole('RoleManager', 'COMPONENT_MANUFACTURER_ROLE');
  const { hasRole: isOEM } = useRole('RoleManager', 'OEM_ROLE');
  const { hasRole: isFleetOperator } = useRole('RoleManager', 'FLEET_OPERATOR_ROLE');
  const { hasRole: isAftermarketUser } = useRole('SecondLifeManager', 'AFTERMARKET_USER_ROLE');
  const { hasRole: isRecycler } = useRole('RoleManager', 'RECYCLER_ROLE');
  const { hasRole: isAuditor } = useRole('CarbonFootprint', 'AUDITOR_ROLE');

  // Debug logging
  if (process.env.NODE_ENV === 'development' && address) {
    console.log('🔍 Header Roles Debug:', {
      address: address?.slice(0, 10),
      isAuditor,
      isRecycler,
      isAdmin,
    });
  }

  // Build roles array - explicitly check === true to avoid undefined/null issues
  const userRoles: string[] = [];
  if (isAdmin === true) userRoles.push('ADMIN');
  if (isManufacturer === true) userRoles.push('MANUFACTURER');
  if (isOEM === true) userRoles.push('OEM');
  if (isFleetOperator === true) userRoles.push('FLEET_OPERATOR');
  if (isAftermarketUser === true) userRoles.push('AFTERMARKET');
  if (isRecycler === true) userRoles.push('RECYCLER');
  if (isAuditor === true) userRoles.push('AUDITOR');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Main Content - Full Width */}
      <div className="flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="px-4 lg:px-8 py-4">
            {/* Main Header Row - Logo Left | Roles+Alerts+Wallet Right */}
            <div className="flex items-center justify-between mb-4">
              {/* Logo - LEFT */}
              <Link href="/" className="flex items-center gap-3">
                <Battery className="h-10 w-10 text-green-500" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Battery CE</h1>
                  <p className="text-sm text-slate-400">Circular Economy</p>
                </div>
              </Link>

              {/* Actions - RIGHT: Roles, Notifications, Wallet */}
              <div className="flex items-center gap-3">
                {/* Active Roles */}
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  <span className="text-xs font-medium text-slate-400">Roles:</span>
                  <div className="flex gap-1.5">
                    {userRoles.length > 0 ? (
                      userRoles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                        >
                          {role.replace('_ROLE', '')}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">None</span>
                    )}
                  </div>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-white" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* Wallet */}
                <ConnectButton
                  accountStatus={{
                    smallScreen: 'avatar',
                    largeScreen: 'full',
                  }}
                  showBalance={{
                    smallScreen: false,
                    largeScreen: true,
                  }}
                />
              </div>
            </div>

            {/* Search Bar removed - Use "Scan Battery QR" button in dashboard page instead */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/50 px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-slate-400">
            <p>© 2025 Battery Circular Economy Platform</p>
            <p>Powered by Blockchain Fragar Technology</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
