import { stringToHex, pad } from 'viem';

/**
 * Converts a BIN string to bytes32 format for smart contract calls
 * @param bin - Battery Identification Number as string (e.g. "NV-2024-001234")
 * @returns bytes32 hex string padded to 32 bytes
 * @example
 * ```ts
 * const binBytes32 = binToBytes32("NV-2024-001234");
 * // Returns: "0x4e562d323032342d303031323334000000000000000000000000000000000000"
 * ```
 */
export function binToBytes32(bin: string): `0x${string}` {
  if (!bin || bin.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
  }

  // Solidity expects strings in bytes32 to be right-padded (zeros at the end)
  return pad(stringToHex(bin), { dir: 'right', size: 32 });
}

/**
 * Converts a bytes32 hex string back to a BIN string
 * @param bytes32 - bytes32 hex string from smart contract
 * @returns BIN string with null bytes removed
 * @example
 * ```ts
 * const bin = bytes32ToBin("0x4e562d323032342d303031323334000000000000000000000000000000000000");
 * // Returns: "NV-2024-001234"
 * ```
 */
export function bytes32ToBin(bytes32: `0x${string}`): string {
  if (!bytes32 || bytes32 === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return '';
  }

  // Remove 0x prefix and convert hex to string
  const hex = bytes32.slice(2);
  let str = '';

  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substring(i, i + 2), 16);
    if (charCode === 0) break; // Stop at null byte
    str += String.fromCharCode(charCode);
  }

  return str;
}
