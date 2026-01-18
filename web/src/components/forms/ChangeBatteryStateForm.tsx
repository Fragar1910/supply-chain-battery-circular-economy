'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { stringToBytes32 } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { CheckCircle } from 'lucide-react';
import { Input, Button, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Textarea } from '@/components/ui';

interface ChangeBatteryStateFormProps {
  onSuccess?: (bin: string, newState: number) => void;
  onError?: (error: Error) => void;
}

// Battery States enum (must match BatteryRegistry.sol)
enum BatteryState {
  Manufactured = 0,
  Integrated = 1,
  FirstLife = 2,
  SecondLife = 3,
  EndOfLife = 4,
  Recycled = 5,
}

const stateNames: Record<BatteryState, string> = {
  [BatteryState.Manufactured]: 'Manufactured',
  [BatteryState.Integrated]: 'Integrated',
  [BatteryState.FirstLife]: 'First Life',
  [BatteryState.SecondLife]: 'Second Life',
  [BatteryState.EndOfLife]: 'End of Life',
  [BatteryState.Recycled]: 'Recycled',
};

const stateColors: Record<BatteryState, string> = {
  [BatteryState.Manufactured]: 'bg-blue-500',
  [BatteryState.Integrated]: 'bg-cyan-500',
  [BatteryState.FirstLife]: 'bg-green-500',
  [BatteryState.SecondLife]: 'bg-yellow-500',
  [BatteryState.EndOfLife]: 'bg-orange-500',
  [BatteryState.Recycled]: 'bg-slate-500',
};

export function ChangeBatteryStateForm({ onSuccess, onError }: ChangeBatteryStateFormProps) {
  const router = useRouter();
  const [bin, setBin] = useState('');
  const [newState, setNewState] = useState<BatteryState | ''>('');
  const [reason, setReason] = useState('');
  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);

  const toast = useToast();

  // Fetch current battery data
  const { data: batteryData, isLoading: isFetchingBattery, refetch: refetchBattery } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: bin ? [stringToBytes32(bin)] : undefined,
    query: {
      enabled: bin.length > 0,
    },
  });

  // Parse battery state from contract response
  const currentState: BatteryState | null = batteryData ? (batteryData as any)[6] : null;

  // Write contract
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  // Wait for transaction
  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Toast notifications based on transaction status
  useEffect(() => {
    if (isPending && !toastId) {
      const id = toast.transactionPending('Changing battery state...');
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
      toast.transactionSuccess('Battery state changed successfully!', {
        description: `Battery ${bin} state updated to ${newState !== '' ? stateNames[newState] : ''}. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${bin}`),
        },
        duration: 10000,
      });
      setToastId(undefined);
      onSuccess?.(bin, newState as number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, toastId, bin, newState, hash]); // toast, router, onSuccess, refetchBattery removed - stable functions

  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);
      const errorMsg = writeError.message.includes('User rejected')
        ? 'Transaction rejected by user'
        : writeError.message.includes('insufficient funds')
        ? 'Insufficient funds for transaction'
        : writeError.message;

      toast.transactionError('Failed to change state', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
      onError?.(writeError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, toastId]); // toast, reset, onError removed - stable functions

  useEffect(() => {
    if (confirmError && toastId) {
      toast.dismiss(toastId);
      const errorMsg = confirmError.message.includes('reverted')
        ? 'Transaction reverted. You may not be authorized or the state is invalid.'
        : confirmError.message.includes('Only operator')
        ? 'Only OPERATOR_ROLE or ADMIN_ROLE can change battery state'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bin || newState === '' || currentState === null) {
      toast.error('Please fill all required fields and fetch battery data first');
      return;
    }

    if (newState === currentState) {
      toast.error('New state must be different from current state');
      return;
    }

    const binBytes32 = stringToBytes32(bin);

    writeContract({
      address: CONTRACTS.BatteryRegistry.address,
      abi: CONTRACTS.BatteryRegistry.abi,
      functionName: 'changeBatteryState',
      args: [binBytes32, newState],
    });
  };

  const handleFetchBattery = () => {
    if (bin.length > 0) {
      refetchBattery();
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Change Battery State</CardTitle>
        <CardDescription>
          Manually change the lifecycle state of a battery (for corrections or testing)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BIN Input with Fetch Button */}
          <div className="space-y-2">
            <Label htmlFor="bin" className="text-white">
              Battery ID (BIN) *
            </Label>
            <div className="flex gap-2">
              <Input
                id="bin"
                value={bin}
                onChange={(e) => setBin(e.target.value.toUpperCase())}
                placeholder="NV-2024-001234"
                required
                className="bg-slate-800 border-slate-700 text-white flex-1"
              />
              <Button
                type="button"
                onClick={handleFetchBattery}
                disabled={!bin || isFetchingBattery}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isFetchingBattery ? 'Fetching...' : 'Fetch Data'}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Enter the Battery Identification Number and click Fetch Data
            </p>
          </div>

          {/* Current State Display */}
          {currentState !== null && (
            <div className="space-y-2">
              <Label className="text-white">Current State</Label>
              <div className="flex items-center gap-2">
                <Badge className={`${stateColors[currentState]} text-white`}>
                  {stateNames[currentState]}
                </Badge>
                <span className="text-sm text-slate-400">
                  (State #{currentState})
                </span>
              </div>
            </div>
          )}

          {/* New State Selector */}
          <div className="space-y-2">
            <Label htmlFor="newState" className="text-white">
              New State *
            </Label>
            <Select
              value={newState.toString()}
              onValueChange={(value) => setNewState(parseInt(value) as BatteryState)}
              disabled={currentState === null}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select new state" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stateNames).map(([value, name]) => {
                  const stateValue = parseInt(value) as BatteryState;
                  const isCurrentState = stateValue === currentState;
                  return (
                    <SelectItem
                      key={value}
                      value={value}
                      disabled={isCurrentState}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stateColors[stateValue]}`} />
                        {name}
                        {isCurrentState && ' (Current)'}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              Select the new lifecycle state for the battery
            </p>
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">
              Reason for Change (Optional)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Manual correction due to data error, Testing lifecycle transitions, etc."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
            <p className="text-xs text-slate-400">
              Provide a reason for this manual state change (for audit trail)
            </p>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-500">
                  Battery State Changed Successfully!
                </p>
                <p className="text-sm text-green-400 mt-1">
                  Battery {bin} state updated to {newState !== '' ? stateNames[newState] : ''}
                </p>
                <p className="text-xs text-green-300 mt-1">
                  Transaction hash: {hash?.slice(0, 10)}...{hash?.slice(-8)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/passport/${bin}`)}
                    className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                  >
                    View Passport
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBin('');
                      setNewState('');
                      setReason('');
                      reset();
                      refetchBattery();
                    }}
                  >
                    Change Another State
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || isConfirming || isSuccess || !bin || newState === '' || currentState === null}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : isSuccess ? 'State Changed!' : 'Change State'}
          </Button>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <strong>ℹ️ Note:</strong> This operation requires OPERATOR_ROLE or ADMIN_ROLE. The state change is immediate and permanent on the blockchain.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
