"use client";

import { useState } from 'react';
import { useNexus } from '../components/NexusInit';

export function useNexusSettlement() {
  const { nexus, isInitialized } = useNexus();
  const [isSettling, setIsSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settleCrossChain = async (
    fromChain: string,
    toChain: string,
    token: string,
    amount: string,
    recipient: string
  ) => {
    if (!nexus || !isInitialized) {
      throw new Error('Nexus SDK not initialized');
    }

    setIsSettling(true);
    setError(null);

    try {
      console.log('🌉 Settling cross-chain via Nexus SDK...', {
        fromChain,
        toChain,
        token,
        amount,
        recipient
      });

      // Use the actual Nexus SDK bridge method
      // SDK signature: bridge({ token, amount, chainId })
      const result = await nexus.bridge({
        token: token as any, // 'ETH' | 'USDC' | 'USDT'
        amount: amount,
        chainId: parseInt(toChain) as any
      });
      
      console.log('✅ Cross-chain settlement via Nexus SDK complete:', result);
      return result;
    } catch (err: any) {
      console.error('Error in cross-chain settlement:', err);
      setError(err.message || 'Cross-chain settlement failed');
      throw err;
    } finally {
      setIsSettling(false);
    }
  };

  return {
    settleCrossChain,
    isSettling,
    error,
    isReady: nexus && isInitialized
  };
}
