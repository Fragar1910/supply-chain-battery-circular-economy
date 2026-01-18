'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Activity, Gauge, Thermometer, Zap, Battery as BatteryIcon, CheckCircle, ShieldAlert } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { getAccountsWithAnyRole, canUpdateTelemetry } from '@/lib/roleConstants';
import { stringToHex, parseUnits } from 'viem';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@/components/ui';
import { CONTRACTS } from '@/config/contracts';
import DataVaultABI from '@/lib/contracts/DataVault.json';

interface UpdateTelemetryFormProps {
  initialBin?: string;
  onSuccess?: (bin: string) => void;
  onError?: (error: Error) => void;
}

/**
 * UpdateTelemetryForm - Records battery telemetry data for Fleet Operators and OEMs
 *
 * This form captures real-time usage data including:
 * - State of Health (SOH) and State of Charge (SOC)
 * - Charge/discharge cycles
 * - Mileage
 * - Temperature metrics
 * - Depth of discharge (DoD)
 * - Charge rate (C-rate)
 *
 * Access: FLEET_OPERATOR_ROLE, OEM_ROLE, ADMIN_ROLE
 *
 * Records data on-chain via DataVault.recordTelemetry()
 */
export function UpdateTelemetryForm({
  initialBin = '',
  onSuccess,
  onError,
}: UpdateTelemetryFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { address: userAddress } = useAccount();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState({
    bin: initialBin,
    soh: '',
    soc: '',
    mileage: '',
    chargeCycles: '',
    avgTemperature: '',
    maxTemperature: '',
    depthOfDischarge: '',
    chargeRate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastId, setToastId] = useState<string | number | undefined>();
  const confirmingToastShown = useRef(false);

  // Get authorized accounts (Fleet Operator, OEM, or Admin)
  const authorizedAccounts = useMemo(() => getAccountsWithAnyRole(['FLEET_OPERATOR_ROLE', 'OEM_ROLE', 'ADMIN_ROLE']), []);

  // Check if current user is authorized (address-based, no contract calls)
  const isAuthorized = canUpdateTelemetry(userAddress);

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
      const id = toast.transactionPending('Recording telemetry data...');
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
      toast.transactionSuccess('Telemetry data recorded!', {
        description: `Battery ${formData.bin} telemetry has been updated. Tx: ${hash?.slice(0, 10)}...${hash?.slice(-8)}`,
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

      toast.transactionError('Failed to record telemetry', {
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
        ? 'Not authorized to update telemetry'
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bin || !/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i.test(formData.bin)) {
      newErrors.bin = 'Valid BIN required (e.g., NV-2024-001234)';
    }

    if (!formData.soh || parseFloat(formData.soh) < 0 || parseFloat(formData.soh) > 100) {
      newErrors.soh = 'SOH must be between 0 and 100';
    }

    if (!formData.soc || parseFloat(formData.soc) < 0 || parseFloat(formData.soc) > 100) {
      newErrors.soc = 'SOC must be between 0 and 100';
    }

    if (!formData.mileage || parseFloat(formData.mileage) < 0) {
      newErrors.mileage = 'Mileage must be positive';
    }

    if (!formData.chargeCycles || parseFloat(formData.chargeCycles) < 0) {
      newErrors.chargeCycles = 'Charge cycles must be positive';
    }

    if (!formData.avgTemperature) {
      newErrors.avgTemperature = 'Average temperature is required';
    }

    if (!formData.maxTemperature) {
      newErrors.maxTemperature = 'Max temperature is required';
    }

    if (!formData.depthOfDischarge || parseFloat(formData.depthOfDischarge) < 0 || parseFloat(formData.depthOfDischarge) > 100) {
      newErrors.depthOfDischarge = 'DoD must be between 0 and 100';
    }

    if (!formData.chargeRate) {
      newErrors.chargeRate = 'Charge rate is required';
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

      // Convert values to contract format
      // SOH, SOC, DoD: multiply by 100 to get 0-10000 range
      const soc = Math.round(parseFloat(formData.soc) * 100);
      const soh = Math.round(parseFloat(formData.soh) * 100);
      const mileage = Math.round(parseFloat(formData.mileage));
      const chargeCycles = Math.round(parseFloat(formData.chargeCycles));
      // Temperatures: multiply by 10 for precision
      const avgTemperature = Math.round(parseFloat(formData.avgTemperature) * 10);
      const maxTemperature = Math.round(parseFloat(formData.maxTemperature) * 10);
      const depthOfDischarge = Math.round(parseFloat(formData.depthOfDischarge) * 100);
      // Charge rate: multiply by 100 (e.g., 1.5C -> 150)
      const chargeRate = Math.round(parseFloat(formData.chargeRate) * 100);

      writeContract({
        address: CONTRACTS.DataVault.address,
        abi: DataVaultABI.abi,
        functionName: 'recordTelemetry',
        args: [
          binBytes32,
          soc,
          soh,
          mileage,
          chargeCycles,
          avgTemperature,
          maxTemperature,
          depthOfDischarge,
          chargeRate,
        ],
      });
    } catch (error) {
      console.error('Error submitting telemetry:', error);
      onError?.(error as Error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            Update Battery Telemetry
          </CardTitle>
          <CardDescription>
            Record usage data and operational metrics for fleet batteries
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
                    Your account does not have the required roles. Only <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">FLEET_OPERATOR_ROLE</code>, <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">OEM_ROLE</code>, or <code className="px-1 py-0.5 bg-orange-500/20 rounded text-orange-200">ADMIN_ROLE</code> can update telemetry.
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

            {/* Primary Telemetry */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BatteryIcon className="h-4 w-4 text-amber-500" />
                Primary Metrics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bin">
                    Battery Identification Number (BIN) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bin"
                    placeholder="NV-2024-001234"
                    value={formData.bin}
                    onChange={(e) => handleChange('bin', e.target.value)}
                    className={errors.bin ? 'border-red-500' : ''}
                  />
                  {errors.bin && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bin}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soh">
                    State of Health (SOH) % <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="soh"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="85.5"
                    value={formData.soh}
                    onChange={(e) => handleChange('soh', e.target.value)}
                    className={errors.soh ? 'border-red-500' : ''}
                  />
                  {errors.soh && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.soh}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soc">
                    State of Charge (SOC) % <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="soc"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="75"
                    value={formData.soc}
                    onChange={(e) => handleChange('soc', e.target.value)}
                    className={errors.soc ? 'border-red-500' : ''}
                  />
                  {errors.soc && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.soc}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargeCycles">
                    Charge Cycles <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <Input
                      id="chargeCycles"
                      type="number"
                      min="0"
                      placeholder="342"
                      value={formData.chargeCycles}
                      onChange={(e) => handleChange('chargeCycles', e.target.value)}
                      className={errors.chargeCycles ? 'border-red-500 flex-1' : 'flex-1'}
                    />
                  </div>
                  {errors.chargeCycles && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.chargeCycles}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Telemetry */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Metrics
              </Button>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <div className="space-y-2">
                    <Label htmlFor="mileage">
                      Total Mileage (km) <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-blue-400" />
                      <Input
                        id="mileage"
                        type="number"
                        min="0"
                        placeholder="45230"
                        value={formData.mileage}
                        onChange={(e) => handleChange('mileage', e.target.value)}
                        className={errors.mileage ? 'border-red-500 flex-1' : 'flex-1'}
                      />
                    </div>
                    {errors.mileage && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.mileage}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avgTemperature">
                      Avg. Temperature (°C) <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-400" />
                      <Input
                        id="avgTemperature"
                        type="number"
                        step="0.1"
                        placeholder="32.5"
                        value={formData.avgTemperature}
                        onChange={(e) => handleChange('avgTemperature', e.target.value)}
                        className={errors.avgTemperature ? 'border-red-500 flex-1' : 'flex-1'}
                      />
                    </div>
                    {errors.avgTemperature && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.avgTemperature}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTemperature">
                      Max Temperature (°C) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="maxTemperature"
                      type="number"
                      step="0.1"
                      placeholder="45.0"
                      value={formData.maxTemperature}
                      onChange={(e) => handleChange('maxTemperature', e.target.value)}
                      className={errors.maxTemperature ? 'border-red-500' : ''}
                    />
                    {errors.maxTemperature && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.maxTemperature}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depthOfDischarge">
                      Depth of Discharge (DoD) % <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="depthOfDischarge"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="80"
                      value={formData.depthOfDischarge}
                      onChange={(e) => handleChange('depthOfDischarge', e.target.value)}
                      className={errors.depthOfDischarge ? 'border-red-500' : ''}
                    />
                    {errors.depthOfDischarge && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.depthOfDischarge}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="chargeRate">
                      Charge Rate (C-rate) <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.chargeRate} onValueChange={(value) => handleChange('chargeRate', value)}>
                      <SelectTrigger className={errors.chargeRate ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select charge rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">0.5C (Slow)</SelectItem>
                        <SelectItem value="1.0">1.0C (Normal)</SelectItem>
                        <SelectItem value="1.5">1.5C (Fast)</SelectItem>
                        <SelectItem value="2.0">2.0C (Very Fast)</SelectItem>
                        <SelectItem value="3.0">3.0C (Superfast)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.chargeRate && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.chargeRate}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {writeError && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-800">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Error: {writeError.message}
                </p>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-500">Telemetry Data Recorded Successfully!</p>
                  <p className="text-sm text-green-400 mt-1">
                    Battery {formData.bin} telemetry has been updated
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
                          soh: '',
                          soc: '',
                          mileage: '',
                          chargeCycles: '',
                          avgTemperature: '',
                          maxTemperature: '',
                          depthOfDischarge: '',
                          chargeRate: '',
                        });
                        setErrors({});
                        reset(); // Reset transaction state to re-enable submit button
                      }}
                    >
                      Record Another Telemetry
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-700">
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={isPending || isConfirming || isSuccess || !isAuthorized}
              >
                {isPending || isConfirming ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    {isPending ? 'Confirming...' : 'Recording...'}
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Telemetry Recorded!
                  </>
                ) : !isAuthorized ? (
                  <>
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Missing Required Role
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Record Telemetry Data
                  </>
                )}
              </Button>

              {/* Disabled Button Info */}
              {!isAuthorized && (
                <p className="text-xs text-center text-orange-400 mt-2">
                  ⚠️ Button disabled: Connect with Account #0 (Admin), #2 (OEM), or #5 (Fleet Operator)
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
