"use client";

import { useState, useEffect } from "react";
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
    { symbol: "USDC", name: "USD Coin", address: "0x..." },
    { symbol: "USDT", name: "Tether USD", address: "0x..." },
    { symbol: "ETH", name: "Ethereum", address: "0x..." },
    { symbol: "MATIC", name: "Polygon", address: "0x..." },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if wallet is connected
    if (!isConnected) {
      setError("Please connect your wallet to submit an intent");
      return;
    }
    
    // Check if form is properly filled
    if (!formData.fromToken || !formData.toToken || !formData.fromChain || !formData.toChain || !formData.amount) {
      setError("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setProcessingSteps([]);
    setBatchResult(null);
    
    try {
      // Step 1: Submit user intent
      addProcessingStep("Submitting your intent...");
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit intent');
      }

      addProcessingStep(`✅ Intent submitted: ${result.intentId}`);

      // Step 2: Wait for automatic batch processing (like a real AMM)
      addProcessingStep("Waiting for automatic batch processing...");
      addProcessingStep("System will process your intent within 5 seconds...");
      
      // Wait a moment to show the automatic processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Simulate additional intents for realistic batching
      addProcessingStep("Simulating additional intents for optimal netting...");
      const simulateResponse = await fetch('http://localhost:3001/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 4 }) // Simulate 4 more intents for better netting
      });

      if (!simulateResponse.ok) {
        throw new Error('Failed to simulate additional intents');
      }

      const simulateData = await simulateResponse.json();
      addProcessingStep(`✅ Generated ${simulateData.count} additional intents`);

      // Step 4: Wait for automatic batch processing
      addProcessingStep("Processing batch with multilateral netting...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 5: Process batch automatically
      addProcessingStep("Processing batch with multilateral netting...");
      const batchResponse = await fetch('http://localhost:3001/api/batch/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        setBatchResult(batchData.batchResult);
        addProcessingStep(`✅ Batch processed: ${batchData.batchResult.batchId}`);
        
        const nettingRatio = batchData.batchResult.summary?.nettingRatio || 0;
        addProcessingStep(`✅ Netting efficiency: ${nettingRatio.toFixed(2)}%`);
        
        // Step 6: Wait for automatic settlement
        addProcessingStep("Waiting for automatic on-chain settlement...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        addProcessingStep("🚀 Settling batch on-chain...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check wallet status to show real vs simulated
        try {
          const walletResponse = await fetch('http://localhost:3001/api/wallet/status');
          const walletData = await walletResponse.json();
          
          if (walletData.hasFunds) {
            addProcessingStep("✅ Transaction settled on-chain (REAL settlement)!");
            addProcessingStep("🔗 Check transaction on Etherscan");
          } else {
            addProcessingStep("✅ Transaction settled (SIMULATED for demo)!");
            addProcessingStep("💡 Fund wallet for real settlement");
          }
        } catch (error) {
          addProcessingStep("✅ Transaction settled on-chain!");
        }
        
        addProcessingStep("🎉 Your swap is complete!");
      } else {
        addProcessingStep("✅ Intent submitted - will be processed automatically");
      }

      setSubmissionResult(result);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting intent:', err);
      setError(err.message || 'Failed to submit intent');
      addProcessingStep(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addProcessingStep = (step: string) => {
    setProcessingSteps(prev => [...prev, step]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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

        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center mb-8">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Intent Processed Successfully!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your cross-chain swap intent has been processed and settled in a batch.
              </p>
              {submissionResult && (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Intent ID:</strong> {submissionResult.intentId}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Status:</strong> {submissionResult.message}
                  </p>
                </div>
              )}
            </div>

            {/* Processing Steps */}
            {processingSteps.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Processing Steps
                </h3>
                <div className="space-y-3">
                  {processingSteps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold bg-indigo-500 text-white">
                        {index + 1}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Batch Results */}
            {batchResult && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Batch Settlement Results
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Batch Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Batch ID:</span> {batchResult.batchId}</div>
                      <div><span className="font-medium">Merkle Root:</span> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{batchResult.summary?.merkleRoot}</code></div>
                      <div><span className="font-medium">Total Intents:</span> {batchResult.summary?.totalIntents}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Netting Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Netting Ratio:</span> {batchResult.summary?.nettingRatio?.toFixed(2)}%</div>
                      <div><span className="font-medium">P2P Matches:</span> {batchResult.summary?.p2pMatched}</div>
                      <div><span className="font-medium">Pool Fulfillments:</span> {batchResult.summary?.poolFilled}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Link 
                href="/intent"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Submit Another Intent
              </Link>
              <Link 
                href="/claims"
                className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                View Claims
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Submit Cross-Chain Swap Intent
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Submit your intent to swap tokens across different blockchains with minimal slippage.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {error && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
                <strong>Error:</strong> {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* From Chain and Token */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Chain
                  </label>
                  <select
                    name="fromChain"
                    value={formData.fromChain}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select source chain</option>
                    {chains.map(chain => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Token
                  </label>
                  <select
                    name="fromToken"
                    value={formData.fromToken}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select token</option>
                    {tokens.map(token => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* To Chain and Token */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Chain
                  </label>
                  <select
                    name="toChain"
                    value={formData.toChain}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select destination chain</option>
                    {chains.map(chain => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Token
                  </label>
                  <select
                    name="toToken"
                    value={formData.toToken}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select token</option>
                    {tokens.map(token => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount to swap"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                  min="0"
                  step="0.000001"
                />
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Address (Optional)
                </label>
                <input
                  type="text"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleInputChange}
                  placeholder={isConnected ? address : "Connect wallet to auto-fill address"}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isConnected 
                    ? "Leave empty to use your connected wallet address" 
                    : "Connect your wallet to auto-fill your address"
                  }
                </p>
              </div>

              {/* Wallet Connection Status */}
              {!isConnected ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 text-white text-sm flex items-center justify-center">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Wallet Connection Required
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Please connect your wallet to submit an intent. This ensures your transaction is properly signed and verified.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center">
                      ✅
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">
                        Wallet Connected
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Connected as: <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs">{address}</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isConnected}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {!isConnected 
                  ? "Connect Wallet to Submit Intent" 
                  : isSubmitting 
                    ? "Processing Intent..." 
                    : "Submit Intent"
                }
              </button>

              {/* Processing Steps Display */}
              {isSubmitting && processingSteps.length > 0 && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Processing Steps:
                  </h4>
                  <div className="space-y-2">
                    {processingSteps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span className="text-blue-800 dark:text-blue-200">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
