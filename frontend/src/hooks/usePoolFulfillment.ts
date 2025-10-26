"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits, Hex } from 'viem';
import { CONTRACTS } from '@/config/contracts';

interface PoolFulfillment {
  intentId: string;
  user: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceData: {
    fromPrice: number;
    toPrice: number;
    exchangeRate: number;
  };
}

const POOL_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'string', name: 'fromToken', type: 'string' },
      { internalType: 'string', name: 'toToken', type: 'string' },
      { internalType: 'uint256', name: 'fromAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'toAmount', type: 'uint256' },
    ],
    name: 'fulfillSettlement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function usePoolFulfillment() {
  const chainId = useChainId();
  const poolAddress = CONTRACTS[chainId === 11155111 ? 'sepolia' : 'hardhat'].liquidityPool;

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  });

  const fulfillSettlement = async (fulfillment: PoolFulfillment) => {
    try {
      // Generate request ID from intent ID
      const requestId = `0x${Buffer.from(fulfillment.intentId).toString('hex').padEnd(64, '0')}` as Hex;
      
      // Convert amounts to wei (assuming 18 decimals)
      const fromAmountWei = parseUnits(fulfillment.fromAmount, 18);
      const toAmountWei = parseUnits(fulfillment.toAmount, 18);
      
      console.log('Fulfilling pool settlement:', {
        requestId,
        user: fulfillment.user,
        fromToken: fulfillment.fromToken,
        toToken: fulfillment.toToken,
        fromAmount: fromAmountWei.toString(),
        toAmount: toAmountWei.toString(),
      });
      
      writeContract({
        address: poolAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: 'fulfillSettlement',
        args: [
          requestId,
          fulfillment.user as `0x${string}`,
          fulfillment.fromToken,
          fulfillment.toToken,
          fromAmountWei,
          toAmountWei,
        ],
      });
    } catch (error: any) {
      console.error('Error fulfilling settlement:', error);
      throw error;
    }
  };

  return {
    poolAddress,
    fulfillSettlement,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError?.message || confirmError?.message,
  };
}
