'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { useToast } from '@/hooks';
import { binToBytes32 } from '@/lib/binUtils';
import { getAccountsWithRole, canIntegrateBattery } from '@/lib/roleConstants';
import { AlertCircle, CheckCircle, Loader2, Car, ShieldAlert } from 'lucide-react';
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
} from '@/components/ui';

interface IntegrateBatteryFormData {
  bin: string;
  vin: string;
  vehicleModel: string;
  integrationDate: string;
}

interface IntegrateBatteryFormProps {
  onSuccess?: (bin: string) => void;
  onError?: (error: Error) => void;
}

// Battery state names - MOVED OUTSIDE COMPONENT
const BATTERY_STATE_NAMES = ['Manufactured', 'Integrated', 'FirstLife', 'SecondLife', 'EndOfLife', 'Recycled'];

export function IntegrateBatteryForm({ onSuccess, onError }: IntegrateBatteryFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { address: userAddress } = useAccount();
  const [formData, setFormData] = useState<IntegrateBatteryFormData>({
    bin: '',
    vin: '',
    vehicleModel: '',
    integrationDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Partial<IntegrateBatteryFormData>>({});
  const [toastId, setToastId] = useState<string | number | undefined>();
  const [batteryData, setBatteryData] = useState<any>(null);
  const confirmingToastShown = useRef(false);

  // Get authorized OEM accounts
  const oemAccounts = useMemo(() => getAccountsWithRole('OEM_ROLE'), []);

  // Check if current user has OEM_ROLE (address-based, no contract calls)
  const hasOEMRole = canIntegrateBattery(userAddress);

  // Find matched account
  const matchedAccount = useMemo(() => {
    if (!userAddress) return null;
    return oemAccounts.find(
      (account) => account.address.toLowerCase() === userAddress.toLowerCase()
    );
  }, [userAddress, oemAccounts]);

  // Read battery data when BIN changes
  const { data: battery, isLoading: isLoadingBattery, error: batteryError } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: formData.bin ? [binToBytes32(formData.bin)] : undefined,
    query: {
      enabled: !!formData.bin && formData.bin.length > 5,
    },
  });

  useEffect(() => {
    if (battery) {
      setBatteryData(battery);
    } else if (batteryError) {
      // Clear battery data if there's an error (battery doesn't exist)
      setBatteryData(null);
    }
  }, [battery, batteryError]);

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

  // Show toast notifications based on transaction status
  useEffect(() => {
    if (isPending && !toastId) {
      const id = toast.transactionPending('Integrating battery with vehicle...');
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
      toast.transactionSuccess('Battery integrated successfully!', {
        description: `Battery ${formData.bin} has been linked to VIN ${formData.vin}. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${formData.bin}`),
        },
        duration: 10000,
      });
      setToastId(undefined);
      onSuccess?.(formData.bin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, toastId, formData.bin, formData.vin, hash]); // toast, onSuccess, router removed - stable functions

  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);

      let errorMsg = writeError.message;

      if (writeError.message.includes('User rejected')) {
        errorMsg = 'Transaction rejected by user';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction';
      } else if (writeError.message.includes('AccessControl') || writeError.message.toLowerCase().includes('only oem')) {
        errorMsg = !hasOEMRole
          ? 'You do not have OEM_ROLE. Only OEMs can integrate batteries. Please connect with Account #2 (0x3C44...93BC).'
          : 'Not authorized to integrate batteries. This function requires OEM_ROLE.';
      } else if (writeError.message.includes('must be in Manufactured state') || writeError.message.includes('Invalid battery state')) {
        errorMsg = 'Battery must be in Manufactured or FirstLife state to be integrated';
      }

      toast.transactionError('Failed to integrate battery', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
      onError?.(writeError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, toastId, hasOEMRole]); // toast, reset, onError removed - stable functions

  useEffect(() => {
    if (confirmError && toastId) {
      toast.dismiss(toastId);

      let errorMsg = confirmError.message;

      if (confirmError.message.includes('reverted')) {
        if (!hasOEMRole) {
          errorMsg = 'Transaction reverted: You do not have OEM_ROLE. Only OEMs (Account #2) can integrate batteries.';
        } else {
          errorMsg = 'Transaction reverted. Battery must be in Manufactured or FirstLife state to be integrated.';
        }
      } else if (confirmError.message.toLowerCase().includes('accesscontrol') || confirmError.message.toLowerCase().includes('only oem')) {
        errorMsg = 'Access denied: Only accounts with OEM_ROLE can integrate batteries. Please connect with Account #2 (OEM).';
      } else if (confirmError.message.includes('Not authorized')) {
        errorMsg = 'Not authorized to integrate this battery';
      } else if (confirmError.message.includes('must be in Manufactured state') || confirmError.message.includes('Invalid battery state')) {
        errorMsg = 'Battery must be in Manufactured or FirstLife state to be integrated';
      }

      toast.transactionError('Transaction confirmation failed', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmError, toastId, hasOEMRole]); // toast, reset removed - stable functions

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
    const newErrors: Partial<IntegrateBatteryFormData> = {};

    if (!formData.bin.trim()) {
      newErrors.bin = 'BIN is required';
    } else if (!/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(formData.bin)) {
      newErrors.bin = 'BIN format: XX-YYYY-NNNN (e.g., NV-2024-001234)';
    }

    if (!formData.vin.trim()) {
      newErrors.vin = 'VIN is required';
    } else if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(formData.vin)) {
      newErrors.vin = 'VIN must be exactly 17 alphanumeric characters (ISO 3779)';
    }

    if (!formData.vehicleModel.trim()) {
      newErrors.vehicleModel = 'Vehicle model is required';
    }

    // Validate battery exists and is in correct state
    if (formData.bin && formData.bin.length > 5) {
      if (isLoadingBattery) {
        // Still loading, don't show error yet
      } else if (batteryError || !batteryData) {
        newErrors.bin = 'Battery not found in registry. Please check the BIN or register this battery first.';
      } else if (batteryData) {
        const state = Number(batteryData.state); // BatteryState enum
        // Allow Manufactured (0) or FirstLife (2) states for integration
        // FirstLife happens when OEM accepts a transfer from manufacturer
        if (state !== 0 && state !== 2) {
          const stateName = getStateName(state);
          newErrors.bin = `Battery is in "${stateName}" state. Only batteries in "Manufactured" or "FirstLife" state can be integrated with vehicles.`;
        }
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
      const binBytes32 = binToBytes32(formData.bin);
      const vinBytes32 = binToBytes32(formData.vin);

      console.log('Integrating battery with params:', {
        bin: binBytes32,
        vin: vinBytes32,
        vehicleModel: formData.vehicleModel,
        integrationDate: formData.integrationDate,
      });

      // Call integrateBattery on BatteryRegistry contract
      // function integrateBattery(bytes32 bin, bytes32 vin)
      writeContract(
        {
          address: CONTRACTS.BatteryRegistry.address,
          abi: CONTRACTS.BatteryRegistry.abi,
          functionName: 'integrateBattery',
          args: [binBytes32, vinBytes32],
        },
        {
          onError: (err) => {
            console.error('Write contract error:', err);
          },
        }
      );
    } catch (error) {
      console.error('Error integrating battery:', error);
      toast.transactionError('Failed to prepare transaction', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      if (onError) onError(error as Error);
    }
  };

  const handleChange = (field: keyof IntegrateBatteryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Get battery state name
  const getStateName = (state: number) => {
    return BATTERY_STATE_NAMES[state] || 'Unknown';
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Integrate Battery with Vehicle
        </CardTitle>
        <CardDescription>
          Link a manufactured battery to a vehicle using VIN (OEM operation)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Authorization Warning */}
          {userAddress && !hasOEMRole && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-orange-400 mb-1">
                  ⚠️ Missing Required Role
                </p>
                <p className="text-sm text-orange-300 mb-2">
                  Your account does not have <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">OEM_ROLE</code>.
                  Only OEMs can integrate batteries into vehicles.
                </p>
                <p className="text-xs text-orange-200/80 mb-2">
                  <strong>Current account:</strong> {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
                <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
                  <p className="text-xs text-orange-200 font-semibold mb-1">
                    Authorized Accounts:
                  </p>
                  {oemAccounts.map((account) => (
                    <div key={account.address} className="text-xs text-orange-100 font-mono">
                      • Account #{account.accountNumber} ({account.name}): {account.address.slice(0, 10)}...{account.address.slice(-6)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-orange-200/70 mt-2">
                  💡 Switch to Account #2 (OEM) in MetaMask to integrate batteries
                </p>
              </div>
            </div>
          )}

          {/* Role Confirmation Badge */}
          {userAddress && hasOEMRole && matchedAccount && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <div className="flex-1">
                <p className="text-sm text-green-300">
                  ✓ Authorized as <strong>{matchedAccount.name}</strong> ({matchedAccount.description})
                </p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/50">
                OEM_ROLE
              </Badge>
            </div>
          )}

          {/* BIN Field */}
          <div className="space-y-2">
            <Label htmlFor="bin">
              Battery Identification Number (BIN) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bin"
              placeholder="NV-2024-001234"
              value={formData.bin}
              onChange={(e) => handleChange('bin', e.target.value.toUpperCase())}
              className={errors.bin ? 'border-red-500' : ''}
            />
            {errors.bin && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.bin}
              </p>
            )}
            {/* Show battery info if found and valid */}
            {batteryData && !errors.bin && (
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Battery found and ready for integration
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">State:</span>{' '}
                    <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                      {getStateName(Number(batteryData.state))}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400">Capacity:</span>{' '}
                    <span className="text-slate-200">{Number(batteryData.capacityKwh)} kWh</span>
                  </div>
                </div>
              </div>
            )}
            {/* Show battery info if found but in wrong state */}
            {batteryData && errors.bin && !errors.bin.includes('not found') && Number(batteryData.capacityKwh) > 0 && (
              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <p className="text-xs text-orange-400 mb-2">Battery Information:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Current State:</span>{' '}
                    <Badge variant="destructive" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {getStateName(Number(batteryData.state))}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400">Capacity:</span>{' '}
                    <span className="text-slate-200">{Number(batteryData.capacityKwh)} kWh</span>
                  </div>
                </div>
                <p className="text-xs text-orange-300 mt-2">
                  💡 Tip: This battery needs to be in "Manufactured" state. Try using battery <code className="px-1 py-0.5 bg-orange-500/20 rounded">NV-2024-001234</code> which is ready for integration.
                </p>
              </div>
            )}
            {isLoadingBattery && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking battery status...
              </p>
            )}
          </div>

          {/* VIN Field */}
          <div className="space-y-2">
            <Label htmlFor="vin">
              Vehicle Identification Number (VIN) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="vin"
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
              value={formData.vin}
              onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
              className={errors.vin ? 'border-red-500' : ''}
            />
            <p className="text-xs text-slate-400">
              17-character VIN (ISO 3779 standard)
            </p>
            {errors.vin && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.vin}
              </p>
            )}
          </div>

          {/* Vehicle Model */}
          <div className="space-y-2">
            <Label htmlFor="vehicleModel">
              Vehicle Model <span className="text-red-500">*</span>
            </Label>
            <Input
              id="vehicleModel"
              placeholder="Tesla Model 3, BMW iX, Nissan Leaf..."
              value={formData.vehicleModel}
              onChange={(e) => handleChange('vehicleModel', e.target.value)}
              className={errors.vehicleModel ? 'border-red-500' : ''}
            />
            <p className="text-xs text-slate-400">
              Make and model of the vehicle (informational)
            </p>
            {errors.vehicleModel && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.vehicleModel}
              </p>
            )}
          </div>

          {/* Integration Date */}
          <div className="space-y-2">
            <Label htmlFor="integrationDate">
              Integration Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="integrationDate"
              type="date"
              value={formData.integrationDate}
              onChange={(e) => handleChange('integrationDate', e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Date when battery was installed in vehicle
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
                    : writeError.message.includes('Only OEM')
                    ? 'Only OEM role can integrate batteries. Please connect with an OEM account.'
                    : 'Failed to integrate battery. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-500">Battery Integrated Successfully!</p>
                <p className="text-sm text-green-400 mt-1">
                  Battery {formData.bin} linked to VIN {formData.vin}
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
                        vin: '',
                        vehicleModel: '',
                        integrationDate: new Date().toISOString().split('T')[0],
                      });
                      setBatteryData(null);
                      reset();
                    }}
                  >
                    Integrate Another
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-slate-800 rounded text-xs font-mono">
              <p className="text-slate-400 mb-1">Debug Info:</p>
              <p className="text-slate-300">Address: {CONTRACTS.BatteryRegistry.address}</p>
              <p className="text-slate-300">isPending: {isPending.toString()}</p>
              <p className="text-slate-300">isConfirming: {isConfirming.toString()}</p>
              <p className="text-slate-300">hash: {hash?.slice(0, 10)}...</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isPending || isConfirming || isSuccess || !hasOEMRole}
              className="flex-1"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? 'Waiting for signature...' : 'Confirming...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Integrated!
                </>
              ) : !hasOEMRole ? (
                <>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Missing OEM_ROLE
                </>
              ) : (
                'Integrate Battery'
              )}
            </Button>
          </div>

          {/* Disabled Button Info */}
          {!hasOEMRole && (
            <p className="text-xs text-center text-orange-400">
              ⚠️ Button disabled: Connect with Account #2 (OEM) to integrate batteries
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
