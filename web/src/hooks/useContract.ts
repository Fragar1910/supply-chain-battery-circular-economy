'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, ContractName } from '@/config/contracts';
import { useState, useCallback } from 'react';

/**
 * Custom hook for reading from smart contracts
 * @param contractName - Name of the contract to read from
 */
export function useContractRead<T = any>(contractName: ContractName) {
  const contract = CONTRACTS[contractName];

  const read = useCallback(
    (functionName: string, args: any[] = []) => {
      return useReadContract({
        address: contract.address,
        abi: contract.abi,
        functionName: functionName as any,
        args: args as any,
      });
    },
    [contract]
  );

  return { read, contract };
}

/**
 * Custom hook for writing to smart contracts with transaction handling
 * @param contractName - Name of the contract to write to
 */
export function useContractWrite(contractName: ContractName) {
  const contract = CONTRACTS[contractName];
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const [isWriting, setIsWriting] = useState(false);

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Write to contract function
   * @param functionName - Name of the function to call
   * @param args - Arguments to pass to the function
   */
  const write = useCallback(
    async (functionName: string, args: any[] = []) => {
      try {
        setIsWriting(true);
        await writeContract({
          address: contract.address,
          abi: contract.abi,
          functionName: functionName as any,
          args: args as any,
        });
      } catch (err) {
        console.error('Contract write error:', err);
        throw err;
      } finally {
        setIsWriting(false);
      }
    },
    [writeContract, contract]
  );

  return {
    write,
    contract,
    hash,
    isPending: isPending || isWriting,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Generic hook for any contract interaction
 * Combines read and write capabilities
 */
export function useContract(contractName: ContractName) {
  const contract = CONTRACTS[contractName];
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Read from contract
   */
  const read = (functionName: string, args: any[] = []) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: functionName as any,
      args: args as any,
    });
  };

  /**
   * Write to contract
   */
  const write = async (functionName: string, args: any[] = []) => {
    try {
      await writeContract({
        address: contract.address,
        abi: contract.abi,
        functionName: functionName as any,
        args: args as any,
      });
    } catch (err) {
      console.error('Contract write error:', err);
      throw err;
    }
  };

  return {
    contract,
    read,
    write,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
