'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { useToast } from '@/hooks';
import { binToBytes32 } from '@/lib/binUtils';
import { AlertCircle, CheckCircle, Loader2, TrendingDown, Info, ShieldAlert, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { ChangeBatteryStateForm } from './ChangeBatteryStateForm';

interface UpdateSOHFormData {
  bin: string;
  newSOH: string;
  notes: string;
}

interface UpdateSOHFormProps {
  initialBin?: string;
  currentSOH?: number;
  onSuccess?: (bin: string, newSOH: number) => void;
  onError?: (error: Error) => void;
}

// Known test accounts with OPERATOR_ROLE
const OPERATOR_ACCOUNTS = [
  {
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', // Account #5 - Fleet Operator
    name: 'Fleet Operator',
    description: 'EV Fleet Solutions'
  },
];

const OPERATOR_ROLE = '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929'; // keccak256("OPERATOR_ROLE")

export function UpdateSOHForm({
  initialBin = '',
  currentSOH,
  onSuccess,
  onError,
}: UpdateSOHFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { address: userAddress } = useAccount();
  const [formData, setFormData] = useState<UpdateSOHFormData>({
    bin: initialBin,
    newSOH: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<UpdateSOHFormData>>({});
  const [fetchedSOH, setFetchedSOH] = useState<number | null>(currentSOH ?? null);
  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Convert BIN to bytes32
  const binBytes32 = useMemo(() => binToBytes32(formData.bin), [formData.bin]);

  // Check if current user has OPERATOR_ROLE
  const { data: hasOperatorRole } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'hasRole',
    args: userAddress ? [OPERATOR_ROLE, userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Fetch current SOH if BIN is provided
  const { data: batteryData } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: formData.bin ? [binBytes32] : undefined,
    query: {
      enabled: formData.bin.length > 0 && /^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(formData.bin),
    },
  });

  // Check if user's address matches any known operator account
  const matchedOperator = useMemo(() => {
    if (!userAddress) return null;
    return OPERATOR_ACCOUNTS.find(
      (op) => op.address.toLowerCase() === userAddress.toLowerCase()
    );
  }, [userAddress]);

  useEffect(() => {
    if (batteryData && typeof batteryData === 'object' && 'sohCurrent' in batteryData) {
      const sohValue = batteryData.sohCurrent;
      // Contract stores SOH in basis points (0-10000 = 0%-100%), convert to percentage
      const sohPercentage = (typeof sohValue === 'bigint' ? Number(sohValue) : Number(sohValue)) / 100;
      setFetchedSOH(sohPercentage);
    }
  }, [batteryData]);

  // Toast notifications based on transaction status
  useEffect(() => {
    if (isPending && !toastId) {
      const id = toast.transactionPending('Updating SOH...');
      setToastId(id);
    }
  }, [isPending, toastId]); // toast removed - stable function

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

  useEffect(() => {
    if (isSuccess && toastId) {
      toast.dismiss(toastId);
      toast.transactionSuccess('SOH updated successfully!', {
        description: `Battery ${formData.bin} SOH updated to ${formData.newSOH}%. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${formData.bin}`),
        },
        duration: 10000,
      });
      setToastId(undefined);
      onSuccess?.(formData.bin, Number(formData.newSOH));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, toastId, formData.bin, formData.newSOH, hash]); // toast, router, onSuccess removed - stable functions

  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);

      // Determine specific error message based on user role
      let errorMsg = writeError.message;

      if (writeError.message.includes('User rejected')) {
        errorMsg = 'Transaction rejected by user';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction';
      } else if (writeError.message.includes('AccessControl') || writeError.message.toLowerCase().includes('only operator')) {
        errorMsg = hasOperatorRole === false
          ? 'You do not have OPERATOR_ROLE. Only Fleet Operators can update SOH. Please connect with Account #5 (0x9965...A4dc).'
          : 'Not authorized to update SOH. This function requires OPERATOR_ROLE.';
      } else if (writeError.message.includes('not authorized')) {
        errorMsg = 'Not authorized to update this battery';
      } else if (writeError.message.includes('Invalid SOH') || writeError.message.includes('SOH cannot exceed')) {
        errorMsg = 'Invalid SOH value (must be 0-100%)';
      }

      toast.transactionError('Failed to update SOH', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
      onError?.(writeError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, toastId, hasOperatorRole]); // toast, reset, onError removed - stable functions

  useEffect(() => {
    if (confirmError && toastId) {
      toast.dismiss(toastId);

      // Determine specific error message
      let errorMsg = confirmError.message;

      if (confirmError.message.includes('reverted')) {
        if (hasOperatorRole === false) {
          errorMsg = 'Transaction reverted: You do not have OPERATOR_ROLE. Only Fleet Operators (Account #5) can update SOH.';
        } else {
          errorMsg = 'Transaction reverted. SOH value may be invalid (must be 0-100%).';
        }
      } else if (confirmError.message.toLowerCase().includes('accesscontrol') || confirmError.message.toLowerCase().includes('only operator')) {
        errorMsg = 'Access denied: Only accounts with OPERATOR_ROLE can update SOH. Please connect with Account #5 (Fleet Operator).';
      } else if (confirmError.message.includes('Not authorized')) {
        errorMsg = 'Not authorized to update SOH for this battery';
      } else if (confirmError.message.includes('SOH cannot exceed')) {
        errorMsg = 'Invalid SOH value (must be 0-100%)';
      }

      toast.transactionError('Transaction confirmation failed', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmError, toastId, hasOperatorRole]); // toast, reset removed - stable functions

  // Timeout safety net: clear toast if transaction takes too long (30 seconds)
  useEffect(() => {
    if (isConfirming) {
      const timeoutId = setTimeout(() => {
        toast.dismiss(toastId);
        toast.transactionError('Transaction timeout', {
          description: 'Transaction is taking too long. Please check your wallet or try again.',
        });
        setToastId(undefined);
        reset();
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirming]); // toast, reset removed - stable functions

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateSOHFormData> = {};

    if (!formData.bin.trim()) {
      newErrors.bin = 'BIN is required';
    } else if (!/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(formData.bin)) {
      newErrors.bin = 'Invalid BIN format (e.g., NV-2024-001234)';
    }

    if (!formData.newSOH.trim()) {
      newErrors.newSOH = 'New SOH is required';
    } else {
      const sohValue = Number(formData.newSOH);
      if (isNaN(sohValue) || sohValue < 0 || sohValue > 100) {
        newErrors.newSOH = 'SOH must be between 0 and 100';
      } else if (fetchedSOH !== null && sohValue > fetchedSOH) {
        newErrors.newSOH = `SOH cannot increase (current: ${fetchedSOH}%)`;
      } else if (sohValue === fetchedSOH) {
        newErrors.newSOH = 'SOH value must be different from current value';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Convert SOH percentage to basis points (e.g., 85% -> 8500)
      const sohBasisPoints = BigInt(Math.floor(Number(formData.newSOH) * 100));
      const estimatedCycles = BigInt(0); // Default cycles, can be enhanced

      // Call updateSOH on BatteryRegistry contract
      writeContract({
        address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
        abi: CONTRACTS.BatteryRegistry.abi,
        functionName: 'updateSOH',
        args: [binBytes32, sohBasisPoints, estimatedCycles] as any,
      });
    } catch (error) {
      console.error('Error updating SOH:', error);
      if (onError) onError(error as Error);
    }
  };

  const handleChange = (field: keyof UpdateSOHFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Calculate degradation
  const degradation =
    fetchedSOH !== null && formData.newSOH
      ? fetchedSOH - Number(formData.newSOH)
      : null;

  // Determine battery status based on SOH
  const getBatteryStatus = (soh: number) => {
    if (soh >= 80) return { status: 'First Life', color: 'success' as const };
    if (soh >= 50) return { status: 'Second Life', color: 'warning' as const };
    return { status: 'End of Life', color: 'destructive' as const };
  };

  const newStatus = formData.newSOH
    ? getBatteryStatus(Number(formData.newSOH))
    : null;
  const currentStatus = fetchedSOH !== null ? getBatteryStatus(fetchedSOH) : null;

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle>Battery Operations</CardTitle>
        <CardDescription>
          Update battery health status or manually change lifecycle state (requires OPERATOR_ROLE)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="soh" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="soh">Update SOH</TabsTrigger>
            <TabsTrigger value="state">Change State</TabsTrigger>
          </TabsList>

          <TabsContent value="soh" className="space-y-0">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Authorization Warning */}
          {userAddress && hasOperatorRole === false && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-orange-400 mb-1">
                  ⚠️ Missing Required Role
                </p>
                <p className="text-sm text-orange-300 mb-2">
                  Your account does not have <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">OPERATOR_ROLE</code>.
                  Only Fleet Operators can update battery SOH.
                </p>
                <p className="text-xs text-orange-200/80 mb-2">
                  <strong>Current account:</strong> {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
                <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
                  <p className="text-xs text-orange-200 font-semibold mb-1">
                    Authorized Accounts:
                  </p>
                  {OPERATOR_ACCOUNTS.map((op) => (
                    <div key={op.address} className="text-xs text-orange-100 font-mono">
                      • {op.name}: {op.address.slice(0, 10)}...{op.address.slice(-6)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-orange-200/70 mt-2">
                  💡 Switch to Account #5 in MetaMask to update SOH
                </p>
              </div>
            </div>
          )}

          {/* Role Confirmation Badge */}
          {userAddress && hasOperatorRole === true && matchedOperator && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <div className="flex-1">
                <p className="text-sm text-green-300">
                  ✓ Authorized as <strong>{matchedOperator.name}</strong> ({matchedOperator.description})
                </p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/50">
                OPERATOR_ROLE
              </Badge>
            </div>
          )}
          {/* BIN Field */}
          <div className="space-y-2">
            <Label htmlFor="bin">
              Battery ID (BIN) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bin"
              placeholder="NV-2024-001234"
              value={formData.bin}
              onChange={(e) => handleChange('bin', e.target.value)}
              className={errors.bin ? 'border-red-500' : ''}
            />
            {errors.bin && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.bin}
              </p>
            )}
          </div>

          {/* Current SOH Display */}
          {fetchedSOH !== null && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Current SOH:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{fetchedSOH}%</span>
                  {currentStatus && (
                    <Badge variant={currentStatus.color}>{currentStatus.status}</Badge>
                  )}
                </div>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    fetchedSOH >= 80
                      ? 'bg-green-500'
                      : fetchedSOH >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${fetchedSOH}%` }}
                />
              </div>
            </div>
          )}

          {/* New SOH Field */}
          <div className="space-y-2">
            <Label htmlFor="newSOH">
              New SOH (%) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newSOH"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="95.5"
              value={formData.newSOH}
              onChange={(e) => handleChange('newSOH', e.target.value)}
              className={errors.newSOH ? 'border-red-500' : ''}
            />
            {errors.newSOH && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.newSOH}
              </p>
            )}
            <p className="text-xs text-slate-500">
              State of Health percentage (0-100). SOH can only decrease over time.
            </p>
          </div>

          {/* Degradation Info */}
          {degradation !== null && degradation > 0 && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-400">
                <TrendingDown className="h-4 w-4" />
                <div className="text-sm">
                  <span className="font-semibold">Degradation: </span>
                  <span>{degradation.toFixed(1)}% decrease</span>
                  {newStatus && newStatus.status !== currentStatus?.status && (
                    <span className="ml-2">
                      → Status will change to{' '}
                      <Badge variant={newStatus.color} className="ml-1">
                        {newStatus.status}
                      </Badge>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Reason for update, maintenance performed, etc."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Optional notes about this SOH update
            </p>
          </div>

          {/* Error Message */}
          {writeError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-500">Transaction Failed</p>
                <p className="text-sm text-red-400 mt-1">
                  {writeError.message.includes('User rejected')
                    ? 'Transaction was rejected by user'
                    : writeError.message.includes('not authorized')
                    ? 'You are not authorized to update this battery'
                    : writeError.message.includes('Invalid SOH')
                    ? 'Invalid SOH value provided'
                    : 'Failed to update SOH. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-500">SOH Updated Successfully!</p>
                <p className="text-sm text-green-400 mt-1">
                  Battery {formData.bin} SOH updated to {formData.newSOH}%
                </p>
                <p className="text-xs text-green-400 mt-1">
                  Transaction hash: {hash?.slice(0, 10)}...{hash?.slice(-8)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/passport/${formData.bin}`)}
                    className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                  >
                    View Passport
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        bin: '',
                        newSOH: '',
                        notes: '',
                      });
                      setFetchedSOH(null);
                      reset();
                    }}
                  >
                    Update Another
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || isConfirming || isSuccess || hasOperatorRole === false}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPending ? 'Waiting for signature...' : 'Confirming...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Updated!
                </>
              ) : hasOperatorRole === false ? (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Missing OPERATOR_ROLE
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Update SOH
                </>
              )}
            </Button>
          </div>

          {/* Disabled Button Info */}
          {hasOperatorRole === false && (
            <p className="text-xs text-center text-orange-400">
              ⚠️ Button disabled: Connect with an account that has OPERATOR_ROLE
            </p>
          )}

          <p className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Required fields
          </p>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-purple-300 space-y-3">
                <div>
                  <p className="font-semibold mb-1">SOH Lifecycle Stages:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>First Life (80-100%):</strong> Battery in active use in vehicle
                    </li>
                    <li>
                      <strong>Second Life (50-79%):</strong> Repurposed for stationary storage
                    </li>
                    <li>
                      <strong>End of Life (&lt;50%):</strong> Ready for recycling
                    </li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-purple-500/20">
                  <p className="font-semibold mb-1 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Required Role:
                  </p>
                  <p className="text-purple-200">
                    This operation requires <code className="px-1 py-0.5 bg-purple-500/20 rounded">OPERATOR_ROLE</code>.
                    Only Fleet Operators can update battery health metrics.
                  </p>
                  <p className="text-purple-200/80 mt-1">
                    📌 Test Account: Account #5 - Fleet Operator (0x9965...A4dc)
                  </p>
                </div>
              </div>
            </div>
          </div>
            </form>
          </TabsContent>

          <TabsContent value="state" className="space-y-0">
            <ChangeBatteryStateForm
              onSuccess={(bin, newState) => {
                // Optional: handle success from ChangeBatteryStateForm
                console.log(`Battery ${bin} state changed to ${newState}`);
              }}
              onError={(error) => {
                // Optional: handle error from ChangeBatteryStateForm
                console.error('Error changing battery state:', error);
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
