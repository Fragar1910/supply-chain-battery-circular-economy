'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, AlertCircle, CheckCircle, Flame, Zap, Car as CarIcon, ShieldAlert } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { getAccountsWithAnyRole, canRecordCriticalEvent } from '@/lib/roleConstants';
import { stringToHex } from 'viem';
import { useToast } from '@/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@/components/ui';
import { CONTRACTS } from '@/config/contracts';
import DataVaultABI from '@/lib/contracts/DataVault.json';

interface CriticalEvent {
  bin: string;
  eventType: string;
  severity: string;
  description: string;
  temperature?: string;
  chargeLevel?: string;
  location?: string;
  date: string;
}

interface RecordCriticalEventFormProps {
  initialBin?: string;
  onSuccess?: (bin: string) => void;
  onError?: (error: Error) => void;
}

/**
 * RecordCriticalEventForm - Records critical battery events
 *
 * Captures safety-critical events including:
 * - Overcharges and deep discharges
 * - Overheating incidents
 * - Physical impacts/accidents
 * - BMS failures
 * - Rapid degradation events
 *
 * Access: FLEET_OPERATOR_ROLE, OEM_ROLE, ADMIN_ROLE
 *
 * Records data on-chain via DataVault.recordCriticalEvent()
 */
export function RecordCriticalEventForm({
  initialBin = '',
  onSuccess,
  onError,
}: RecordCriticalEventFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { address: userAddress } = useAccount();
  const [formData, setFormData] = useState<CriticalEvent>({
    bin: initialBin,
    eventType: '',
    severity: '',
    description: '',
    temperature: '',
    chargeLevel: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Partial<CriticalEvent>>({});
  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);

  // Get authorized accounts (Fleet Operator, OEM, or Admin)
  const authorizedAccounts = useMemo(() => getAccountsWithAnyRole(['FLEET_OPERATOR_ROLE', 'OEM_ROLE', 'ADMIN_ROLE']), []);

  // Check if current user is authorized (address-based, no contract calls)
  const isAuthorized = canRecordCriticalEvent(userAddress);

  const matchedAccount = useMemo(() => {
    if (!userAddress) return null;
    return authorizedAccounts.find(
      (account) => account.address.toLowerCase() === userAddress.toLowerCase()
    );
  }, [userAddress, authorizedAccounts]);

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
      const id = toast.transactionPending('Recording critical event...');
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
      toast.transactionSuccess('Critical event recorded!', {
        description: `Battery ${formData.bin} critical event has been logged. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`,
        action: {
          label: 'View Passport',
          onClick: () => router.push(`/passport/${formData.bin}`),
        },
        duration: 10000,
      });
      setToastId(undefined);
      // onSuccess callback removed to prevent navigation to dashboard
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

      toast.transactionError('Failed to record critical event', {
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
        ? 'Transaction reverted. You may not be authorized or the battery may not exist.'
        : confirmError.message.includes('Not authorized')
        ? 'Not authorized to record critical events'
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
      }, 30000);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirming]); // toast, reset removed - stable functions

  const handleChange = (field: keyof CriticalEvent, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<CriticalEvent> = {};

    if (!formData.bin || !/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(formData.bin)) {
      newErrors.bin = 'Valid BIN required (e.g., NV-2024-001234)';
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (!formData.severity) {
      newErrors.severity = 'Severity level is required';
    }

    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      // Convert BIN to bytes32
      const binBytes32 = stringToHex(formData.bin, { size: 32 });

      // Map event type to uint8
      const eventTypeMap: Record<string, number> = {
        'overheating': 0,
        'overcharge': 1,
        'deep-discharge': 2,
        'accident': 3,
        'bms-failure': 4,
        'rapid-degradation': 5,
        'thermal-runaway': 6,
        'other': 7,
      };
      const eventType = eventTypeMap[formData.eventType] ?? 7;

      // Map severity to uint8
      const severityMap: Record<string, number> = {
        'Low': 0,
        'Medium': 1,
        'High': 2,
      };
      const severity = severityMap[formData.severity] ?? 0;

      // Convert temperature to int16 (multiply by 10)
      const temperature = formData.temperature ? Math.round(parseFloat(formData.temperature) * 10) : 0;

      // Convert charge level to uint16 (multiply by 100 for 0-10000 range)
      const chargeLevel = formData.chargeLevel ? Math.round(parseFloat(formData.chargeLevel) * 100) : 0;

      // Convert date to Unix timestamp
      const eventDate = Math.floor(new Date(formData.date).getTime() / 1000);

      writeContract({
        address: CONTRACTS.DataVault.address,
        abi: DataVaultABI.abi,
        functionName: 'recordCriticalEvent',
        args: [
          binBytes32,
          eventType,
          severity,
          formData.description,
          temperature,
          chargeLevel,
          formData.location || '',
          eventDate,
        ],
      });
    } catch (error) {
      console.error('Error submitting critical event:', error);
      onError?.(error as Error);
    }
  };

  const handleReset = () => {
    setFormData({
      bin: '',
      eventType: '',
      severity: '',
      description: '',
      temperature: '',
      chargeLevel: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    reset(); // Reset transaction state to re-enable submit button
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Record Critical Event
        </CardTitle>
        <CardDescription>
          Log safety-critical incidents and anomalies requiring immediate attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Authorization Warning */}
          {userAddress && !isAuthorized && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-orange-400 mb-1">
                  ⚠️ Missing Required Role
                </p>
                <p className="text-sm text-orange-300 mb-2">
                  Your account does not have the required roles. Only <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">FLEET_OPERATOR_ROLE</code>, <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">OEM_ROLE</code>, or <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">ADMIN_ROLE</code> can record critical events.
                </p>
                <p className="text-xs text-orange-200/80 mb-2">
                  <strong>Current account:</strong> {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
                <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
                  <p className="text-xs text-orange-200 font-semibold mb-1">
                    Authorized Accounts:
                  </p>
                  {authorizedAccounts.map((account) => (
                    <div key={account.address} className="text-xs text-orange-100 font-mono">
                      • Account #{account.accountNumber} ({account.name}): {account.address.slice(0, 10)}...{account.address.slice(-6)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-orange-200/70 mt-2">
                  💡 Switch to Account #0 (Admin), #2 (OEM), or #5 (Fleet Operator) in MetaMask
                </p>
              </div>
            </div>
          )}

          {/* Role Confirmation Badge */}
          {userAddress && isAuthorized && matchedAccount && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <div className="flex-1">
                <p className="text-sm text-green-300">
                  ✓ Authorized as <strong>{matchedAccount.name}</strong> ({matchedAccount.description})
                </p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/50">
                {matchedAccount.roles.includes('FLEET_OPERATOR_ROLE') ? 'FLEET_OPERATOR' :
                 matchedAccount.roles.includes('OEM_ROLE') ? 'OEM' : 'ADMIN'}
              </Badge>
            </div>
          )}

          {/* Battery Identification */}
          <div className="space-y-2">
            <Label htmlFor="bin">
              Battery Identification Number (BIN) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bin"
              placeholder="NV-2024-001234"
              value={formData.bin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('bin', e.target.value)}
              className={errors.bin ? 'border-red-500' : ''}
            />
            {errors.bin && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.bin}
              </p>
            )}
          </div>

          {/* Event Type and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">
                Event Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => handleChange('eventType', value)}
              >
                <SelectTrigger className={errors.eventType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overheating">
                    <Flame className="inline h-4 w-4 mr-2" />
                    Overheating
                  </SelectItem>
                  <SelectItem value="overcharge">
                    <Zap className="inline h-4 w-4 mr-2" />
                    Overcharge
                  </SelectItem>
                  <SelectItem value="deep-discharge">
                    Deep Discharge
                  </SelectItem>
                  <SelectItem value="accident">
                    <CarIcon className="inline h-4 w-4 mr-2" />
                    Physical Impact / Accident
                  </SelectItem>
                  <SelectItem value="bms-failure">
                    BMS Failure
                  </SelectItem>
                  <SelectItem value="rapid-degradation">
                    Rapid Degradation
                  </SelectItem>
                  <SelectItem value="thermal-runaway">
                    Thermal Runaway Warning
                  </SelectItem>
                  <SelectItem value="other">
                    Other Critical Event
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.eventType && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.eventType}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">
                Severity Level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleChange('severity', value)}
              >
                <SelectTrigger className={errors.severity ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low - Monitoring Required</SelectItem>
                  <SelectItem value="Medium">Medium - Action Required</SelectItem>
                  <SelectItem value="High">High - Immediate Action</SelectItem>
                </SelectContent>
              </Select>
              {errors.severity && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.severity}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Event Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed description of the critical event, including circumstances, observations, and immediate actions taken..."
              rows={4}
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Additional Event Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature at Event (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="45.5"
                value={formData.temperature}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('temperature', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chargeLevel">Charge Level at Event (%)</Label>
              <Input
                id="chargeLevel"
                type="number"
                min="0"
                max="100"
                placeholder="85"
                value={formData.chargeLevel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('chargeLevel', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Charging Station A, Highway M-25, ..."
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Event Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('date', e.target.value)}
              />
            </div>
          </div>

          {/* Error Display */}
          {writeError && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <div className="text-xs text-red-300">
                  <p className="font-semibold mb-1">Transaction Error:</p>
                  <p>{writeError.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-500">Critical Event Recorded Successfully!</p>
                <p className="text-sm text-green-400 mt-1">
                  Battery {formData.bin} critical event has been logged
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
                    onClick={handleReset}
                  >
                    Record Another Event
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isPending || isConfirming || isSuccess || !isAuthorized}
            >
              {isPending || isConfirming ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2 animate-spin" />
                  {isPending ? 'Confirming...' : 'Recording...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Event Recorded!
                </>
              ) : !isAuthorized ? (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Missing Required Role
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Record Critical Event
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Clear Form
            </Button>
          </div>

          {/* Disabled Button Info */}
          {!isAuthorized && (
            <p className="text-xs text-center text-orange-400">
              ⚠️ Button disabled: Connect with Account #0 (Admin), #2 (OEM), or #5 (Fleet Operator)
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
