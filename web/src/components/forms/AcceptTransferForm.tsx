'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract
} from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { useToast } from '@/hooks';
import { binToBytes32 } from '@/lib/binUtils';
import { AlertCircle, CheckCircle, Loader2, Check, X, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@/components/ui';

interface AcceptTransferFormProps {
  initialBin?: string;
  onSuccess?: (bin: string) => void;
  onError?: (error: Error) => void;
}

// Battery state enum mapping
const BATTERY_STATE_NAMES: Record<number, string> = {
  0: 'Manufactured',
  1: 'Integrated',
  2: 'FirstLife',
  3: 'SecondLife',
  4: 'EndOfLife',
  5: 'Recycled',
};

export function AcceptTransferForm({
  initialBin = '',
  onSuccess,
  onError,
}: AcceptTransferFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { address: currentAddress } = useAccount();
  const [bin, setBin] = useState(initialBin);
  const [binError, setBinError] = useState('');
  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);

  const binBytes32 = binToBytes32(bin);

  // Read pending transfer data
  const { data: pendingTransfer, refetch: refetchPending } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getPendingTransfer',
    args: [binBytes32],
    query: {
      enabled: !!bin && bin.length > 0,
    },
  });

  // Write contract hooks
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset
  } = useWriteContract();

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

  const validateBin = (): boolean => {
    if (!bin.trim()) {
      setBinError('BIN is required');
      return false;
    }
    if (!/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(bin)) {
      setBinError('Invalid BIN format (e.g., NV-2024-001234)');
      return false;
    }
    setBinError('');
    return true;
  };

  const handleAccept = async () => {
    if (!validateBin()) return;

    setAction('accept');
    try {
      writeContract({
        address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
        abi: CONTRACTS.BatteryRegistry.abi,
        functionName: 'acceptTransfer',
        args: [binBytes32] as any,
      });
    } catch (error) {
      console.error('Error accepting transfer:', error);
      if (onError) onError(error as Error);
    }
  };

  const handleReject = async () => {
    if (!validateBin()) return;

    setAction('reject');
    try {
      writeContract({
        address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
        abi: CONTRACTS.BatteryRegistry.abi,
        functionName: 'rejectTransfer',
        args: [binBytes32] as any,
      });
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      if (onError) onError(error as Error);
    }
  };

  // Toast notifications
  useEffect(() => {
    if (isPending && !toastId) {
      const msg = action === 'accept' ? 'Accepting transfer...' : 'Rejecting transfer...';
      const id = toast.transactionPending(msg);
      setToastId(id);
    }
  }, [isPending, toastId, action]); // toast removed - stable function

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
      const msg = action === 'accept'
        ? 'Transfer accepted successfully!'
        : 'Transfer rejected successfully!';
      const desc = action === 'accept'
        ? `You are now the owner of battery ${bin}. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`
        : `Transfer of battery ${bin} has been rejected. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`;

      toast.transactionSuccess(msg, {
        description: desc,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${bin}`),
        },
        duration: 10000,
      });
      setToastId(undefined);
      onSuccess?.(bin);
      refetchPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, toastId, bin, action, hash]); // toast, onSuccess, router, refetchPending removed - stable functions

  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);
      const errorMsg = writeError.message.includes('User rejected')
        ? 'Transaction rejected by user'
        : writeError.message.includes('No active transfer')
        ? 'No pending transfer found for this battery'
        : writeError.message.includes('Not the recipient')
        ? 'You are not the recipient of this transfer'
        : writeError.message;

      toast.transactionError(`Failed to ${action} transfer`, {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
      onError?.(writeError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, toastId, action]); // toast, reset, onError removed - stable functions

  useEffect(() => {
    if (confirmError && toastId) {
      toast.dismiss(toastId);
      const errorMsg = confirmError.message.includes('reverted')
        ? 'Transaction reverted. No pending transfer found or you are not the recipient.'
        : confirmError.message.includes('Not authorized')
        ? 'Not authorized to perform this action'
        : confirmError.message.includes('Transfer expired')
        ? 'Transfer has expired (7 days limit)'
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

  // Parse pending transfer data
  const transfer = pendingTransfer as any;
  const hasPendingTransfer = transfer && transfer.isActive;
  const isRecipient = hasPendingTransfer && transfer.to?.toLowerCase() === currentAddress?.toLowerCase();

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!hasPendingTransfer) return '';
    const initiatedAt = Number(transfer.initiatedAt);
    const expirationTime = initiatedAt + (7 * 24 * 60 * 60); // 7 days
    const now = Math.floor(Date.now() / 1000);
    const remaining = expirationTime - now;

    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));

    return `${days}d ${hours}h remaining`;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle>Accept or Reject Transfer</CardTitle>
        <CardDescription>
          View and respond to pending battery transfers sent to you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* BIN Input */}
          <div className="space-y-2">
            <Label htmlFor="bin">
              Battery ID (BIN) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bin"
              placeholder="NV-2024-001234"
              value={bin}
              onChange={(e) => {
                setBin(e.target.value);
                setBinError('');
              }}
              className={binError ? 'border-red-500' : ''}
            />
            {binError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {binError}
              </p>
            )}
          </div>

          {/* Current User Info */}
          {currentAddress && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Your Address:</p>
              <p className="text-sm font-mono text-white">{currentAddress}</p>
            </div>
          )}

          {/* Pending Transfer Info */}
          {bin && !binError && (
            <>
              {!hasPendingTransfer ? (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-400 text-center">
                    No pending transfer found for this battery
                  </p>
                </div>
              ) : !isRecipient ? (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-500">Not the Recipient</p>
                      <p className="text-sm text-yellow-400 mt-1">
                        This transfer is intended for{' '}
                        {transfer.to?.slice(0, 6)}...{transfer.to?.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-blue-400">Pending Transfer Details</p>
                      <div className="flex items-center gap-1 text-xs text-blue-300">
                        <Clock className="h-3 w-3" />
                        {getTimeRemaining()}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">From:</span>
                        <span className="font-mono text-white">
                          {transfer.from?.slice(0, 6)}...{transfer.from?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">To:</span>
                        <span className="font-mono text-white">You</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">New State:</span>
                        <span className="text-white">
                          {BATTERY_STATE_NAMES[Number(transfer.newState)] || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Initiated:</span>
                        <span className="text-white">
                          {new Date(Number(transfer.initiatedAt) * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={handleAccept}
                      disabled={isPending || isConfirming || isSuccess}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isPending && action === 'accept' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Accepting...
                        </>
                      ) : isSuccess && action === 'accept' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accepted!
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Accept Transfer
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReject}
                      disabled={isPending || isConfirming || isSuccess}
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      {isPending && action === 'reject' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Rejecting...
                        </>
                      ) : isSuccess && action === 'reject' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Rejected!
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Reject Transfer
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-500">
                  {action === 'accept' ? 'Transfer Accepted!' : 'Transfer Rejected!'}
                </p>
                <p className="text-sm text-green-400 mt-1">
                  {action === 'accept'
                    ? `You are now the owner of battery ${bin}. The battery state has been updated.`
                    : `The transfer request for battery ${bin} has been rejected.`
                  }
                </p>
                <p className="text-xs text-green-300 mt-1">
                  Transaction hash: {hash?.slice(0, 10)}...{hash?.slice(-8)}
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/passport/${bin}`)}
                    className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                  >
                    View Passport
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-300">
                <p className="font-semibold mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You can only accept transfers sent to your address</li>
                  <li>Accepting updates ownership and battery state</li>
                  <li>Rejecting cancels the transfer permanently</li>
                  <li>Transfers expire after 7 days if not accepted</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
