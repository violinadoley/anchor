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
    <div className="min-h-screen bg-black relative overflow-hidden font-sans">
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Navigation */}
        <div className="flex justify-end items-center mb-16 space-x-6">
          <Link href="/intent" className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">
            Submit Intent
          </Link>
          <Link href="/claims" className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">
            View Claims
          </Link>
          <Link href="/pool" className="text-sm font-medium text-white">
            Pool
          </Link>
          <WalletConnect />
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Unified Liquidity Pool
            </h1>
            <p className="text-lg text-white/60 mb-2">
              Provide liquidity to fill unmatched swap intents
            </p>
            <p className="text-sm text-white/40 font-mono">
              Contract: {poolAddress?.slice(0, 10)}...{poolAddress?.slice(-8)}
            </p>
          </div>

          {/* Pool Balances Section */}
          <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl p-8 mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
            
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-6">Pool Balances</h2>
              
              <div className="grid grid-cols-3 gap-4">
                {/* ETH Balance */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <p className="text-sm text-white/50 mb-2 font-mono">ETH</p>
                  <p className="text-3xl font-bold text-white mb-1 font-mono">{parseFloat(ethBalance).toFixed(4)}</p>
                  <p className="text-xs text-white/40">Pool Balance</p>
                </div>

                {/* USDC Balance */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <p className="text-sm text-white/50 mb-2 font-mono">USDC</p>
                  <p className="text-3xl font-bold text-white mb-1 font-mono">{parseFloat(usdcBalance).toFixed(2)}</p>
                  <p className="text-xs text-white/40">Pool Balance</p>
                </div>

                {/* USDT Balance */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <p className="text-sm text-white/50 mb-2 font-mono">USDT</p>
                  <p className="text-3xl font-bold text-white mb-1 font-mono">{parseFloat(usdtBalance).toFixed(2)}</p>
                  <p className="text-xs text-white/40">Pool Balance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit Liquidity Section */}
          <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl p-8 mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
            
            <div className="relative space-y-6">
              <h2 className="text-2xl font-bold text-white">Deposit Liquidity</h2>

              {/* Select Token */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Select Token</label>
                <select 
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all font-mono"
                >
                  {tokens.map((token) => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Amount</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all font-mono"
                />
              </div>

              {/* Deposit Button */}
              <button
                onClick={handleDeposit}
                disabled={!isConnected || isPending || isConfirming || isConfirmed}
                className="w-full px-6 py-4 bg-white text-black font-semibold text-base hover:bg-white/90 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Depositing..." : isConfirming ? "Confirming..." : isConfirmed ? "Deposited ✓" : "Deposit Liquidity"}
              </button>
            </div>
          </div>

          {/* Withdraw Liquidity Section */}
          <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
            
            <div className="relative space-y-6">
              <h2 className="text-2xl font-bold text-white">Withdraw Liquidity</h2>

              {/* Select Token */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Select Token</label>
                <select 
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all font-mono"
                >
                  {tokens.map((token) => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Amount</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all font-mono"
                />
              </div>

              {/* Withdraw Button */}
              <button
                onClick={handleWithdraw}
                disabled={!isConnected || isPending || isConfirming || isConfirmed}
                className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold text-base hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Withdrawing..." : isConfirming ? "Confirming..." : isConfirmed ? "Withdrawn ✓" : "Withdraw Liquidity"}
              </button>
            </div>
          </div>

          {/* Transaction Status */}
          {hash && (
            <div className="mt-8 relative backdrop-blur-xl bg-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Transaction Status</h3>
              <p className="text-sm text-white/60 font-mono">
                TX: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">{hash.slice(0, 10)}...{hash.slice(-8)}</a>
              </p>
              {isConfirmed && (
                <p className="text-green-400 mt-2">✓ Transaction confirmed!</p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 backdrop-blur-xl bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <p className="text-sm text-red-400">Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
