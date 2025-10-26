"use client";

import { useState, useCallback } from 'react';
import { useNexus } from '../components/NexusInit';

interface CrossChainSettlementParams {
  token: string;
  amount: number;
  fromChainId: number;
  toChainId: number;
  recipient: string;
}

export function useCrossChainSettlement() {
  const { nexus, isInitialized } = useNexus();
  const [isSettling, setIsSettling] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [settlementHash, setSettlementHash] = useState<string | null>(null);

  const transferCrossChain = useCallback(async (params: CrossChainSettlementParams) => {
    setIsSettling(true);
    setSettlementError(null);
    setSettlementHash(null);

    try {
      if (!isInitialized || !nexus) {
        throw new Error('Nexus SDK not initialized');
      }

      console.log('🌐 Executing cross-chain bridge via Nexus SDK:', params);

      // Execute cross-chain bridge using Nexus SDK
      const result = await nexus.bridge({
        token: params.token,
        amount: params.amount,
        fromChainId: params.fromChainId,
        toChainId: params.toChainId,
        recipient: params.recipient
      });

      console.log('✅ Cross-chain bridge completed:', result);
      
      // Set the transaction hash from the bridge result
      if (result.txHash) {
        setSettlementHash(result.txHash);
        console.log('🔗 Bridge transaction hash:', result.txHash);
      }

      return result;

    } catch (error: any) {
      console.error('❌ Cross-chain bridge failed:', error);
      setSettlementError(error.message || 'Cross-chain bridge failed');
      throw error;
    } finally {
      setIsSettling(false);
    }
  }, [isInitialized, nexus]);

  return {
    isInitialized,
    isSettling,
    settlementError,
    settlementHash,
    settleCrossChain: transferCrossChain,
    transferCrossChain,
  };
}