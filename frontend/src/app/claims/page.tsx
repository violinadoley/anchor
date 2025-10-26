"use client";

import { Search } from 'lucide-react';
import { useState } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from "@/components/WalletProvider";
import { useSettlement } from "@/hooks/useSettlement";
import { useCrossChainSettlement } from "@/hooks/useCrossChainSettlement";                   
import { useClaim } from "@/hooks/useClaim";
import { usePoolFulfillment } from "@/hooks/usePoolFulfillment";
import { UnifiedBalances } from "@/components/UnifiedBalances";
import { CHAIN_NAME_TO_ID } from "@/config/contracts";

interface Claim {
  id: string;
  batchId: string;
  fromToken: string;
  toToken: string;
  fromChain: string;
  toChain: string;
  amount: string;
  status: "pending" | "ready" | "claimed";
  createdAt: string;
  claimableAt?: string;
}

export default function ClaimsPage() {
  const { address, isConnected } = useWallet();
  const [walletAddress, setWalletAddress] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Automatic batch processing - no manual state needed
  
  // Settlement hook
  const { settleBatch, isSettling, isConfirming, isConfirmed, hash, settlementError } = useSettlement();
  
  // Cross-chain settlement hook
  const { 
    isInitialized: isNexusReady, 
    isSettling: isCrossChainSettling, 
    settlementError: crossChainError, 
    settlementHash: crossChainHash,
    transferCrossChain 
  } = useCrossChainSettlement();

  // Claim hook
  const {
    claimIntent,
    isClaiming,
    isConfirming: isConfirmingClaim,
    isConfirmed: isClaimConfirmed,
    hash: claimHash,
    claimError,
  } = useClaim();

  // Pool fulfillment hook
  const {
    fulfillSettlement,
    isPending: isFulfilling,
    isConfirming: isConfirmingFulfill,
    isConfirmed: isFulfillConfirmed,
    hash: fulfillHash,
    error: fulfillError,
  } = usePoolFulfillment();


  const handleSearch = async () => {
    const searchAddress = walletAddress.trim() || address;
    if (!searchAddress) return;
    
    setIsLoading(true);
    
    try {
      // Fetch all intents from the batch engine API
      const response = await fetch('http://localhost:3001/api/intents');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch intents');
      }

      // Filter intents for the searched address
      const userIntents = result.intents.filter((intent: any) => 
        intent.userAddress && intent.userAddress.toLowerCase() === searchAddress.toLowerCase()
      );

      // Convert intents to claims format
      const userClaims: Claim[] = userIntents.map((intent: any) => ({
        id: intent.id,
        batchId: intent.batchId || 'pending',
        fromToken: intent.fromToken,
        toToken: intent.toToken,
        fromChain: intent.fromChain,
        toChain: intent.toChain,
        amount: intent.amount,
        status: (intent.status === 'matched' || intent.status === 'settled') ? 'ready' : 'pending',
        createdAt: new Date(intent.timestamp).toISOString(),
        claimableAt: (intent.status === 'matched' || intent.status === 'settled') ? new Date().toISOString() : undefined
      }));

      setClaims(userClaims);
    } catch (error: any) {
      console.error('Error fetching claims:', error);
      // Show error message instead of mock data
      setClaims([]);
      alert('Error fetching claims: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (claim: Claim) => {
    try {
      console.log('Claiming intent:', claim);
      
      // Check if this is a cross-chain swap
      const isCrossChain = claim.fromChain !== claim.toChain;
      
      if (isCrossChain && isNexusReady) {
        console.log('🌐 Cross-chain swap detected, initiating REAL Nexus bridge on testnet...');
        
        // Get chain IDs
        const fromChainId = CHAIN_NAME_TO_ID[claim.fromChain] || 11155111;
        const toChainId = CHAIN_NAME_TO_ID[claim.toChain] || 11155111;
        
        console.log(`Bridge params: ${claim.toToken} | ${claim.amount} | From: ${fromChainId} | To: ${toChainId}`);
        
        // Call REAL Nexus SDK bridge function for TESTNET
        const result = await transferCrossChain({
          token: claim.toToken as 'ETH' | 'USDC' | 'USDT' | 'BTC', // Nexus SDK token types
          amount: parseFloat(claim.amount),
          fromChainId,
          toChainId,
          recipient: claim.id,
        });
        
        console.log('✅ REAL cross-chain bridge transaction result:', result);
        
        if (result && (result as any).txHash) {
          alert(`✅ REAL testnet bridge initiated! Transaction: ${(result as any).txHash}`);
        } else {
          alert('✅ Cross-chain bridge initiated on testnet!');
        }
      } else if (!isCrossChain) {
        // Regular same-chain claim
        alert('Same-chain claim - no bridge needed');
      } else {
        alert('Cross-chain swap but Nexus SDK not ready. Please wait...');
      }
      
      // Update UI
      setClaims(prev => prev.map(c => 
        c.id === claim.id 
          ? { ...c, status: "claimed" as const }
          : c
      ));
    } catch (error: any) {
      console.error('Error in cross-chain claim:', error);
      alert('Cross-chain bridge failed: ' + error.message);
    }
  };

  // Automatic batch processing - no manual intervention needed
  // The system automatically processes batches every 10 seconds

  // Automatic settlement - no manual intervention needed

  const handleCrossChainSettlement = async (claim: Claim) => {
    if (!isNexusReady) {
      alert('Cross-chain settlement not available. Nexus SDK not initialized.');
      return;
    }

    try {
      const fromChainId = CHAIN_NAME_TO_ID[claim.fromChain] || 11155111; // Default to Sepolia
      const toChainId = CHAIN_NAME_TO_ID[claim.toChain] || 11155111;
      
      await transferCrossChain({
        token: claim.toToken,
        amount: parseFloat(claim.amount),
        fromChainId,
        toChainId,
        recipient: claim.id, // Use claim ID as recipient identifier
      });

      alert('Cross-chain settlement initiated!');
    } catch (error: any) {
      console.error('Cross-chain settlement error:', error);
      alert('Cross-chain settlement failed: ' + error.message);
    }
  };

  const handleFulfillPoolSettlements = async () => {
    // Simplified for now
    alert('Pool fulfillment will be implemented with batch processing data');
  };

  const getStatusColor = (status: Claim["status"]) => {
    switch (status) {
      case "pending": return "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20";
      case "ready": return "text-green-400 bg-green-500/10 border border-green-500/20";
      case "claimed": return "text-white/50 bg-white/5 border border-white/10";
      default: return "text-white/50 bg-white/5 border border-white/10";
    }
  };

  const getStatusText = (status: Claim["status"]) => {
    switch (status) {
      case "pending": return "Pending Settlement";
      case "ready": return "Ready to Claim";
      case "claimed": return "Claimed";
      default: return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-sans">
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Navigation */}
        <div className="flex justify-end items-center mb-16 space-x-6">
          <Link href="/intent" className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">
            Submit Intent
          </Link>
          <Link href="/claims" className="text-sm font-medium text-white">
            View Claims
          </Link>
          <Link href="/pool" className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">
            Pool
          </Link>
          <WalletConnect />
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              View Your Claims
            </h1>
            <p className="text-lg text-white/60">
              Check the status of your submitted intents and claim your tokens when ready.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
            
            <div className="relative space-y-4">
              {/* Search Input */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter your wallet address (0x...)"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all font-mono"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-8 py-3 bg-white text-black font-medium hover:bg-white/90 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-5 h-5" />
                  <span>{isLoading ? "Searching..." : "Search Claims"}</span>
                </button>
              </div>

              {/* Helper Text */}
              <p className="text-xs text-white/40 font-mono">
                Enter your wallet address to view all your pending and ready claims
              </p>
            </div>
          </div>

          {/* Claims List */}
          {claims.length > 0 && (
            <div className="mt-8 relative backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
              
              <div className="relative divide-y divide-white/10">
                {claims.map((claim) => (
                  <div key={claim.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          {claim.fromToken} → {claim.toToken}
                        </h3>
                        <p className="text-sm text-white/60">
                          {claim.fromChain} → {claim.toChain}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}>
                        {getStatusText(claim.status)}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-white/50">Amount</p>
                        <p className="text-lg font-semibold text-white">
                          {claim.amount} {claim.toToken}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/50">Batch ID</p>
                        <p className="text-sm font-mono text-white">
                          {claim.batchId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/50">Created</p>
                        <p className="text-sm text-white">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {claim.status === "ready" && (
                      <button
                        onClick={() => handleClaim(claim)}
                        disabled={isClaiming || isConfirmingClaim || isClaimConfirmed}
                        className="w-full px-6 py-3 bg-white text-black font-semibold hover:bg-white/90 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaiming ? "Claiming..." : isConfirmingClaim ? "Confirming..." : isClaimConfirmed ? "Claimed ✓" : "Claim Tokens"}
                      </button>
                    )}
                    
                    {claim.status === "pending" && (
                      <div className="text-sm text-white/50">
                        Your tokens will be available for claiming once the batch is settled.
                      </div>
                    )}
                    
                    {claim.status === "claimed" && (
                      <div className="text-sm text-green-400">
                        ✓ Tokens have been successfully claimed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {claims.length === 0 && !walletAddress && !isLoading && (
            <div className="mt-12 backdrop-blur-xl bg-white/5 border border-white/10 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 border border-white/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Claims Found</h3>
              <p className="text-sm text-white/50">
                Enter your wallet address above to search for claims
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 backdrop-blur-xl bg-white/5 border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">How Claims Work</h3>
            <div className="space-y-2 text-sm text-white/60">
              <p>• Submit your swap intent and wait for it to be filled by the network</p>
              <p>• Once filled, your claim will appear in this section</p>
              <p>• Click "Claim" to receive your tokens on the destination chain</p>
              <p>• Claims typically take 2-5 minutes to become available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
