"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, createContext, useContext } from 'react'

// Create a client
const queryClient = new QueryClient()

// Simple wallet context
interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const connect = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      };

      checkConnection();

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setAddress(null);
          setIsConnected(false);
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletContext.Provider value={{ isConnected, address, connect, disconnect }}>
        {children}
      </WalletContext.Provider>
    </QueryClientProvider>
  )
}
