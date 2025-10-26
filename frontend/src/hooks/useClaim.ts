"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseUnits, Hex, keccak256, toHex } from "viem";
import { CONTRACTS } from "@/config/contracts";
import { SETTLEMENT_ABI } from "@/abi/SettlementContract";

interface SwapIntent {
  intentId: string;
  userAddress: string;
  fromToken: string;
  toToken: string;
  fromChain: string;
  toChain: string;
  amount: string;
  recipient: string;
  netAmount: string;
  matchedWith?: string;
}

interface MerkleProof {
  leaf: string;
  path: string[];
  indices: number[];
}

export function useClaim() {
  const chainId = useChainId();
  const settlementContractAddress = CONTRACTS[chainId === 11155111 ? "sepolia" : "hardhat"].settlement;

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  });

  const claimIntent = async (intent: SwapIntent, proof: MerkleProof, batchId: string) => {
    if (!settlementContractAddress) {
      console.error("Settlement contract address not found for current chain.");
      return;
    }

    setIsClaiming(true);
    setClaimError(null);
    
    try {
      // Convert intentId and matchedWith to bytes32
      const intentIdBytes = `0x${Buffer.from(intent.intentId).toString('hex').padEnd(64, '0')}` as Hex;
      const matchedWithBytes = intent.matchedWith 
        ? `0x${Buffer.from(intent.matchedWith).toString('hex').padEnd(64, '0')}` as Hex
        : `0x${'0'.repeat(64)}` as Hex;
      
      // Build SwapIntent struct
      const swapIntent = {
        intentId: intentIdBytes,
        userAddress: intent.userAddress as `0x${string}`,
        fromToken: intent.fromToken,
        toToken: intent.toToken,
        fromChain: intent.fromChain,
        toChain: intent.toChain,
        amount: parseUnits(intent.amount, 18),
        recipient: intent.recipient as `0x${string}`,
        netAmount: parseUnits(intent.netAmount || intent.amount, 18),
        matchedWith: matchedWithBytes,
      };
      
      // Build MerkleProof struct
      const merkleProof = {
        leaf: proof.leaf as Hex,
        path: proof.path.map(p => p as Hex),
        indices: proof.indices.map(i => BigInt(i)),
      };
      
      // Convert batchId to bytes32
      const batchIdBytes = `0x${Buffer.from(batchId).toString('hex').padEnd(64, '0')}` as Hex;
      
      console.log('Claiming intent:', {
        intent: swapIntent,
        proof: merkleProof,
        batchId: batchIdBytes,
      });
      
      writeContract({
        address: settlementContractAddress as `0x${string}`,
        abi: SETTLEMENT_ABI,
        functionName: "claimIntent",
        args: [swapIntent, merkleProof, batchIdBytes],
      });
      
    } catch (error: any) {
      setClaimError(error.message || 'Failed to claim intent');
      console.error('Claim error:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    claimIntent,
    isClaiming,
    isConfirming,
    isConfirmed,
    hash,
    claimError: claimError || (writeError?.message ?? null) || (confirmError?.message ?? null),
  };
}
