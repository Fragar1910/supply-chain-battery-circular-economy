'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { useToast } from '@/hooks';
import { binToBytes32 } from '@/lib/binUtils';
import { AlertCircle, CheckCircle2, Loader2, Zap, Battery, ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Textarea,
} from '@/components/ui';

// Application Types enum mapping (must match SecondLifeManager.sol - ApplicationType enum)
// Based on README_PFM.md specifications
const APPLICATION_TYPES = [
  { value: '1', label: 'Residential Storage', description: 'Solar home storage systems' },
  { value: '2', label: 'Grid Stabilization', description: 'Commercial/industrial peak shaving and backup' },
  { value: '3', label: 'Renewable Storage', description: 'Solar and wind integration' },
  { value: '4', label: 'Backup Power', description: 'Microgrids and energy communities' },
  { value: '5', label: 'Light EV', description: 'EV charging stations intermediate storage' },
  { value: '6', label: 'Commercial Storage', description: 'Light machinery (forklifts, AGVs)' },
  { value: '7', label: 'Other', description: 'Telecommunications and other applications' },
];

export function StartSecondLifeForm() {
  const toast = useToast();

  // Form state
  const [bin, setBin] = useState('');
  const [applicationType, setApplicationType] = useState('1'); // Default to Residential Storage
  const [installationHash, setInstallationHash] = useState('');

  // Additional fields for UI/UX (not sent to contract)
  const [applicationDescription, setApplicationDescription] = useState('');
  const [installationLocation, setInstallationLocation] = useState('');
  const [ownerOperator, setOwnerOperator] = useState('');
  const [notes, setNotes] = useState('');

  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);

  // Read battery data when BIN changes
  const { data: battery, isLoading: isLoadingBattery } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: bin ? [binToBytes32(bin)] : undefined,
    query: {
      enabled: !!bin && bin.length > 5,
    },
  });

  const { writeContract, data: hash, error: writeError, isPending: isWriting, reset } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Toast for pending transaction
  useEffect(() => {
    if (isWriting && !toastId) {
      const id = toast.transactionPending('Starting second life...');
      setToastId(id);
    }
  }, [isWriting, toastId]); // toast removed - stable function

  // Toast for confirming transaction
  useEffect(() => {
    if (isConfirming && !confirmingToastShown.current) {
      if (toastId) toast.dismiss(toastId);
      const id = toast.loading('Confirming transaction...', {
        description: 'Waiting for blockchain confirmation',
      });
      setToastId(id);
      confirmingToastShown.current = true;
    } else if (!isConfirming) {
      confirmingToastShown.current = false;
    }
  }, [isConfirming]); // Only isConfirming in dependencies

  // Toast for confirmed transaction
  useEffect(() => {
    if (isConfirmed && toastId) {
      toast.dismiss(toastId);
      const appType = APPLICATION_TYPES.find(t => t.value === applicationType);
      toast.transactionSuccess('Second life started successfully!', {
        description: `Battery ${bin} repurposed for ${appType?.label}`,
      });
      setToastId(undefined);
      confirmingToastShown.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, toastId, bin, applicationType]); // toast removed - stable function

  // Toast for write error
  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);

      let errorMsg = writeError.message;

      if (writeError.message.includes('User rejected')) {
        errorMsg = 'Transaction rejected by user';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction';
      } else if (writeError.message.includes('Not authorized')) {
        errorMsg = 'Not authorized. Only AFTERMARKET_USER_ROLE or ADMIN_ROLE can start second life.';
      } else if (writeError.message.includes('SOH too low')) {
        errorMsg = 'Battery SOH too low for second life (minimum 70%)';
      } else if (writeError.message.includes('SOH too high')) {
        errorMsg = 'Battery SOH too high, still suitable for first life (maximum 80%)';
      } else if (writeError.message.includes('Already in second life')) {
        errorMsg = 'Battery is already in second life';
      } else if (writeError.message.includes('Battery does not exist')) {
        errorMsg = 'Battery not found. Please verify the BIN.';
      }

      toast.transactionError('Failed to start second life', {
        description: errorMsg,
      });
      setToastId(undefined);
      confirmingToastShown.current = false;
      reset(); // Reset the write contract state
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, toastId]); // toast, reset removed - stable functions

  // Handle confirmation errors
  useEffect(() => {
    if (confirmError && toastId) {
      toast.dismiss(toastId);

      let errorMsg = confirmError.message;

      if (confirmError.message.includes('reverted')) {
        errorMsg = 'Transaction reverted. Battery SOH may be outside 70-80% range or you may not be authorized.';
      } else if (confirmError.message.includes('Not authorized')) {
        errorMsg = 'Not authorized. Only AFTERMARKET_USER_ROLE or ADMIN_ROLE can start second life.';
      } else if (confirmError.message.includes('SOH')) {
        errorMsg = 'Battery SOH must be between 70% and 80% for second life';
      }

      toast.transactionError('Transaction confirmation failed', {
        description: errorMsg,
      });
      setToastId(undefined);
      confirmingToastShown.current = false;
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmError, toastId]); // toast, reset removed - stable functions

  // Timeout safety net: clear toast if transaction takes too long (30 seconds)
  useEffect(() => {
    if (isConfirming) {
      const timeoutId = setTimeout(() => {
        toast.dismiss(toastId);
        toast.transactionError('Transaction timeout', {
          description: 'Transaction is taking too long. Please check your wallet or try again.',
        });
        setToastId(undefined);
        confirmingToastShown.current = false;
        reset();
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirming]); // toast, reset removed - stable functions

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bin || !applicationType) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate BIN format
    if (!/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(bin)) {
      alert('Invalid BIN format. Expected format: XX-YYYY-NNNN (e.g., NV-2024-001234)');
      return;
    }

    // Validate battery exists and SOH
    if (battery) {
      const sohCurrent = Number(battery.sohCurrent); // SOH in basis points
      const sohPercentage = sohCurrent / 100;

      if (sohPercentage < 70) {
        alert(`Battery SOH is ${sohPercentage}% - too low for second life (minimum 70%)`);
        return;
      }
      if (sohPercentage > 80) {
        alert(`Battery SOH is ${sohPercentage}% - too high for second life (maximum 80%)`);
        return;
      }
    }

    try {
      const binBytes32 = binToBytes32(bin);
      const appTypeNumber = Number(applicationType);

      // Handle installation hash - convert to bytes32 or use zero bytes
      let installHashBytes32: `0x${string}`;
      if (installationHash && installationHash.trim().length > 0) {
        if (installationHash.startsWith('Qm')) {
          // IPFS CID - convert to bytes32
          const encoder = new TextEncoder();
          const bytes = encoder.encode(installationHash.slice(0, 32));
          const hexString = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .padEnd(64, '0');
          installHashBytes32 = ('0x' + hexString) as `0x${string}`;
        } else if (installationHash.startsWith('0x')) {
          const hexOnly = installationHash.slice(2);
          installHashBytes32 = ('0x' + hexOnly.padEnd(64, '0').slice(0, 64)) as `0x${string}`;
        } else {
          const encoder = new TextEncoder();
          const bytes = encoder.encode(installationHash.slice(0, 32));
          const hexString = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .padEnd(64, '0');
          installHashBytes32 = ('0x' + hexString) as `0x${string}`;
        }
      } else {
        installHashBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
      }

      // Call startSecondLife with exactly 3 parameters: (bytes32 bin, ApplicationType applicationType, bytes32 installationHash)
      writeContract({
        address: CONTRACTS.SecondLifeManager.address as `0x${string}`,
        abi: CONTRACTS.SecondLifeManager.abi,
        functionName: 'startSecondLife',
        args: [binBytes32, appTypeNumber, installHashBytes32],
      });
    } catch (error) {
      console.error('Error starting second life:', error);
      toast.transactionError('Failed to prepare transaction', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const resetForm = () => {
    setBin('');
    setApplicationType('1');
    setInstallationHash('');
    setApplicationDescription('');
    setInstallationLocation('');
    setOwnerOperator('');
    setNotes('');
    reset();
  };

  // Calculate available capacity based on SOH
  const getAvailableCapacity = () => {
    if (!battery) return 0;
    const capacityKwh = Number(battery.capacityKwh);
    const sohCurrent = Number(battery.sohCurrent); // SOH in basis points
    return Math.round((capacityKwh * sohCurrent) / 10000);
  };

  const getSOHPercentage = () => {
    if (!battery) return 0;
    const sohCurrent = Number(battery.sohCurrent);
    return (sohCurrent / 100).toFixed(2);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <CardTitle>Start Second Life</CardTitle>
        </div>
        <CardDescription>
          Repurpose battery for aftermarket applications (SOH: 70-80%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* BIN Input */}
          <div className="space-y-2">
            <Label htmlFor="bin">Battery Identification Number (BIN) *</Label>
            <Input
              id="bin"
              placeholder="NV-2024-001234"
              value={bin}
              onChange={(e) => setBin(e.target.value.toUpperCase())}
              required
              className="bg-slate-800/50 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              Enter the unique battery identifier
            </p>

            {/* Show battery info if found */}
            {battery && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Battery Information:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">SOH:</span>{' '}
                    <Badge variant={Number(battery.sohCurrent) >= 7000 && Number(battery.sohCurrent) <= 8000 ? 'default' : 'destructive'}>
                      {getSOHPercentage()}%
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400">Available Capacity:</span>{' '}
                    <span className="text-green-400 font-semibold">{getAvailableCapacity()} kWh</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Original Capacity:</span>{' '}
                    <span className="text-slate-200">{Number(battery.capacityKwh)} kWh</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Cycles:</span>{' '}
                    <span className="text-slate-200">{Number(battery.cyclesCompleted)}</span>
                  </div>
                </div>
              </div>
            )}
            {isLoadingBattery && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading battery data...
              </p>
            )}
          </div>

          {/* Application Type */}
          <div className="space-y-2">
            <Label htmlFor="applicationType">Application Type *</Label>
            <Select value={applicationType} onValueChange={setApplicationType}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Select application type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {APPLICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-slate-400">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              Select the intended use for this battery's second life
            </p>
          </div>

          {/* Application Description (UI only) */}
          <div className="space-y-2">
            <Label htmlFor="applicationDescription">Application Description</Label>
            <Textarea
              id="applicationDescription"
              placeholder="Describe the specific application (e.g., Home solar storage system with 10kW inverter)"
              value={applicationDescription}
              onChange={(e) => setApplicationDescription(e.target.value)}
              rows={2}
              className="bg-slate-800/50 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              Additional details about the application
            </p>
          </div>

          {/* Installation Location (UI only) */}
          <div className="space-y-2">
            <Label htmlFor="installationLocation">Installation Location</Label>
            <Input
              id="installationLocation"
              placeholder="123 Main St, Barcelona, Spain"
              value={installationLocation}
              onChange={(e) => setInstallationLocation(e.target.value)}
              className="bg-slate-800/50 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              Physical location where battery will be installed
            </p>
          </div>

          {/* Owner/Operator (UI only) */}
          <div className="space-y-2">
            <Label htmlFor="ownerOperator">Owner/Operator</Label>
            <Input
              id="ownerOperator"
              placeholder="Home owner, company name, or utility provider"
              value={ownerOperator}
              onChange={(e) => setOwnerOperator(e.target.value)}
              className="bg-slate-800/50 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              Person or organization operating the battery
            </p>
          </div>

          {/* Installation Hash (IPFS) */}
          <div className="space-y-2">
            <Label htmlFor="installationHash">Installation Document Hash (IPFS)</Label>
            <Input
              id="installationHash"
              placeholder="Qm... or 0x..."
              value={installationHash}
              onChange={(e) => setInstallationHash(e.target.value)}
              className="bg-slate-800/50 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              IPFS hash of installation documentation and safety certificates
            </p>
          </div>

          {/* Notes (UI only) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional information about the second life application..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="bg-slate-800/50 border-slate-700"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Battery className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-400">Second Life Battery Requirements</p>
                <ul className="mt-2 space-y-1 text-blue-300 text-xs">
                  <li>• SOH must be between 70% and 80%</li>
                  <li>• Battery must be decommissioned from first life</li>
                  <li>• Safety inspection and certification recommended</li>
                  <li>• AFTERMARKET_USER_ROLE or ADMIN_ROLE required</li>
                  <li>• Ownership will transfer to the operator</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {writeError && (
            <Card className="bg-red-500/10 border-red-500/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-500">Error</p>
                    <p className="text-sm text-red-400 mt-1">
                      {writeError.message.includes('Not authorized')
                        ? 'Not authorized. Only AFTERMARKET_USER_ROLE or ADMIN_ROLE can start second life.'
                        : writeError.message.includes('SOH too low')
                        ? 'Battery SOH too low for second life (minimum 70%)'
                        : writeError.message.includes('SOH too high')
                        ? 'Battery SOH too high, still suitable for first life (maximum 80%)'
                        : writeError.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Display */}
          {isConfirmed && hash && (
            <Card className="bg-green-500/10 border-green-500/50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-green-500">Success!</p>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Second Life Started
                        </Badge>
                      </div>
                      <p className="text-sm text-green-400 mt-1">
                        Battery {bin} repurposed for {APPLICATION_TYPES.find(t => t.value === applicationType)?.label}
                      </p>
                      <p className="text-sm text-green-400 mt-1">
                        Available capacity: {battery ? getAvailableCapacity() : 0} kWh
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
                      </p>
                    </div>
                  </div>

                  {/* View Passport Button */}
                  <Link href={`/passport/${bin}`}>
                    <Button variant="outline" size="sm" className="w-full border-green-500/50 hover:bg-green-500/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Battery Passport
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isWriting || isConfirming}
              className="flex-1"
            >
              {isWriting || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isWriting ? 'Submitting...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Start Second Life
                </>
              )}
            </Button>
            {isConfirmed && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Start Another
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-slate-400">
        <p>
          Note: You must have the AFTERMARKET_USER_ROLE or ADMIN_ROLE to start second life.
          Battery ownership will transfer to you. All transactions are recorded immutably on the blockchain.
        </p>
      </CardFooter>
    </Card>
  );
}
