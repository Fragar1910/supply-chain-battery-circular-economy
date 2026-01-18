'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Battery, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui';
import { useState } from 'react';

interface SidebarProps {
  userRoles?: string[]; // Roles del usuario actual
}

export function Sidebar({ userRoles = [] }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <Battery className="h-10 w-10 text-green-500" />
          <div>
            <h1 className="font-bold text-xl text-white">Battery CE</h1>
            <p className="text-sm text-slate-400">Circular Economy</p>
          </div>
        </Link>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Active Roles */}
      <div className="p-6 border-t border-slate-800">
        <div className="px-4 py-3 rounded-lg bg-slate-800/50">
          <p className="text-sm font-semibold text-white mb-2">Active Roles</p>
          <div className="flex flex-wrap gap-2">
            {userRoles.length > 0 ? (
              userRoles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                >
                  {role.replace('_ROLE', '')}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No roles assigned</span>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-slate-800 bg-slate-900 backdrop-blur-sm transform transition-transform duration-200 md:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
