"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { useAccount } from "wagmi";
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
  const { address, isConnected } = useAccount();
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
        status: intent.status === 'matched' ? 'ready' : 'pending',
        createdAt: new Date(intent.timestamp).toISOString(),
        claimableAt: intent.status === 'matched' ? new Date().toISOString() : undefined
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
      // Check if we have batch result with Merkle proofs
      if (!batchResult?.batchResult?.merkleProofs) {
        alert('No batch processed yet. Please process a batch first.');
        return;
      }

      const proofs = batchResult.batchResult.merkleProofs;
      const proof = proofs[claim.id];
      
      if (!proof) {
        alert('No Merkle proof found for this intent. It may not have been included in the batch.');
        return;
      }

      // Find the intent data from the batch
      const intent = batchResult.batchResult.matchedSwaps.find((s: any) => s.intentId === claim.id);
      if (!intent) {
        alert('Intent not found in batch.');
        return;
      }

      // Build swap intent struct
      const swapIntent = {
        intentId: claim.id,
        userAddress: intent.userAddress || claim.fromToken, // Fallback
        fromToken: claim.fromToken,
        toToken: claim.toToken,
        fromChain: claim.fromChain,
        toChain: claim.toChain,
        amount: claim.amount,
        recipient: address || claim.toToken, // Use connected wallet or fallback
        netAmount: intent.netAmount || claim.amount,
        matchedWith: intent.matchedWith || '',
      };

      // Call the claim hook
      await claimIntent(
        swapIntent,
        proof,
        claim.batchId
      );

      // Update local state on success
      if (isClaimConfirmed) {
        setClaims(prev => prev.map(c => 
          c.id === claim.id 
            ? { ...c, status: "claimed" as const }
            : c
        ));
      }
    } catch (error: any) {
      console.error('Error claiming tokens:', error);
      alert('Error claiming tokens: ' + error.message);
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
    if (!batchResult?.batchResult?.poolFulfillments) {
      alert('No pool fulfillments to process. Please process a batch first.');
      return;
    }

    const fulfillments = batchResult.batchResult.poolFulfillments;
    
    if (fulfillments.length === 0) {
      alert('No unmatched intents to fulfill. All intents were matched peer-to-peer!');
      return;
    }

    // Fulfill each settlement in sequence
    for (const fulfillment of fulfillments) {
      try {
        await fulfillSettlement(fulfillment);
        alert(`Pool fulfillment initiated for ${fulfillment.toToken}!`);
      } catch (error: any) {
        console.error('Error fulfilling settlement:', error);
        alert('Error fulfilling settlement: ' + error.message);
      }
    }
  };

  const getStatusColor = (status: Claim["status"]) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300";
      case "ready": return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      case "claimed": return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          Anchor Protocol
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/intent" className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
            Submit Intent
          </Link>
          <Link href="/claims" className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
            View Claims
          </Link>
          <Link href="/pool" className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
            Pool
          </Link>
          <WalletConnect />
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              View Your Claims
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Check the status of your submitted intents and claim your tokens when ready.
            </p>
          </div>

          {/* Search Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={isConnected ? address : "Enter your wallet address (0x...)"}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || (!walletAddress.trim() && !isConnected)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {isLoading ? "Searching..." : "Search Claims"}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Enter your wallet address to view all your pending and ready claims
            </p>
          </div>

          {/* Avail Nexus - Unified Balances */}
          {isConnected && <UnifiedBalances />}

          {/* Claims List */}
          {claims.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Claims ({claims.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {claims.map((claim) => (
                  <div key={claim.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {claim.fromToken} → {claim.toToken}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {claim.fromChain} → {claim.toChain}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}>
                        {getStatusText(claim.status)}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {claim.amount} {claim.toToken}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Batch ID</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {claim.batchId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {claim.status === "ready" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleClaim(claim)}
                          disabled={isClaiming || isConfirmingClaim || isClaimConfirmed}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          {isClaiming ? "Claiming..." : isConfirmingClaim ? "Confirming..." : isClaimConfirmed ? "Claimed ✓" : "Claim Tokens"}
                        </button>
                        
                        {claimHash && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            TX: <a href={`https://sepolia.etherscan.io/tx/${claimHash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{claimHash.slice(0, 10)}...{claimHash.slice(-8)}</a>
                          </div>
                        )}
                        
                        {claimError && (
                          <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                            Error: {claimError}
                          </div>
                        )}
                        
                        {/* Cross-chain Settlement Button */}
                        {claim.fromChain !== claim.toChain && (
                          <button
                            onClick={() => handleCrossChainSettlement(claim)}
                            disabled={!isNexusReady || isCrossChainSettling}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            {isCrossChainSettling ? "Settling..." : "🌐 Cross-Chain Settle"}
                          </button>
                        )}
                      </div>
                    )}
                    
                    {claim.status === "pending" && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Your tokens will be available for claiming once the batch is settled.
                      </div>
                    )}
                    
                    {claim.status === "claimed" && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        ✓ Tokens have been successfully claimed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {claims.length === 0 && walletAddress && !isLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Claims Found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                No claims found for this wallet address. Submit an intent to start cross-chain swapping.
              </p>
              <Link 
                href="/intent"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Submit Intent
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
