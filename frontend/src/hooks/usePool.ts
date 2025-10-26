"use client";

import { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits, formatUnits, Hex } from 'viem';
import { CONTRACTS } from '@/config/contracts';

// Minimal ABI for pool interactions
const POOL_ABI = [
  {
    inputs: [{ internalType: 'string', name: '', type: 'string' }],
    name: 'getPoolBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'tokenSymbol', type: 'string' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'depositLiquidity',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'tokenSymbol', type: 'string' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'withdrawLiquidity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function usePool() {
  const chainId = useChainId();
  const poolAddress = CONTRACTS[chainId === 11155111 ? 'sepolia' : 'hardhat'].liquidityPool;

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  });

  const getPoolBalance = (tokenSymbol: string) => {
    // Note: This needs to be called from component level, not from hook level
    // The hook just returns the configuration
    return null;
  };

  const depositLiquidity = async (tokenSymbol: string, amount: string, isNative: boolean = false) => {
    try {
      const amountWei = parseUnits(amount, 18);
      
      writeContract({
        address: poolAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: 'depositLiquidity',
        args: [tokenSymbol, amountWei],
        value: isNative ? amountWei : undefined,
      });
    } catch (error: any) {
      console.error('Error depositing liquidity:', error);
      throw error;
    }
  };

  const withdrawLiquidity = async (tokenSymbol: string, amount: string) => {
    try {
      const amountWei = parseUnits(amount, 18);
      
      writeContract({
        address: poolAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: 'withdrawLiquidity',
        args: [tokenSymbol, amountWei],
      });
    } catch (error: any) {
      console.error('Error withdrawing liquidity:', error);
      throw error;
    }
  };

  return {
    poolAddress,
    getPoolBalance,
    depositLiquidity,
    withdrawLiquidity,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError?.message || confirmError?.message,
  };
}
