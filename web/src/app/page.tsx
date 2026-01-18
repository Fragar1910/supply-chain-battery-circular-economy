'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { Battery, Shield, Leaf, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function Home() {
  const { isConnected } = useWallet();

  // Read total batteries registered
  const { data: totalBatteries } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'totalBatteriesRegistered',
    query: {
      enabled: isConnected,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Battery className="h-8 w-8 text-green-500" />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Battery Circular Economy
                </h1>
                <p className="text-xs text-slate-400">
                  EU Battery Passport Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isConnected && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
              )}
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-800/[0.05] bg-[size:32px_32px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-400">
                EU Regulation Compliant • Battery Passport 2027
              </span>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
              Traceable. Sustainable.
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                Future-Ready Batteries
              </span>
            </h2>

            <p className="max-w-2xl mx-auto text-xl text-slate-400">
              Complete lifecycle traceability for electric vehicle batteries powered by blockchain technology.
              From raw materials to recycling, every step is transparent and verified.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isConnected ? (
                <ConnectButton />
              ) : (
                <>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/passport/NV-2024-001234">
                    <Button size="lg" variant="outline" className="gap-2">
                      View Sample Passport
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12">
              <div className="text-center">
                <p className="text-4xl font-bold text-white">
                  {totalBatteries?.toString() || '0'}
                </p>
                <p className="text-sm text-slate-400 mt-2">Batteries Tracked</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white">100%</p>
                <p className="text-sm text-slate-400 mt-2">Transparency</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white">2027</p>
                <p className="text-sm text-slate-400 mt-2">EU Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-white mb-4">
            Complete Supply Chain Visibility
          </h3>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Blockchain-powered traceability ensures authenticity, sustainability, and compliance
            throughout the entire battery lifecycle
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-all">
            <CardContent className="pt-6">
              <Globe className="h-12 w-12 text-blue-500 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Full Traceability
              </h4>
              <p className="text-sm text-slate-400">
                Track every battery from raw material extraction to end-of-life recycling
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-all">
            <CardContent className="pt-6">
              <Leaf className="h-12 w-12 text-green-500 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Carbon Footprint
              </h4>
              <p className="text-sm text-slate-400">
                Measure and verify CO₂ emissions at each stage of the supply chain
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-all">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-purple-500 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                EU Compliant
              </h4>
              <p className="text-sm text-slate-400">
                Meets all EU Battery Passport requirements for 2027 regulation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-all">
            <CardContent className="pt-6">
              <Battery className="h-12 w-12 text-yellow-500 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Circular Economy
              </h4>
              <p className="text-sm text-slate-400">
                Enable second-life applications and efficient material recovery
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Supply Chain Actors */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-white mb-4">
            Multi-Stakeholder Platform
          </h3>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Every actor in the battery supply chain has a role in creating transparency
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { icon: '⛏️', role: 'Suppliers', desc: 'Raw materials' },
            { icon: '🏭', role: 'Manufacturers', desc: 'Battery production' },
            { icon: '🚗', role: 'OEMs', desc: 'Vehicle integration' },
            { icon: '🚕', role: 'Fleet Operators', desc: 'Vehicle fleet management' },
            { icon: '🔋', role: 'Aftermarket Users', desc: 'Vehicle aftermarket services' },
            { icon: '♻️', role: 'Recyclers', desc: 'Material recovery' },
          ].map((actor) => (
            <div
              key={actor.role}
              className="p-6 rounded-lg bg-slate-700/50 border border-slate-600 text-center hover:border-green-500/50 transition-all"
            >
              <div className="text-4xl mb-3">{actor.icon}</div>
              <h4 className="font-semibold text-white mb-1">{actor.role}</h4>
              <p className="text-sm text-slate-300">{actor.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/20">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Connect your wallet to access the platform and start tracking batteries across their entire lifecycle
            </p>
            {!isConnected ? (
              <ConnectButton />
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Battery className="h-5 w-5 text-green-500" />
              <p className="text-sm text-slate-400">
                Battery Circular Economy Platform © 2025
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Powered by Blockchain Fragar Technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
