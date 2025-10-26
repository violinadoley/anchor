"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { useAccount, useReadContract } from "wagmi";
import { usePool } from "@/hooks/usePool";
import { formatUnits } from "viem";
import { CONTRACTS } from "@/config/contracts";
import { useChainId } from "wagmi";

const POOL_ABI = [
  {
    inputs: [{ internalType: 'string', name: '', type: 'string' }],
    name: 'getPoolBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function PoolPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const poolAddress = CONTRACTS[chainId === 11155111 ? 'sepolia' : 'hardhat'].liquidityPool;
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  const { 
    depositLiquidity, 
    withdrawLiquidity,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error 
  } = usePool();
  
  const [refreshKey, setRefreshKey] = useState(0);

  const tokens = ["ETH", "USDC", "USDT"];
  
  // Get real pool balances using useReadContract
  const { data: ethBalanceRaw } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: POOL_ABI,
    functionName: 'getPoolBalance',
    args: ['ETH'],
  });
  
  const { data: usdcBalanceRaw } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: POOL_ABI,
    functionName: 'getPoolBalance',
    args: ['USDC'],
  });
  
  const { data: usdtBalanceRaw } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: POOL_ABI,
    functionName: 'getPoolBalance',
    args: ['USDT'],
  });
  
  const ethBalance = ethBalanceRaw ? formatUnits(ethBalanceRaw as bigint, 18) : '0';
  const usdcBalance = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 18) : '0';
  const usdtBalance = usdtBalanceRaw ? formatUnits(usdtBalanceRaw as bigint, 18) : '0';

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const isNative = selectedToken === "ETH";
      await depositLiquidity(selectedToken, depositAmount, isNative);
      setDepositAmount(""); // Clear input
      setTimeout(() => setRefreshKey(prev => prev + 1), 2000); // Refresh balances after 2s
    } catch (error: any) {
      console.error('Deposit error:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await withdrawLiquidity(selectedToken, withdrawAmount);
      setWithdrawAmount(""); // Clear input
      setTimeout(() => setRefreshKey(prev => prev + 1), 2000); // Refresh balances after 2s
    } catch (error: any) {
      console.error('Withdraw error:', error);
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
          <Link href="/pool" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold">
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
              Unified Liquidity Pool
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Provide liquidity to fill unmatched swap intents
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Contract: <span className="font-mono">{poolAddress?.slice(0, 10)}...{poolAddress?.slice(-8)}</span>
            </p>
          </div>

          {/* Pool Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pool Balances</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">ETH</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(ethBalance).toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pool Balance</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">USDC</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(usdcBalance).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pool Balance</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">USDT</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(usdtBalance).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pool Balance</p>
              </div>
            </div>
          </div>

          {/* Deposit Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Deposit Liquidity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Token
                </label>
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  {tokens.map((token) => (
                    <option key={token} value={token}>
                      {token}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={!isConnected || isPending || isConfirming || isConfirmed}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isPending ? "Depositing..." : isConfirming ? "Confirming..." : isConfirmed ? "Deposited ✓" : "Deposit Liquidity"}
              </button>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Withdraw Liquidity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Token
                </label>
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  {tokens.map((token) => (
                    <option key={token} value={token}>
                      {token}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={!isConnected || isPending || isConfirming || isConfirmed}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isPending ? "Withdrawing..." : isConfirming ? "Confirming..." : isConfirmed ? "Withdrawn ✓" : "Withdraw Liquidity"}
              </button>
            </div>
          </div>

          {/* Transaction Status */}
          {hash && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Transaction Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                TX: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{hash.slice(0, 10)}...{hash.slice(-8)}</a>
              </p>
              {isConfirmed && (
                <p className="text-green-600 dark:text-green-400 mt-2">✓ Transaction confirmed!</p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
