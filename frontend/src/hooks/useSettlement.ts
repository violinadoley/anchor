import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, keccak256, toHex } from 'viem';
import { SETTLEMENT_ABI } from '@/abi/SettlementContract';
import { CONTRACTS } from '@/config/contracts';

interface BatchData {
  batchId: string;
  merkleRoot: string;
  totalIntents: number;
  priceData: {
    prices: Record<string, number>;
  };
}

export function useSettlement() {
  const [isSettling, setIsSettling] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const settleBatch = async (batchData: BatchData, networkId: number = 11155111) => {
    setIsSettling(true);
    setSettlementError(null);
    
    try {
      const contractAddress = CONTRACTS.sepolia.settlement;
      
      const batchIdHash = keccak256(toHex(batchData.batchId));
      const merkleRoot = `0x${batchData.merkleRoot.replace('0x', '')}` as `0x${string}`;
      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      const totalIntents = BigInt(batchData.totalIntents);
      
      const batchDataStruct = {
        batchId: batchIdHash as `0x${string}`,
        merkleRoot: merkleRoot,
        timestamp: timestamp,
        totalIntents: totalIntents,
        isSettled: false,
        priceDataHash: keccak256(toHex(JSON.stringify(batchData.priceData.prices))) as string
      };
      
      const tokens = Object.keys(batchData.priceData.prices);
      const prices = Object.values(batchData.priceData.prices).map(price => {
        const roundedPrice = parseFloat(price.toFixed(8));
        return parseUnits(roundedPrice.toString(), 8);
      });
      
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: SETTLEMENT_ABI,
        functionName: 'settleBatch',
        args: [batchDataStruct, tokens, prices],
      });
      
    } catch (error: any) {
      setSettlementError(error.message || 'Failed to settle batch');
    } finally {
      setIsSettling(false);
    }
  };

  return {
    settleBatch,
    isSettling,
    isConfirming,
    isConfirmed,
    hash,
    settlementError: settlementError || (writeError?.message ?? null),
  };
}
