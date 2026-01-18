'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';
import { useToast } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, LeafyGreen, ExternalLink } from 'lucide-react';

const LIFECYCLE_PHASES = [
  { value: '0', label: 'Raw Material Extraction', description: 'Mining and processing of lithium, cobalt, nickel' },
  { value: '1', label: 'Manufacturing', description: 'Cell production, module assembly, pack integration' },
  { value: '2', label: 'Transportation', description: 'International shipping and logistics' },
  { value: '3', label: 'First Life Usage', description: 'Operation in vehicle, charging emissions' },
  { value: '4', label: 'Second Life Usage', description: 'Repurposed applications, stationary storage' },
  { value: '5', label: 'Recycling', description: 'End-of-life processing, material recovery' },
];

export function AddCarbonEmissionForm() {
  const toast = useToast();
  const [bin, setBin] = useState('NV-2024-001234');
  const [phase, setPhase] = useState('1'); // Manufacturing by default
  const [kgCO2e, setKgCO2e] = useState('3400');
  const [description, setDescription] = useState('Carbon emissions from battery cell production and module assembly');
  const [evidenceHash, setEvidenceHash] = useState('');
  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);

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
      const id = toast.transactionPending('Recording carbon emission...');
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
      toast.transactionSuccess('Carbon emission recorded successfully!', {
        description: `${kgCO2e} kg CO₂e added to battery ${bin}`,
      });
      setToastId(undefined);
      confirmingToastShown.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, toastId, bin, kgCO2e]); // toast removed - stable function

  // Toast for write error
  useEffect(() => {
    if (writeError && toastId) {
      toast.dismiss(toastId);

      let errorMsg = writeError.message;

      if (writeError.message.includes('User rejected')) {
        errorMsg = 'Transaction rejected by user';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction';
      } else if (writeError.message.includes('Battery does not exist')) {
        errorMsg = 'Battery not found. Please verify the BIN.';
      } else if (writeError.message.includes('Emission must be positive')) {
        errorMsg = 'Emission amount must be greater than 0.';
      } else if (writeError.message.includes('exceeds maximum')) {
        errorMsg = 'Emission amount exceeds the maximum allowed (100,000 kg CO₂e).';
      } else if (writeError.message.includes('AccessControl') || writeError.message.toLowerCase().includes('auditor')) {
        errorMsg = 'Not authorized. Only accounts with AUDITOR_ROLE can record emissions. Please connect with the Auditor account (Account #6).';
      }

      toast.transactionError('Failed to record emission', {
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
        errorMsg = 'Transaction reverted. You may not be authorized or there may be a validation error.';
      } else if (confirmError.message.toLowerCase().includes('accesscontrol') || confirmError.message.toLowerCase().includes('auditor')) {
        errorMsg = 'Access denied: Only accounts with AUDITOR_ROLE can record emissions. Please connect with the Auditor account (Account #6).';
      } else if (confirmError.message.includes('Battery does not exist')) {
        errorMsg = 'Battery not found. Please verify the BIN.';
      } else if (confirmError.message.includes('Emission must be positive')) {
        errorMsg = 'Emission amount must be greater than 0.';
      } else if (confirmError.message.includes('exceeds maximum')) {
        errorMsg = 'Emission amount exceeds the maximum allowed (100,000 kg CO₂e).';
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

    if (!bin || !phase || !kgCO2e) {
      alert('Please fill in all required fields');
      return;
    }

    const kgCO2eNumber = parseFloat(kgCO2e);
    if (isNaN(kgCO2eNumber) || kgCO2eNumber <= 0) {
      alert('Please enter a valid emission amount');
      return;
    }

    if (kgCO2eNumber > 100000) {
      alert('Emission amount exceeds maximum allowed (100,000 kg CO₂e)');
      return;
    }

    try {
      const binBytes32 = binToBytes32(bin);

      // Handle evidence hash properly - must be a valid bytes32 (0x + 64 hex chars)
      let evidenceBytes32: `0x${string}`;
      if (evidenceHash && evidenceHash.trim().length > 0) {
        // If it starts with 'Qm' it's an IPFS CID, convert to bytes32
        if (evidenceHash.startsWith('Qm')) {
          // Convert IPFS CID string to hex bytes
          const encoder = new TextEncoder();
          const bytes = encoder.encode(evidenceHash.slice(0, 32)); // Take first 32 chars
          const hexString = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .padEnd(64, '0'); // Pad to 32 bytes (64 hex chars)
          evidenceBytes32 = ('0x' + hexString) as `0x${string}`;
        } else if (evidenceHash.startsWith('0x')) {
          // It's already hex, ensure it's 32 bytes
          const hexOnly = evidenceHash.slice(2); // Remove 0x
          evidenceBytes32 = ('0x' + hexOnly.padEnd(64, '0').slice(0, 64)) as `0x${string}`;
        } else {
          // Convert any string to hex
          const encoder = new TextEncoder();
          const bytes = encoder.encode(evidenceHash.slice(0, 32));
          const hexString = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .padEnd(64, '0');
          evidenceBytes32 = ('0x' + hexString) as `0x${string}`;
        }
      } else {
        // Empty hash
        evidenceBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
      }

      writeContract({
        address: CONTRACTS.CarbonFootprint.address as `0x${string}`,
        abi: CONTRACTS.CarbonFootprint.abi,
        functionName: 'addEmission',
        args: [
          binBytes32,
          parseInt(phase),
          BigInt(Math.floor(kgCO2eNumber)),
          evidenceBytes32,
          description || 'Carbon emission recorded'
        ],
      });
    } catch (error) {
      console.error('Error submitting emission:', error);
    }
  };

  const resetForm = () => {
    setBin('');
    setPhase('');
    setKgCO2e('');
    setDescription('');
    setEvidenceHash('');
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <LeafyGreen className="h-5 w-5 text-green-500" />
          <CardTitle>Record Carbon Emission</CardTitle>
        </div>
        <CardDescription>
          Add CO₂ emissions data for a specific battery lifecycle phase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* BIN Input */}
          <div className="space-y-2">
            <Label htmlFor="bin">Battery Identification Number (BIN) *</Label>
            <Input
              id="bin"
              placeholder="BAT001NMC2024..."
              value={bin}
              onChange={(e) => setBin(e.target.value)}
              required
              className="bg-slate-800/50 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              Enter the unique battery identifier
            </p>
          </div>

          {/* Lifecycle Phase */}
          <div className="space-y-2">
            <Label htmlFor="phase">Lifecycle Phase *</Label>
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Select lifecycle phase" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {LIFECYCLE_PHASES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.label}</span>
                      <span className="text-xs text-slate-400">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Emission Amount */}
          <div className="space-y-2">
            <Label htmlFor="kgCO2e">Emission Amount (kg CO₂e) *</Label>
            <Input
              id="kgCO2e"
              type="number"
              step="0.01"
              min="0"
              max="100000"
              placeholder="5600"
              value={kgCO2e}
              onChange={(e) => setKgCO2e(e.target.value)}
              required
              className="bg-slate-800/50 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              Maximum: 100,000 kg CO₂e per entry
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Manufacturing emissions from cell production at Factory XYZ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-slate-800/50 border-slate-700"
            />
          </div>

          {/* Evidence Hash (IPFS) */}
          <div className="space-y-2">
            <Label htmlFor="evidenceHash">Evidence Hash (IPFS CID)</Label>
            <Input
              id="evidenceHash"
              placeholder="QmX... (optional)"
              value={evidenceHash}
              onChange={(e) => setEvidenceHash(e.target.value)}
              className="bg-slate-800/50 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              IPFS hash of supporting documentation (certificates, reports, etc.)
            </p>
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
                      {writeError.message.includes('Battery does not exist')
                        ? 'Battery not found. Please verify the BIN.'
                        : writeError.message.includes('Emission must be positive')
                        ? 'Emission amount must be greater than 0.'
                        : writeError.message.includes('exceeds maximum')
                        ? 'Emission amount exceeds the maximum allowed (100,000 kg CO₂e).'
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
                          Recorded
                        </Badge>
                      </div>
                      <p className="text-sm text-green-400 mt-1">
                        Carbon emission recorded successfully for battery {bin}
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
                'Record Emission'
              )}
            </Button>
            {isConfirmed && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Add Another
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-slate-400">
        <p>
          Note: You must have the Carbon Auditor role to record emissions. All transactions are
          recorded immutably on the blockchain.
        </p>
      </CardFooter>
    </Card>
  );
}
