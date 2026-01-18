'use client';

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { ANVIL_CHAIN } from '@/config/contracts';

/**
 * Custom hook for wallet connection and account information
 * Wraps wagmi hooks with additional utility functions
 */
export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected, chain } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    chainId: ANVIL_CHAIN.id,
  });

  // Check if connected to the correct network (Anvil)
  const isCorrectNetwork = chain?.id === ANVIL_CHAIN.id;

  // Get the first available connector (usually MetaMask or injected)
  const defaultConnector = connectors[0];

  // Helper function to connect with default connector
  const connectWallet = () => {
    if (defaultConnector) {
      connect({ connector: defaultConnector, chainId: ANVIL_CHAIN.id });
    }
  };

  // Helper function to disconnect wallet
  const disconnectWallet = () => {
    disconnect();
  };

  return {
    // Account info
    address,
    balance: balance?.formatted,
    balanceSymbol: balance?.symbol,

    // Connection state
    isConnected,
    isConnecting,
    isDisconnected,
    isCorrectNetwork,

    // Current chain
    chain,
    chainId: chain?.id,

    // Connection functions
    connect: connectWallet,
    disconnect: disconnectWallet,

    // Available connectors
    connectors,

    // Errors
    error: connectError,
  };
}
