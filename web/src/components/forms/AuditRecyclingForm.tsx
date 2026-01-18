'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { stringToBytes32 } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { Input, Button, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, RadioGroup, RadioGroupItem, Textarea, Badge } from '@/components/ui';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AuditRecyclingFormProps {
  onSuccess?: (bin: string, approved: boolean) => void;
  onError?: (error: Error) => void;
}

export function AuditRecyclingForm({ onSuccess, onError }: AuditRecyclingFormProps) {
  const router = useRouter();
  const [bin, setBin] = useState('');
  const [approved, setApproved] = useState<'approved' | 'rejected' | ''>('');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditor, setAuditor] = useState('');
  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);

  const toast = useToast();

  // Fetch recycling data
  const { data: recyclingData, isLoading: isFetchingRecycling, refetch: refetchRecycling } = useReadContract({
    address: CONTRACTS.RecyclingManager.address,
    abi: CONTRACTS.RecyclingManager.abi,
    functionName: 'getRecyclingData',
    args: bin ? [stringToBytes32(bin)] : undefined,
    query: {
      enabled: bin.length > 0,
    },
  });

  // Fetch battery data to show current state
  const { data: batteryData } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: bin ? [stringToBytes32(bin)] : undefined,
    query: {
      enabled: bin.length > 0,
    },
  });

  // Parse recycling data
  // Wagmi returns structs as objects with named properties, not arrays
  const recyclingInfo = recyclingData ? {
    bin: (recyclingData as any).bin as string,
    status: Number((recyclingData as any).status || 0),
    methodId: Number((recyclingData as any).method || 0),
    recycler: (recyclingData as any).recycler as string,
    receivedDate: typeof (recyclingData as any).receivedDate === 'bigint'
      ? Number((recyclingData as any).receivedDate)
      : Number((recyclingData as any).receivedDate || 0),
    completionDate: typeof (recyclingData as any).completionDate === 'bigint'
      ? Number((recyclingData as any).completionDate)
      : Number((recyclingData as any).completionDate || 0),
    totalInputWeightKg: Number((recyclingData as any).totalInputWeightKg || 0),
    totalRecoveredWeightKg: Number((recyclingData as any).totalRecoveredWeightKg || 0),
    overallRecoveryRate: Number((recyclingData as any).overallRecoveryRate || 0),
    facilityHash: (recyclingData as any).facilityHash as string,
    processHash: (recyclingData as any).processHash as string,
    isAudited: (recyclingData as any).isAudited as boolean,
  } : null;

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development' && recyclingInfo) {
    console.log('🔍 RecyclingInfo:', {
      bin: recyclingInfo.bin,
      recycler: recyclingInfo.recycler,
      receivedDate: recyclingInfo.receivedDate,
      isRecycled: recyclingInfo.receivedDate > 0,
    });
  }

  // Check if battery has actually been recycled and is ready for audit
  // Status must be 5 (Completed) to match contract requirement
  // Contract auditRecycling() has: require(data.status == RecyclingStatus.Completed, ...)
  // Status 6 = Already audited (cannot audit again)
  const isActuallyRecycled = recyclingInfo && recyclingInfo.receivedDate > 0 && recyclingInfo.status === 5;

  // Parse battery state
  const batteryState = batteryData ? Number((batteryData as any)[6]) : null;

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
      const id = toast.transactionPending('Submitting audit...');
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
      toast.transactionSuccess('Recycling audit submitted successfully!', {
        description: `Battery ${bin} recycling ${approved === 'approved' ? 'approved' : 'rejected'}. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${bin}`),
        },
        duration: 10000,
      });
      setToastId(undefined);
      onSuccess?.(bin, approved === 'approved');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, toastId, bin, approved, hash]); // toast, router, onSuccess, refetchRecycling removed - stable functions

  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);
      const errorMsg = writeError.message.includes('User rejected')
        ? 'Transaction rejected by user'
        : writeError.message.includes('insufficient funds')
        ? 'Insufficient funds for transaction'
        : writeError.message;

      toast.transactionError('Failed to submit audit', {
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
        ? 'Transaction reverted. Battery may not be recycled or already audited.'
        : confirmError.message.includes('Only auditor')
        ? 'Only AUDITOR_ROLE can audit recycling'
        : confirmError.message;

      toast.transactionError('Transaction confirmation failed', {
        description: errorMsg,
      });
      setToastId(undefined);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmError, toastId]); // toast, reset removed - stable functions

  // Timeout safety net
  useEffect(() => {
    if (isConfirming) {
      const timeoutId = setTimeout(() => {
        toast.dismiss(toastId);
        toast.transactionError('Transaction timeout', {
          description: 'Transaction is taking too long. Please check your wallet or try again.',
        });
        setToastId(undefined);
        reset();
      }, 30000);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirming]); // toast, reset removed - stable functions

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bin || approved === '' || !recyclingInfo) {
      toast.error('Please fill all required fields and fetch recycling data first');
      return;
    }

    if (approved === 'rejected' && !auditNotes.trim()) {
      toast.error('Audit notes are required when rejecting');
      return;
    }

    if (recyclingInfo.isAudited) {
      toast.error('This battery has already been audited');
      return;
    }

    // Check RecyclingManager status (must be Completed = 5)
    if (recyclingInfo.status !== 5) {
      toast.error('Battery recycling must be completed before audit (current status: ' + ['Not Started', 'Received', 'Disassembled', 'Materials Sorted', 'Processing', 'Completed', 'Audited'][recyclingInfo.status] + ')');
      return;
    }

    const binBytes32 = stringToBytes32(bin);
    const isApproved = approved === 'approved';

    console.log('🎯 Submitting audit for', bin);
    console.log('Approved:', isApproved);
    console.log('Recycling status:', recyclingInfo.status);

    writeContract({
      address: CONTRACTS.RecyclingManager.address,
      abi: CONTRACTS.RecyclingManager.abi,
      functionName: 'auditRecycling',
      args: [binBytes32, isApproved],
    });
  };

  const handleFetchRecycling = () => {
    if (bin.length > 0) {
      refetchRecycling();
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Audit Recycling Process</CardTitle>
        <CardDescription>
          Review and approve/reject battery recycling process
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
                onClick={handleFetchRecycling}
                disabled={!bin || isFetchingRecycling}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isFetchingRecycling ? 'Fetching...' : 'Fetch Data'}
              </Button>
            </div>
          </div>

          {/* Not Recycled / Not Completed Warning */}
          {recyclingInfo && !isActuallyRecycled && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {recyclingInfo.receivedDate > 0 ? (
                    <>
                      <p className="font-semibold text-yellow-500">Recycling In Progress</p>
                      <p className="text-sm text-yellow-400 mt-1">
                        This battery is currently being recycled (Status: {['NotStarted', 'Received', 'Disassembled', 'MaterialsSorted', 'Processing', 'Completed', 'Audited'][recyclingInfo.status]}).
                      </p>
                      <p className="text-xs text-yellow-300 mt-2">
                        The recycling process must be completed before it can be audited. Current status needs to be "Completed".
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-red-500">Battery Not Recycled</p>
                      <p className="text-sm text-red-400 mt-1">
                        This battery has not been recycled yet. No recycling data is available.
                      </p>
                      <p className="text-xs text-red-300 mt-2">
                        The battery must be recycled using the RecycleBatteryForm before it can be audited.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recycling Data Display */}
          {recyclingInfo && isActuallyRecycled && (
            <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-white">Recycling Information</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Recycler:</span>
                  <p className="text-white font-mono text-xs mt-1">
                    {recyclingInfo.recycler && recyclingInfo.recycler.length >= 18
                      ? `${recyclingInfo.recycler.slice(0, 10)}...${recyclingInfo.recycler.slice(-8)}`
                      : recyclingInfo.recycler || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Received Date:</span>
                  <p className="text-white mt-1">
                    {recyclingInfo.receivedDate && recyclingInfo.receivedDate > 0
                      ? new Date(recyclingInfo.receivedDate * 1000).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Recycling Method:</span>
                  <p className="text-white mt-1">
                    {recyclingInfo.methodId !== null && recyclingInfo.methodId !== undefined
                      ? ['Pyrometallurgical', 'Hydrometallurgical', 'Direct Recycling', 'Hybrid'][recyclingInfo.methodId] || `Method ${recyclingInfo.methodId}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <div className="mt-1">
                    {recyclingInfo.status === 6 ? (
                      <Badge variant="success">Audited</Badge>
                    ) : recyclingInfo.status === 5 ? (
                      <Badge variant="default">Completed (Ready for Audit)</Badge>
                    ) : (
                      <Badge variant="warning">
                        {['Not Started', 'Received', 'Disassembled', 'Materials Sorted', 'Processing', 'Completed', 'Audited'][recyclingInfo.status] || 'In Progress'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Material Recovery Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-sm">Input Weight:</span>
                  <p className="text-white mt-1">{recyclingInfo.totalInputWeightKg} kg</p>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Recovered Weight:</span>
                  <p className="text-white mt-1">{recyclingInfo.totalRecoveredWeightKg} kg</p>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Recovery Rate:</span>
                  <p className="text-white mt-1">{(recyclingInfo.overallRecoveryRate / 100).toFixed(2)}%</p>
                </div>
              </div>

              {recyclingInfo.isAudited && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <p className="text-sm text-yellow-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    This battery has already been audited
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Approval Decision */}
          <div className="space-y-3">
            <Label className="text-white">Audit Decision *</Label>
            <RadioGroup value={approved} onValueChange={(value: string) => setApproved(value as 'approved' | 'rejected')}>
              <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="flex items-center gap-2 cursor-pointer text-white flex-1">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div>
                    <div className="font-medium">Approve</div>
                    <div className="text-xs text-slate-400">Recycling process meets standards</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer text-white flex-1">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <div className="font-medium">Reject</div>
                    <div className="text-xs text-slate-400">Recycling process does not meet standards</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Audit Notes */}
          <div className="space-y-2">
            <Label htmlFor="auditNotes" className="text-white">
              Audit Notes {approved === 'rejected' && '*'}
            </Label>
            <Textarea
              id="auditNotes"
              value={auditNotes}
              onChange={(e) => setAuditNotes(e.target.value)}
              placeholder="Enter detailed audit findings, observations, or reasons for rejection..."
              required={approved === 'rejected'}
              className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
            />
            <p className="text-xs text-slate-400">
              {approved === 'rejected'
                ? 'Required when rejecting - explain why the recycling does not meet standards'
                : 'Optional - provide additional context or observations'}
            </p>
          </div>

          {/* Auditor Name */}
          <div className="space-y-2">
            <Label htmlFor="auditor" className="text-white">
              Auditor Name (Optional)
            </Label>
            <Input
              id="auditor"
              value={auditor}
              onChange={(e) => setAuditor(e.target.value)}
              placeholder="e.g., John Smith, Certified Environmental Auditor"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-400">
              Your name or certification details for record keeping
            </p>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-500">Audit Submitted Successfully!</p>
                <p className="text-sm text-green-400 mt-1">
                  Battery {bin} recycling has been {approved === 'approved' ? 'approved' : 'rejected'}
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
                      setApproved('');
                      setAuditNotes('');
                      setAuditor('');
                      reset();
                      refetchRecycling();
                    }}
                  >
                    Audit Another Battery
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || isConfirming || isSuccess || !bin || approved === '' || !recyclingInfo || !isActuallyRecycled || recyclingInfo.isAudited}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : isSuccess ? 'Audit Submitted!' : !isActuallyRecycled ? 'Battery Not Recycled' : 'Submit Audit'}
          </Button>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <strong>ℹ️ Note:</strong> This operation requires AUDITOR_ROLE. The audit decision is permanent on the blockchain.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
