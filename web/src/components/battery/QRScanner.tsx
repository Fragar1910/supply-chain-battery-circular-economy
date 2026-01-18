'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { Camera, Keyboard, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (bin: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export function QRScanner({
  onScan,
  onClose,
  title = 'Scan Battery QR Code',
  description = 'Use your camera or enter the BIN manually',
}: QRScannerProps) {
  const [mode, setMode] = useState<'manual' | 'camera'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch((err) => console.error('Failed to stop scanner:', err));
      }
    };
  }, [isScanning]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerDivId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText);
          stopCamera();
        },
        (errorMessage) => {
          // Error callback (can be ignored for continuous scanning)
        }
      );
    } catch (err) {
      setError('Failed to access camera. Please check permissions or use manual mode.');
      setIsScanning(false);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop camera:', err);
      }
    }
  };

  const handleModeChange = async (newMode: 'manual' | 'camera') => {
    if (mode === 'camera' && isScanning) {
      await stopCamera();
    }
    setMode(newMode);
    setError(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  const handleStartCamera = () => {
    startCamera();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('manual')}
            className="flex-1"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Manual
          </Button>
          <Button
            variant={mode === 'camera' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('camera')}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Manual Mode */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="bin-input"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Battery Identification Number (BIN)
              </label>
              <input
                id="bin-input"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter BIN (e.g., BAT-2024-001)"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!manualInput.trim()}>
              Submit
            </Button>
          </form>
        )}

        {/* Camera Mode */}
        {mode === 'camera' && (
          <div className="space-y-4">
            <div
              id={scannerDivId}
              className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700"
            />

            {!isScanning && (
              <Button onClick={handleStartCamera} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            )}

            {isScanning && (
              <div className="space-y-2">
                <Badge variant="success" className="w-full justify-center py-2">
                  Scanning... Point camera at QR code
                </Badge>
                <Button onClick={stopCamera} variant="destructive" className="w-full">
                  Stop Camera
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
