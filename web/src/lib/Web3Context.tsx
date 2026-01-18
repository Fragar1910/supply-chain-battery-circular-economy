'use client';

import { createContext, useContext, ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { ANVIL_CHAIN } from '@/config/contracts';
import '@rainbow-me/rainbowkit/styles.css';

// Create wagmi config with Anvil local chain
const config = getDefaultConfig({
  appName: 'Battery Circular Economy - Traceability Platform',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace with actual WalletConnect project ID
  chains: [ANVIL_CHAIN as any],
  transports: {
    [ANVIL_CHAIN.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
});

// Create query client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Web3 Context (can be extended with additional state/methods)
interface Web3ContextType {
  // Add any additional context data here
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Empty context value - MOVED OUTSIDE to prevent re-creation
const EMPTY_CONTEXT_VALUE: Web3ContextType = {};

// Web3 Provider component
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          initialChain={ANVIL_CHAIN.id}
        >
          <Web3Context.Provider value={EMPTY_CONTEXT_VALUE}>
            {children}
          </Web3Context.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Hook to use Web3 context
export function useWeb3Context() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3Context must be used within a Web3Provider');
  }
  return context;
}

// Export config for use in other parts of the app
export { config };
