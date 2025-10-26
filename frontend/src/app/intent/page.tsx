"use client";

import { ArrowDownUp, Wallet, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { useAccount } from "wagmi";

export default function IntentPage() {
  const { address, isConnected } = useAccount();
  
  const [formData, setFormData] = useState({
    fromToken: "",
    toToken: "",
    fromChain: "",
    toChain: "",
    amount: "",
    recipient: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [batchResult, setBatchResult] = useState<any>(null);

  // Auto-fill recipient when wallet connects
  useEffect(() => {
    if (isConnected && address && !formData.recipient) {
      setFormData(prev => ({ ...prev, recipient: address }));
    }
  }, [isConnected, address, formData.recipient]);

  const chains = [
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "polygon", name: "Polygon", symbol: "MATIC" },
    { id: "arbitrum", name: "Arbitrum", symbol: "ETH" },
    { id: "optimism", name: "Optimism", symbol: "ETH" },
    { id: "base", name: "Base", symbol: "ETH" },
  ];

  const tokens = [
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USDT", name: "Tether USD" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "MATIC", name: "Polygon" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError("Please connect your wallet to submit an intent");
      return;
    }
    
    if (!formData.fromToken || !formData.toToken || !formData.fromChain || !formData.toChain || !formData.amount) {
      setError("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setProcessingSteps([]);
    setBatchResult(null);
    
    try {
      const intentData = {
        userAddress: address || formData.recipient || "0x0000000000000000000000000000000000000000",
        fromToken: formData.fromToken,
        toToken: formData.toToken,
        fromChain: formData.fromChain,
        toChain: formData.toChain,
        amount: formData.amount,
        recipient: formData.recipient || address || "0x0000000000000000000000000000000000000000"
      };

      const response = await fetch('http://localhost:3001/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit intent');
      }

      setSubmissionResult(result);
      setSubmitted(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-sans">
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Navigation */}
        <div className="flex justify-end items-center mb-16 space-x-6">
          <Link href="/intent" className="text-sm font-medium text-white">
            Submit Intent
          </Link>
          <Link href="/claims" className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">
            View Claims
          </Link>
          <Link href="/pool" className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">
            Pool
          </Link>
          <WalletConnect />
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Submit Cross-Chain Swap Intent
            </h1>
            <p className="text-lg text-white/60">
              Submit your intent to swap tokens across different blockchains with minimal slippage.
            </p>
          </div>

          {/* Glassmorphic Form */}
          <form onSubmit={handleSubmit} className="relative backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
            
            <div className="relative space-y-6">
              {/* From Chain and To Chain side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">From Chain</label>
                  <select
                    required
                    value={formData.fromChain}
                    onChange={(e) => setFormData({...formData, fromChain: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option value="">Select source chain</option>
                    {chains.map(chain => (
                      <option key={chain.id} value={chain.id}>{chain.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">To Chain</label>
                  <select
                    required
                    value={formData.toChain}
                    onChange={(e) => setFormData({...formData, toChain: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option value="">Select destination chain</option>
                    {chains.map(chain => (
                      <option key={chain.id} value={chain.id}>{chain.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Arrow Icon */}
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                  <ArrowDownUp className="w-5 h-5 text-white/70" />
                </div>
              </div>

              {/* From Token and To Token side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">From Token</label>
                  <select
                    required
                    value={formData.fromToken}
                    onChange={(e) => setFormData({...formData, fromToken: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option value="">Select token</option>
                    {tokens.map(token => (
                      <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">To Token</label>
                  <select
                    required
                    value={formData.toToken}
                    onChange={(e) => setFormData({...formData, toToken: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  >
                    <option value="">Select token</option>
                    {tokens.map(token => (
                      <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Amount</label>
                <input
                  required
                  type="text"
                  placeholder="Enter amount to swap"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Recipient Address <span className="text-white/40">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Connect wallet to auto-fill address"
                  value={formData.recipient}
                  onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-mono"
                />
                <p className="text-xs text-white/40 mt-2">Connect your wallet to auto-fill your address</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-400 mb-1">Error</h3>
                      <p className="text-xs text-red-300/80">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {submitted && submissionResult && (
                <div className="backdrop-blur-xl bg-green-500/10 border border-green-500/20 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-black text-xs">✓</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-green-400 mb-1">Intent Submitted!</h3>
                      <p className="text-xs text-green-300/80">ID: {submissionResult.intentId}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-white text-black font-semibold text-base hover:bg-white/90 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-5 h-5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Intent'}</span>
              </button>
            </div>
          </form>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-xs text-white/50 mb-1">Estimated Time</p>
              <p className="text-lg font-semibold text-white">~2-5 min</p>
            </div>
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-xs text-white/50 mb-1">Network Fee</p>
              <p className="text-lg font-semibold text-white">~$2.50</p>
            </div>
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-xs text-white/50 mb-1">Slippage</p>
              <p className="text-lg font-semibold text-white">0.5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
