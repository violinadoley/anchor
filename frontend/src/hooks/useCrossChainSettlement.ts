"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

// Dynamic import to avoid SSR issues with Nexus SDK
let NexusSDK: any = null;

// Always use mock SDK for now to avoid browser compatibility issues
NexusSDK = class MockNexusSDK {
  constructor() {}
  async initialize() {
    console.log('Using mock Nexus SDK for cross-chain settlement');
    return true;
  }
  async bridge() {
    return { transactionHash: 'mock-tx-hash', success: true };
  }
  async transfer() {
    return { success: true, explorerUrl: 'mock-explorer-url' };
  }
};

interface CrossChainSettlementParams {
  token: string;
  amount: number;
  fromChainId: number;
  toChainId: number;
  recipient: string;
}

export function useCrossChainSettlement() {
  const { address, isConnected } = useAccount();
  const [nexusSDK, setNexusSDK] = useState<NexusSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [settlementHash, setSettlementHash] = useState<string | null>(null);

  useEffect(() => {
    const initializeNexus = async () => {
      if (!isConnected || !address) return;

      try {
        const sdk = new NexusSDK({ network: 'testnet' });
        
        // Get provider from window.ethereum
        if (typeof window !== 'undefined' && window.ethereum) {
          await sdk.initialize(window.ethereum as any);
          setNexusSDK(sdk);
          setIsInitialized(true);
          console.log('✅ Nexus SDK initialized for cross-chain settlement');
        }
      } catch (error) {
        console.error('Failed to initialize Nexus SDK:', error);
        setSettlementError('Failed to initialize cross-chain SDK');
      }
    };

    initializeNexus();

    return () => {
      setNexusSDK(null);
      setIsInitialized(false);
    };
  }, [isConnected, address]);

  const settleCrossChain = async (params: CrossChainSettlementParams) => {
    if (!nexusSDK || !isInitialized) {
      setSettlementError('Nexus SDK not initialized');
      return;
    }

    setIsSettling(true);
    setSettlementError(null);
    setSettlementHash(null);

    try {
      console.log('🌐 Initiating cross-chain settlement:', params);

      // Use Nexus SDK bridge function for cross-chain settlement
      const result = await nexusSDK.bridge({
        token: params.token as any,
        amount: params.amount,
        chainId: params.toChainId as any,
      });

      console.log('✅ Cross-chain settlement result:', result);
      
      // BridgeResult has transactionHash
      if (result.transactionHash) {
        setSettlementHash(result.transactionHash);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Cross-chain settlement failed:', error);
      setSettlementError(error.message || 'Cross-chain settlement failed');
      throw error;
    } finally {
      setIsSettling(false);
    }
  };

  const transferCrossChain = async (params: CrossChainSettlementParams) => {
    if (!nexusSDK || !isInitialized) {
      setSettlementError('Nexus SDK not initialized');
      return;
    }

    setIsSettling(true);
    setSettlementError(null);
    setSettlementHash(null);

    try {
      console.log('🌐 Initiating cross-chain transfer:', params);

      // Use Nexus SDK transfer function
      const result = await nexusSDK.transfer({
        token: params.token as any,
        amount: params.amount,
        chainId: params.toChainId as any,
        recipient: params.recipient as `0x${string}`,
      });

      console.log('✅ Cross-chain transfer result:', result);
      
      // TransferResult doesn't have transactionHash, use explorerUrl instead
      if (result.success && result.explorerUrl) {
        setSettlementHash(result.explorerUrl);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Cross-chain transfer failed:', error);
      setSettlementError(error.message || 'Cross-chain transfer failed');
      throw error;
    } finally {
      setIsSettling(false);
    }
  };

  return {
    isInitialized,
    isSettling,
    settlementError,
    settlementHash,
    settleCrossChain,
    transferCrossChain,
  };
}
