'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { useToast } from '@/hooks';
import { binToBytes32 } from '@/lib/binUtils';
import { AlertCircle, CheckCircle, Loader2, ArrowRightLeft } from 'lucide-react';
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
import { isAddress } from 'viem';

interface TransferFormData {
  bin: string;
  newOwner: string;
  transferType: string;
  notes: string;
}

// Map transfer types to BatteryState enum values
// Note: Integrated (1) is set by integrateBattery(), not by transfer
const TRANSFER_TYPE_TO_STATE: Record<string, number> = {
  'Manufacturer→OEM': 2, // FirstLife (OEM will integrate it later)
  'OEM→Customer': 2, // FirstLife
  'Customer→SecondLife': 3, // SecondLife
  'SecondLife→Recycler': 4, // EndOfLife
  'Customer→Recycler': 4, // EndOfLife
};

interface TransferOwnershipFormProps {
  initialBin?: string;
  onSuccess?: (bin: string, newOwner: string) => void;
  onError?: (error: Error) => void;
}

// Transfer types - MOVED OUTSIDE COMPONENT to prevent re-creation on every render
const TRANSFER_TYPES = [
  { value: 'Manufacturer→OEM', label: 'Manufacturer → OEM' },
  { value: 'OEM→Customer', label: 'OEM → Customer (Fleet Operator)' },
  { value: 'Customer→SecondLife', label: 'Customer → Second Life User' },
  { value: 'SecondLife→Recycler', label: 'Second Life → Recycler' },
  { value: 'Customer→Recycler', label: 'Customer → Recycler (Direct)' },
];

export function TransferOwnershipForm({
  initialBin = '',
  onSuccess,
  onError,
}: TransferOwnershipFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { address: currentAddress } = useAccount();
  const [formData, setFormData] = useState<TransferFormData>({
    bin: initialBin,
    newOwner: '',
    transferType: 'Manufacturer→OEM',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<TransferFormData>>({});
  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);
  const [isRetrying, setIsRetrying] = useState(false);

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
      // Add staleTime to prevent refetch issues
      staleTime: 2000,
    },
  });

  // Convert BIN to bytes32
  const binBytes32 = useMemo(() => binToBytes32(formData.bin), [formData.bin]);

  const validateForm = (): boolean => {
    const newErrors: Partial<TransferFormData> = {};

    if (!formData.bin.trim()) {
      newErrors.bin = 'BIN is required';
    } else if (!/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(formData.bin)) {
      newErrors.bin = 'Invalid BIN format (e.g., NV-2024-001234)';
    }

    if (!formData.newOwner.trim()) {
      newErrors.newOwner = 'New owner address is required';
    } else if (!isAddress(formData.newOwner)) {
      newErrors.newOwner = 'Invalid Ethereum address';
    } else if (formData.newOwner.toLowerCase() === currentAddress?.toLowerCase()) {
      newErrors.newOwner = 'Cannot transfer to yourself';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // If retrying after nonce error, wait a bit for blockchain state to sync
    if (isRetrying) {
      toast.info('Retrying transaction...', {
        description: 'Waiting for blockchain sync',
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsRetrying(false);
    }

    try {
      // Get the new state based on transfer type
      const newState = TRANSFER_TYPE_TO_STATE[formData.transferType] || 2; // Default to FirstLife

      // Call initiateTransfer on BatteryRegistry contract (new two-step flow)
      writeContract({
        address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
        abi: CONTRACTS.BatteryRegistry.abi,
        functionName: 'initiateTransfer',
        args: [binBytes32, formData.newOwner as `0x${string}`, newState] as any,
      });
    } catch (error) {
      console.error('Error initiating transfer:', error);
      if (onError) onError(error as Error);
    }
  };

  const handleChange = (field: keyof TransferFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Toast notifications based on transaction status
  useEffect(() => {
    if (isPending && !toastId) {
      const id = toast.transactionPending('Initiating transfer...');
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
      toast.transactionSuccess('Transfer initiated successfully!', {
        description: `Transfer to ${formData.newOwner.slice(0, 6)}...${formData.newOwner.slice(-4)} is pending acceptance. The recipient has 7 days to accept.`,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${formData.bin}`),
        },
        duration: 10000,
      });
      setToastId(undefined);
      confirmingToastShown.current = false; // Reset flag
      setIsRetrying(false); // Clear retry flag on success
      onSuccess?.(formData.bin, formData.newOwner);
      // Don't auto-reset - let user click "Transfer Another" button
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, toastId, formData.bin, formData.newOwner]); // toast, onSuccess, router removed - stable functions

  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);

      // Check if it's a nonce error
      const isNonceError = writeError.message.includes('nonce') ||
                          writeError.message.includes('getTransactionCount') ||
                          writeError.message.includes('replacement fee too low') ||
                          writeError.message.includes('already known');

      if (isNonceError) {
        setIsRetrying(true);
        toast.transactionError('Transaction nonce error', {
          description: 'Blockchain state not synced. Please wait 2-3 seconds and click "Initiate Transfer" again.',
          duration: 8000,
        });
      } else {
        const errorMsg = writeError.message.includes('User rejected')
          ? 'Transaction rejected by user'
          : writeError.message.includes('insufficient funds')
          ? 'Insufficient funds for transaction'
          : writeError.message.includes('not owner') || writeError.message.includes('Not authorized')
          ? 'You are not the current owner of this battery'
          : writeError.message.includes('Transfer already pending')
          ? 'This battery already has a pending transfer. Cancel it first.'
          : writeError.message.includes('Cannot transfer to yourself')
          ? 'You cannot transfer a battery to yourself'
          : writeError.message.includes('Invalid state transition')
          ? 'Invalid state transition for this battery'
          : writeError.message;

        toast.transactionError('Failed to initiate transfer', {
          description: errorMsg,
        });
      }

      setToastId(undefined);
      confirmingToastShown.current = false; // Reset flag
      reset();
      onError?.(writeError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, toastId]); // toast, reset, onError removed - stable functions

  useEffect(() => {
    if (confirmError && toastId) {
      toast.dismiss(toastId);

      // Check if it's a nonce error
      const isNonceError = confirmError.message.includes('nonce') ||
                          confirmError.message.includes('getTransactionCount') ||
                          confirmError.message.includes('replacement fee too low');

      if (isNonceError) {
        setIsRetrying(true);
        toast.transactionError('Transaction nonce error', {
          description: 'Blockchain state not synced. Please wait 2-3 seconds and try again.',
          duration: 8000,
        });
      } else {
        const errorMsg = confirmError.message.includes('reverted')
          ? 'Transaction reverted. You may not be authorized, the battery may not exist, or there is already a pending transfer.'
          : confirmError.message.includes('Not authorized')
          ? 'Not authorized to initiate this transfer'
          : confirmError.message.includes('Transfer already pending')
          ? 'This battery already has a pending transfer'
          : confirmError.message.includes('Invalid state transition')
          ? 'Invalid state transition for this battery lifecycle'
          : confirmError.message;

        toast.transactionError('Transaction confirmation failed', {
          description: errorMsg,
        });
      }

      setToastId(undefined);
      confirmingToastShown.current = false; // Reset flag
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

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle>Transfer Battery Ownership</CardTitle>
        <CardDescription>
          Transfer a battery to a new owner in the supply chain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-xs text-slate-500">
              The battery you want to transfer ownership of
            </p>
          </div>

          {/* New Owner Address */}
          <div className="space-y-2">
            <Label htmlFor="newOwner">
              New Owner Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newOwner"
              placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
              value={formData.newOwner}
              onChange={(e) => handleChange('newOwner', e.target.value)}
              className={errors.newOwner ? 'border-red-500' : ''}
            />
            {errors.newOwner && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.newOwner}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Ethereum address of the recipient (must have appropriate role)
            </p>
          </div>

          {/* Transfer Type */}
          <div className="space-y-2">
            <Label htmlFor="transferType">
              Transfer Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.transferType}
              onValueChange={(value) => handleChange('transferType', value)}
            >
              <SelectTrigger className={errors.transferType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select transfer type" />
              </SelectTrigger>
              <SelectContent>
                {TRANSFER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.transferType && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.transferType}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Select the stage in the supply chain lifecycle
            </p>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Additional transfer information..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Any additional information about this transfer
            </p>
          </div>

          {/* Current Owner Info */}
          {currentAddress && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Current Owner (You):</p>
              <p className="text-sm font-mono text-white">{currentAddress}</p>
            </div>
          )}

          {/* Retry Message (Nonce Error) */}
          {isRetrying && !isSuccess && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-500">Transaction Issue Detected</p>
                <p className="text-sm text-yellow-400 mt-1">
                  Wait 2-3 seconds, then verify the information below and click "Initiate Transfer" again.
                </p>
                <div className="mt-2 text-xs text-yellow-300 space-y-1">
                  <p className="font-semibold">Check these common issues:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>Battery BIN is correct and registered in the system</li>
                    <li>You are the current owner of this battery</li>
                    <li>No pending transfer exists for this battery</li>
                    <li>Battery state allows this transfer (not already recycled)</li>
                    <li>You didn't just reject a transfer (blockchain needs time to sync)</li>
                  </ul>
                  <p className="mt-2">💡 <strong>Tip:</strong> Check the battery passport to verify ownership and current state.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {writeError && !isRetrying && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-500">Transaction Failed</p>
                <p className="text-sm text-red-400 mt-1">
                  {writeError.message.includes('User rejected')
                    ? 'Transaction was rejected by user'
                    : writeError.message.includes('not owner')
                    ? 'You are not the current owner of this battery'
                    : writeError.message.includes('Invalid recipient')
                    ? 'Recipient address does not have the required role'
                    : 'Failed to transfer ownership. Please try again.'}
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
                  Transfer Initiated Successfully!
                </p>
                <p className="text-sm text-green-400 mt-1">
                  Transfer request sent to {formData.newOwner.slice(0, 6)}...{formData.newOwner.slice(-4)}.
                  The recipient has 7 days to accept this transfer.
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
                        newOwner: '',
                        transferType: 'Manufacturer→OEM',
                        notes: '',
                      });
                      setIsRetrying(false);
                      reset();
                    }}
                  >
                    Transfer Another
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
              disabled={isPending || isConfirming || isSuccess}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPending ? 'Waiting for signature...' : 'Confirming...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Transfer Initiated!
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Initiate Transfer
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-slate-500">
            <span className="text-red-500">*</span> Required fields
          </p>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-300">
                <p className="font-semibold mb-1">Two-Step Transfer Process:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Step 1: You initiate the transfer (this form)</li>
                  <li>Step 2: Recipient must accept within 7 days</li>
                  <li>Ownership and state update only when accepted</li>
                  <li>You can cancel pending transfers anytime</li>
                  <li>Recipient can reject unwanted transfers</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
