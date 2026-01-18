'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { useToast } from '@/hooks';
import { binToBytes32 } from '@/lib/binUtils';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
} from '@/components/ui';

interface BatteryFormData {
  bin: string;
  chemistry: string;
  capacity: string; // in kWh
  manufacturer: string;
  manufactureDate: string;
}

interface RegisterBatteryFormProps {
  onSuccess?: (bin: string) => void;
  onError?: (error: Error) => void;
}

// Chemistry enum mapping (must match BatteryRegistry.sol) - MOVED OUTSIDE COMPONENT
// enum Chemistry { Unknown, NMC, NCA, LFP, LTO, LiMetal }
const CHEMISTRY_OPTIONS = [
  { value: '1', label: 'NMC (Nickel Manganese Cobalt)', key: 'NMC' },
  { value: '2', label: 'NCA (Nickel Cobalt Aluminum)', key: 'NCA' },
  { value: '3', label: 'LFP (Lithium Iron Phosphate)', key: 'LFP' },
  { value: '4', label: 'LTO (Lithium Titanate Oxide)', key: 'LTO' },
  { value: '5', label: 'LiMetal (Lithium Metal)', key: 'LiMetal' },
];

export function RegisterBatteryForm({ onSuccess, onError }: RegisterBatteryFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState<BatteryFormData>({
    bin: '',
    chemistry: '1', // Default to NMC (enum value 1)
    capacity: '',
    manufacturer: '',
    manufactureDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Partial<BatteryFormData>>({});
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

  // Show toast notifications based on transaction status
  useEffect(() => {
    if (isPending && !toastId) {
      const id = toast.transactionPending('Registering battery...');
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
      toast.transactionSuccess('Battery registered successfully!', {
        description: `Battery ${formData.bin} has been added to the blockchain. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${formData.bin}`),
        },
        duration: 10000, // Show for 10 seconds so user has time to click
      });
      setToastId(undefined);
      onSuccess?.(formData.bin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, toastId, formData.bin, hash]); // toast, router, onSuccess removed - stable functions

  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);
      const errorMsg = writeError.message.includes('User rejected')
        ? 'Transaction rejected by user'
        : writeError.message.includes('insufficient funds')
        ? 'Insufficient funds for transaction'
        : writeError.message;

      toast.transactionError('Failed to register battery', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset(); // Reset the write contract state
      onError?.(writeError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, toastId]); // toast, reset, onError removed - stable functions

  // Handle confirmation errors
  useEffect(() => {
    if (confirmError && toastId) {
      toast.dismiss(toastId);
      const errorMsg = confirmError.message.includes('reverted')
        ? 'Transaction reverted. You may not be authorized or there may be a validation error.'
        : confirmError.message.includes('Only manufacturer')
        ? 'Only Manufacturer role can register batteries'
        : confirmError.message;

      toast.transactionError('Transaction confirmation failed', {
        description: errorMsg,
      });
      setToastId(undefined);
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
        reset();
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirming]); // toast, reset removed - stable functions

  const validateForm = (): boolean => {
    const newErrors: Partial<BatteryFormData> = {};

    if (!formData.bin.trim()) {
      newErrors.bin = 'BIN is required';
    } else if (!/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(formData.bin)) {
      newErrors.bin = 'BIN format: XX-YYYY-NNNN (e.g., NV-2024-001234)';
    }

    if (!formData.capacity || formData.capacity.trim() === '') {
      newErrors.capacity = 'Capacity is required';
    } else {
      const capacityNum = Number(formData.capacity);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        newErrors.capacity = 'Capacity must be a positive number';
      } else if (!Number.isInteger(capacityNum)) {
        newErrors.capacity = 'Capacity must be a whole number';
      }
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
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
      // Convert BIN to bytes32
      const binBytes32 = binToBytes32(formData.bin);

      // Convert chemistry string to enum number (uint8)
      const chemistryEnum = Number(formData.chemistry);

      // Convert capacity from kWh to uint32 (no decimals in contract)
      const capacityKwh = Number(Math.floor(Number(formData.capacity)));

      // Calculate estimated carbon footprint (kg CO2e) - uint256
      // Rough estimate: ~100 kg CO2e per kWh of battery capacity
      const carbonFootprint = BigInt(capacityKwh * 100);

      // Empty IPFS hash for now (can be added later)
      const ipfsCertHash = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

      console.log('Registering battery with params:', {
        bin: binBytes32,
        chemistry: chemistryEnum,
        capacityKwh,
        carbonFootprint,
        ipfsCertHash,
        formData,
      });

      // Call registerBattery on BatteryRegistry contract
      // function registerBattery(bytes32 bin, Chemistry chemistry, uint32 capacityKwh, uint256 carbonFootprint, bytes32 ipfsCertHash)
      writeContract(
        {
          address: CONTRACTS.BatteryRegistry.address,
          abi: CONTRACTS.BatteryRegistry.abi,
          functionName: 'registerBattery',
          args: [
            binBytes32,
            chemistryEnum,
            capacityKwh,
            carbonFootprint,
            ipfsCertHash,
          ],
        },
        {
          onError: (err) => {
            console.error('Write contract error:', err);
          },
        }
      );
    } catch (error) {
      console.error('Error registering battery:', error);
      toast.transactionError('Failed to prepare transaction', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      if (onError) onError(error as Error);
    }
  };

  const handleChange = (field: keyof BatteryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Auto-generate BIN
  const generateBIN = () => {
    const prefix = formData.manufacturer
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3) || 'BAT';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(6, '0');
    handleChange('bin', `${prefix}-${year}-${random}`);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle>Register New Battery</CardTitle>
        <CardDescription>
          Create a new battery record in the blockchain registry
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BIN Field */}
          <div className="space-y-2">
            <Label htmlFor="bin">
              Battery Identification Number (BIN) <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="bin"
                placeholder="NV-2024-001234"
                value={formData.bin}
                onChange={(e) => handleChange('bin', e.target.value)}
                className={errors.bin ? 'border-red-500' : ''}
              />
              <Button type="button" variant="outline" onClick={generateBIN}>
                Generate
              </Button>
            </div>
            {errors.bin && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.bin}
              </p>
            )}
          </div>

          {/* Chemistry Field */}
          <div className="space-y-2">
            <Label htmlFor="chemistry">
              Battery Chemistry <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.chemistry}
              onValueChange={(value) => handleChange('chemistry', value)}
            >
              <SelectTrigger className={errors.chemistry ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select battery chemistry" />
              </SelectTrigger>
              <SelectContent>
                {CHEMISTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.chemistry && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.chemistry}
              </p>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">
              Capacity (kWh) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="capacity"
              type="number"
              step="1"
              placeholder="75"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              className={errors.capacity ? 'border-red-500' : ''}
            />
            <p className="text-xs text-slate-400">Nominal capacity in kWh (whole numbers)</p>
            {errors.capacity && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.capacity}
              </p>
            )}
          </div>

          {/* Manufacturer */}
          <div className="space-y-2">
            <Label htmlFor="manufacturer">
              Manufacturer <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manufacturer"
              placeholder="Northvolt AB"
              value={formData.manufacturer}
              onChange={(e) => handleChange('manufacturer', e.target.value)}
              className={errors.manufacturer ? 'border-red-500' : ''}
            />
            {errors.manufacturer && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.manufacturer}
              </p>
            )}
          </div>

          {/* Manufacture Date */}
          <div className="space-y-2">
            <Label htmlFor="manufactureDate">
              Manufacture Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manufactureDate"
              type="date"
              value={formData.manufactureDate}
              onChange={(e) => handleChange('manufactureDate', e.target.value)}
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
                    : 'Failed to register battery. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-500">
                  Battery Registered Successfully!
                </p>
                <p className="text-sm text-green-400 mt-1">
                  Battery {formData.bin} has been added to the blockchain
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
                        chemistry: '1',
                        capacity: '',
                        manufacturer: '',
                        manufactureDate: new Date().toISOString().split('T')[0],
                      });
                      reset();
                      setErrors({});
                    }}
                  >
                    Register Another
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
              className="flex-1"
              disabled={isPending || isConfirming || isSuccess}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPending ? 'Waiting for wallet...' : 'Confirming transaction...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Registered!
                </>
              ) : (
                'Register Battery'
              )}
            </Button>
          </div>

          <p className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Required fields
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
