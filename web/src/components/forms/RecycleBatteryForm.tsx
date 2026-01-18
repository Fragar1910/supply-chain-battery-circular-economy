'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { useToast } from '@/hooks';
import { binToBytes32 } from '@/lib/binUtils';
import { ROLES, getAccountsWithRole } from '@/lib/roleConstants';
import { AlertCircle, CheckCircle, Loader2, Recycle, Plus, Trash2, ShieldAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
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
} from '@/components/ui';

interface MaterialRecovered {
  material: string;
  quantityKg: string;
  purity: string;
}

interface RecycleBatteryFormData {
  bin: string;
  recyclingMethod: string;
  facility: string;
  materials: MaterialRecovered[];
  notes: string;
}

interface RecycleBatteryFormProps {
  onSuccess?: (bin: string) => void;
  onError?: (error: Error) => void;
}

// Available materials for recovery - MOVED OUTSIDE COMPONENT to prevent re-creation on every render
const AVAILABLE_MATERIALS = [
  { value: 'Lithium', symbol: 'Li', color: 'text-purple-400' },
  { value: 'Cobalt', symbol: 'Co', color: 'text-blue-400' },
  { value: 'Nickel', symbol: 'Ni', color: 'text-green-400' },
  { value: 'Manganese', symbol: 'Mn', color: 'text-orange-400' },
  { value: 'Copper', symbol: 'Cu', color: 'text-yellow-400' },
  { value: 'Aluminum', symbol: 'Al', color: 'text-gray-400' },
  { value: 'Graphite', symbol: 'C', color: 'text-slate-400' },
  { value: 'Steel', symbol: 'Fe', color: 'text-red-400' },
];

// Recycling methods - MOVED OUTSIDE COMPONENT to prevent re-creation on every render
const RECYCLING_METHODS = [
  { value: 'Hydrometallurgical', description: 'Chemical leaching process' },
  { value: 'Pyrometallurgical', description: 'High-temperature smelting' },
  { value: 'Direct Recycling', description: 'Direct cathode recovery' },
  { value: 'Mechanical', description: 'Physical separation' },
];

export function RecycleBatteryForm({ onSuccess, onError }: RecycleBatteryFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { address: userAddress } = useAccount();
  const [formData, setFormData] = useState<RecycleBatteryFormData>({
    bin: '',
    recyclingMethod: 'Hydrometallurgical',
    facility: '',
    materials: [{ material: 'Lithium', quantityKg: '', purity: '' }],
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<RecycleBatteryFormData>>({});
  const [toastId, setToastId] = useState<string | number | undefined>();
  const [batteryData, setBatteryData] = useState<any>(null);
  const confirmingToastShown = useRef(false);

  // Get authorized Recycler accounts
  const recyclerAccounts = useMemo(() => getAccountsWithRole('RECYCLER_ROLE'), []);

  // Check if current user has RECYCLER_ROLE
  const { data: hasRecyclerRole } = useReadContract({
    address: CONTRACTS.RecyclingManager.address as `0x${string}`,
    abi: CONTRACTS.RecyclingManager.abi,
    functionName: 'hasRole',
    args: userAddress ? [ROLES.RECYCLER_ROLE, userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Find matched account
  const matchedAccount = useMemo(() => {
    if (!userAddress) return null;
    return recyclerAccounts.find(
      (account) => account.address.toLowerCase() === userAddress.toLowerCase()
    );
  }, [userAddress, recyclerAccounts]);

  // Read battery data when BIN changes
  const { data: battery, isLoading: isLoadingBattery } = useReadContract({
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
    }
  }, [battery]);

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

  // Second write contract hook for completing recycling
  const {
    writeContract: completeWrite,
    data: completeHash,
    isPending: isCompletePending,
    error: completeError,
  } = useWriteContract();

  const {
    isLoading: isCompleteConfirming,
    isSuccess: isCompleteSuccess,
  } = useWaitForTransactionReceipt({
    hash: completeHash,
    query: {
      enabled: !!completeHash,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Toast notifications
  useEffect(() => {
    if (isPending && !toastId) {
      const id = toast.transactionPending('Recycling battery...');
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

  // Auto-complete recycling after startRecycling transaction is CONFIRMED
  // NOTE: Contract requires status == Completed for audit, so we must call completeRecycling()
  // Two-transaction flow: startRecycling() → completeRecycling()
  useEffect(() => {
    if (isSuccess && isConfirming === false && !isCompletePending && !completeHash) {
      const binBytes32 = binToBytes32(formData.bin);
      const processHash = binToBytes32(formData.notes || 'Recycling completed');

      console.log('✅ startRecycling confirmed. Auto-completing recycling for', formData.bin);

      // Wait a bit for the state to update on-chain before calling complete
      setTimeout(() => {
        completeWrite({
          address: CONTRACTS.RecyclingManager.address,
          abi: CONTRACTS.RecyclingManager.abi,
          functionName: 'completeRecycling',
          args: [binBytes32, processHash],
        });
      }, 1000); // Wait 1 second
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isConfirming, formData.bin, formData.notes]); // completeWrite removed - stable function

  // Show success toast after startRecycling succeeds (Step 1/2)
  useEffect(() => {
    if (isSuccess && !isCompletePending && !completeHash && toastId) {
      toast.dismiss(toastId);
      const totalKg = formData.materials.reduce((sum, m) => sum + (parseFloat(m.quantityKg) || 0), 0);
      toast.transactionSuccess('Battery recycling started!', {
        description: `Step 1/2: Battery ${formData.bin} received - ${totalKg.toFixed(1)} kg materials. Completing recycling process...`,
        duration: 5000,
      });
      setToastId(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isCompletePending, completeHash, toastId, formData.bin, formData.materials]);

  // Show final success toast after completeRecycling succeeds (Step 2/2)
  useEffect(() => {
    if (isCompleteSuccess) {
      const totalKg = formData.materials.reduce((sum, m) => sum + (parseFloat(m.quantityKg) || 0), 0);
      toast.transactionSuccess('Battery recycling completed successfully!', {
        description: `Battery ${formData.bin} is now ready for audit - ${totalKg.toFixed(1)} kg materials recovered. Status: Completed`,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${formData.bin}`),
        },
        duration: 10000,
      });
      onSuccess?.(formData.bin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleteSuccess, formData.bin, formData.materials]); // toast, onSuccess, router removed - stable functions

  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);

      let errorMsg = writeError.message;

      if (writeError.message.includes('User rejected')) {
        errorMsg = 'Transaction rejected by user';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction';
      } else if (writeError.message.includes('AccessControl') || writeError.message.toLowerCase().includes('only recycler')) {
        errorMsg = hasRecyclerRole === false
          ? 'You do not have RECYCLER_ROLE. Only Recyclers can recycle batteries. Please connect with Account #4 (0x15d3...6A65).'
          : 'Not authorized to recycle batteries. This function requires RECYCLER_ROLE.';
      } else if (writeError.message.includes('must be EndOfLife')) {
        errorMsg = 'Battery must be at end of life (SOH < 50%) to be recycled';
      }

      toast.transactionError('Failed to recycle battery', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
      onError?.(writeError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, toastId, hasRecyclerRole]); // toast, reset, onError removed - stable functions

  useEffect(() => {
    if (confirmError && toastId) {
      toast.dismiss(toastId);

      let errorMsg = confirmError.message;

      if (confirmError.message.includes('reverted')) {
        if (hasRecyclerRole === false) {
          errorMsg = 'Transaction reverted: You do not have RECYCLER_ROLE. Only Recyclers (Account #4) can recycle batteries.';
        } else {
          errorMsg = 'Transaction reverted. Battery must be at end of life (SOH < 50%) to be recycled.';
        }
      } else if (confirmError.message.toLowerCase().includes('accesscontrol') || confirmError.message.toLowerCase().includes('only recycler')) {
        errorMsg = 'Access denied: Only accounts with RECYCLER_ROLE can recycle batteries. Please connect with Account #4 (Recycler).';
      } else if (confirmError.message.includes('Not authorized')) {
        errorMsg = 'Not authorized to recycle this battery';
      } else if (confirmError.message.includes('must be EndOfLife')) {
        errorMsg = 'Battery must be at end of life (SOH < 50%) to be recycled';
      }

      toast.transactionError('Transaction confirmation failed', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmError, toastId, hasRecyclerRole]); // toast, reset removed - stable functions

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
    const newErrors: Partial<RecycleBatteryFormData> = {};

    if (!formData.bin.trim()) {
      newErrors.bin = 'BIN is required';
    } else if (!/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(formData.bin)) {
      newErrors.bin = 'BIN format: XX-YYYY-NNNN (e.g., NV-2024-001234)';
    }

    if (!formData.facility.trim()) {
      newErrors.facility = 'Recycling facility name is required';
    }

    // Validate materials array
    if (formData.materials.length === 0) {
      toast.transactionError('No materials specified', {
        description: 'Please add at least one recovered material',
      });
      return false;
    }

    // Validate battery exists and is end-of-life
    if (batteryData) {
      const state = Number(batteryData.state); // BatteryState enum
      const sohCurrent = Number(batteryData.sohCurrent); // sohCurrent in basis points

      if (state === 5) { // Already Recycled
        newErrors.bin = 'Battery has already been recycled';
      } else if (state !== 4 && sohCurrent >= 5000) { // Not EndOfLife and SOH >= 50%
        newErrors.bin = `Battery must be in "End of Life" state (SOH < 50%, current: ${(sohCurrent / 100).toFixed(2)}%)`;
      }
    } else if (formData.bin && !isLoadingBattery) {
      newErrors.bin = 'Battery not found in registry';
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

      // Map recycling method to enum (RecyclingMethod in RecyclingManager.sol)
      // enum RecyclingMethod { Pyrometallurgical, Hydrometallurgical, DirectRecycling, Hybrid }
      const methodEnum = {
        'Pyrometallurgical': 0,
        'Hydrometallurgical': 1,
        'Direct Recycling': 2,
        'Mechanical': 3, // Map to Hybrid
      }[formData.recyclingMethod] || 1; // Default to Hydrometallurgical

      // Calculate input weight (estimate: 5.6 kg per kWh capacity)
      const inputWeightKg = batteryData
        ? Math.floor(Number(batteryData.capacityKwh) * 5.6)
        : 100; // Default 100 kg if no data

      // Convert facility name to bytes32 hash
      const facilityHash = binToBytes32(formData.facility);

      console.log('Recycling battery with params:', {
        bin: binBytes32,
        recyclingMethod: formData.recyclingMethod,
        methodEnum,
        inputWeightKg,
        facility: formData.facility,
        facilityHash,
        materials: formData.materials,
        notes: formData.notes,
      });

      // Call startRecycling on RecyclingManager contract
      // function startRecycling(bytes32 bin, RecyclingMethod method, uint32 inputWeightKg, bytes32 facilityHash)
      writeContract(
        {
          address: CONTRACTS.RecyclingManager.address,
          abi: CONTRACTS.RecyclingManager.abi,
          functionName: 'startRecycling',
          args: [binBytes32, methodEnum, inputWeightKg, facilityHash],
        },
        {
          onError: (err) => {
            console.error('Write contract error:', err);
          },
        }
      );
    } catch (error) {
      console.error('Error recycling battery:', error);
      toast.transactionError('Failed to prepare transaction', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      if (onError) onError(error as Error);
    }
  };

  const handleChange = (field: keyof RecycleBatteryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [...prev.materials, { material: 'Lithium', quantityKg: '', purity: '' }],
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const updateMaterial = (index: number, field: keyof MaterialRecovered, value: string) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const getSOHPercentage = () => {
    if (!batteryData) return 0;
    const sohCurrent = Number(batteryData.sohCurrent);
    return (sohCurrent / 100).toFixed(2);
  };

  const getTotalRecoveredKg = () => {
    return formData.materials.reduce((sum, m) => sum + (parseFloat(m.quantityKg) || 0), 0).toFixed(2);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Recycle className="h-5 w-5 text-green-500" />
          Recycle Battery
        </CardTitle>
        <CardDescription>
          Register battery as recycled and record recovered materials (SOH &lt; 50%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Authorization Warning */}
          {userAddress && hasRecyclerRole === false && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-orange-400 mb-1">
                  ⚠️ Missing Required Role
                </p>
                <p className="text-sm text-orange-300 mb-2">
                  Your account does not have <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">RECYCLER_ROLE</code>.
                  Only Recyclers can process end-of-life batteries.
                </p>
                <p className="text-xs text-orange-200/80 mb-2">
                  <strong>Current account:</strong> {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
                <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
                  <p className="text-xs text-orange-200 font-semibold mb-1">
                    Authorized Accounts:
                  </p>
                  {recyclerAccounts.map((account) => (
                    <div key={account.address} className="text-xs text-orange-100 font-mono">
                      • Account #{account.accountNumber} ({account.name}): {account.address.slice(0, 10)}...{account.address.slice(-6)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-orange-200/70 mt-2">
                  💡 Switch to Account #4 (Recycler) in MetaMask to recycle batteries
                </p>
              </div>
            </div>
          )}

          {/* Role Confirmation Badge */}
          {userAddress && hasRecyclerRole === true && matchedAccount && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <div className="flex-1">
                <p className="text-sm text-green-300">
                  ✓ Authorized as <strong>{matchedAccount.name}</strong> ({matchedAccount.description})
                </p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/50">
                RECYCLER_ROLE
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
            {/* Show battery info if found */}
            {batteryData && !errors.bin && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Battery Information:</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">SOH:</span>{' '}
                    <Badge variant={Number(batteryData.sohCurrent) < 5000 ? 'destructive' : 'default'}>
                      {getSOHPercentage()}%
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400">Capacity:</span>{' '}
                    <span className="text-slate-200">{Number(batteryData.capacityKwh)} kWh</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Weight (est):</span>{' '}
                    <span className="text-slate-200">{(Number(batteryData.capacityKwh) * 5.6).toFixed(0)} kg</span>
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

          {/* Recycling Method */}
          <div className="space-y-2">
            <Label htmlFor="recyclingMethod">
              Recycling Method <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.recyclingMethod}
              onValueChange={(value) => handleChange('recyclingMethod', value)}
            >
              <SelectTrigger className={errors.recyclingMethod ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select recycling method" />
              </SelectTrigger>
              <SelectContent>
                {RECYCLING_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.value} - {method.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.recyclingMethod && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.recyclingMethod}
              </p>
            )}
          </div>

          {/* Recycling Facility */}
          <div className="space-y-2">
            <Label htmlFor="facility">
              Recycling Facility <span className="text-red-500">*</span>
            </Label>
            <Input
              id="facility"
              placeholder="EcoRecycle Plant Madrid"
              value={formData.facility}
              onChange={(e) => handleChange('facility', e.target.value)}
              className={errors.facility ? 'border-red-500' : ''}
            />
            {errors.facility && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.facility}
              </p>
            )}
          </div>

          {/* Materials Recovered */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Materials Recovered <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterial}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Material
              </Button>
            </div>

            <div className="space-y-2">
              {formData.materials.map((material, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start p-3 bg-slate-800/30 rounded-lg border border-slate-700"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor={`material-${index}`} className="text-xs text-slate-400">
                        Material
                      </Label>
                      <Select
                        value={material.material}
                        onValueChange={(value) => updateMaterial(index, 'material', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_MATERIALS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.symbol} - {m.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`quantity-${index}`} className="text-xs text-slate-400">
                        Quantity (kg)
                      </Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="5.2"
                        value={material.quantityKg}
                        onChange={(e) => updateMaterial(index, 'quantityKg', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`purity-${index}`} className="text-xs text-slate-400">
                        Purity (%)
                      </Label>
                      <Input
                        id={`purity-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="95.5"
                        value={material.purity}
                        onChange={(e) => updateMaterial(index, 'purity', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaterial(index)}
                    disabled={formData.materials.length === 1}
                    className="mt-6 h-10 px-2"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>

            {formData.materials.length > 0 && (
              <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-sm">
                <span className="text-green-400 font-semibold">Total Recovered:</span>{' '}
                <span className="text-green-300">{getTotalRecoveredKg()} kg</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes <span className="text-slate-400 text-xs">(Optional)</span>
            </Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Additional recycling details, certifications, quality notes..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                    : writeError.message.includes('Only recycler')
                    ? 'Only Recycler role can recycle batteries. Please connect with a recycler account.'
                    : 'Failed to recycle battery. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-500">Battery Recycled Successfully!</p>
                <p className="text-sm text-green-400 mt-1">
                  Battery {formData.bin} recycled at {formData.facility}
                </p>
                <p className="text-sm text-green-400 mt-1">
                  Method: {formData.recyclingMethod} | Total recovered: {getTotalRecoveredKg()} kg
                </p>
                <p className="text-xs text-green-300 mt-1">
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
                        recyclingMethod: 'Hydrometallurgical',
                        facility: '',
                        materials: [{ material: 'Lithium', quantityKg: '', purity: '' }],
                        notes: '',
                      });
                      setBatteryData(null);
                      reset();
                      /*setErrors({});*/  
                    }}
                  >
                    Recycle Another
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-slate-800 rounded text-xs font-mono">
              <p className="text-slate-400 mb-1">Debug Info:</p>
              <p className="text-slate-300">RecyclingManager: {CONTRACTS.RecyclingManager.address}</p>
              <p className="text-slate-300">isPending: {isPending.toString()}</p>
              <p className="text-slate-300">isConfirming: {isConfirming.toString()}</p>
              <p className="text-slate-300">hash: {hash?.slice(0, 10)}...</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isPending || isConfirming || isSuccess || hasRecyclerRole === false}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? 'Waiting for signature...' : 'Confirming...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Recycled!
                </>
              ) : hasRecyclerRole === false ? (
                <>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Missing RECYCLER_ROLE
                </>
              ) : (
                <>
                  <Recycle className="mr-2 h-4 w-4" />
                  Recycle Battery
                </>
              )}
            </Button>
          </div>

          {/* Disabled Button Info */}
          {hasRecyclerRole === false && (
            <p className="text-xs text-center text-orange-400">
              ⚠️ Button disabled: Connect with Account #4 (Recycler) to recycle batteries
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
