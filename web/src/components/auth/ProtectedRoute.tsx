'use client';

import { ReactNode } from 'react';
import { useWallet, useRole } from '@/hooks';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui';
import { AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles: string[];
  contractName?: string;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  contractName = 'RoleManager',
  fallbackPath = '/dashboard',
}: ProtectedRouteProps) {
  const { isConnected, address } = useWallet();
  const router = useRouter();

  // Check each required role
  const roleChecks = requiredRoles.map((role) => ({
    role,
    ...useRole(contractName as any, role as any),
  }));

  // User has access if they have at least one of the required roles
  const hasAccess = roleChecks.some(({ hasRole }) => hasRole);
  const isLoading = roleChecks.some(({ isLoading }) => isLoading);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <CardTitle>Wallet Not Connected</CardTitle>
            </div>
            <CardDescription>
              Please connect your wallet to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-500 animate-pulse" />
              <div>
                <CardTitle>Verifying Permissions</CardTitle>
                <CardDescription>Checking your role access...</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-300 mb-2">
                <strong>Your Address:</strong>
              </p>
              <p className="text-xs font-mono text-slate-400 break-all">{address}</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-300 mb-2">
                <strong>Required Roles:</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {requiredRoles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-300">
                <strong>💡 Tip:</strong> Contact the system administrator to request role
                assignment, or switch to an account with the appropriate permissions.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href={fallbackPath} className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">Go to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}
