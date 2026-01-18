import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { stringToHex, pad } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert string to bytes32 format for Solidity
 * @param str - String to convert (max 32 bytes)
 * @returns Hex string padded to 32 bytes (right-padded with zeros)
 */
export function stringToBytes32(str: string): `0x${string}` {
  // Solidity expects strings in bytes32 to be right-padded (zeros at the end)
  return pad(stringToHex(str), { dir: 'right', size: 32 }) as `0x${string}`;
}

/**
 * Convert bytes32 to string, removing null bytes
 * @param bytes32 - Bytes32 hex string
 * @returns Decoded string
 */
export function bytes32ToString(bytes32: `0x${string}`): string {
  // Remove 0x prefix and trailing zeros
  const hex = bytes32.slice(2).replace(/0+$/, '');
  // Convert hex to string
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (byte !== 0) str += String.fromCharCode(byte);
  }
  return str;
}
