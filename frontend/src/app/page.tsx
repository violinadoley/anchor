import Link from 'next/link';
import React from 'react'
import Navbar from '@/components/Navbar'
import { WalletConnect } from "@/components/WalletConnect";

const page = () => {
  return (
    <div>
      <Navbar />
      {/* Hero Section with Wave Background */}
      <section className="hero-section flex flex-col items-center justify-center p-8 min-h-screen">
        <div className="flex flex-col items-start justify-center w-full  md:ml-[20%] ml-[5%]">
          <h1 className="md:text-5xl text-3xl font-sans font-thin uppercase text-left mb-4 inline-block">
            <span className="bg-orange-400 px-2 rounded-md text-black shadow-md">
              Redefining Cross-Chain Swaps<br/> Without Liquidity Fragmentation
            </span>
          </h1>
            <p className="md:text-xl text-sm text-left mt-2">Anchor aggregates intents, Netting protocol for liquidity-saving Automated Market Makers <br /> across chains, hedges against price volatility,<br/> and settles multiple Intent-based swaps in a single batch transaction</p>
        </div>

        <div className="flex flex-col items-start justify-center w-full  md:ml-[20%] ml-[5%] mt-10">
        <button className="group relative text-black inline-flex items-center px-2 py-1 bg-[#75bfcf] dark:bg-[#75bfcf] md:text-sm text-xs">
          Powered by Avail Nexus & DA, Pyth Oracle and BlockScout
        </button>
        </div>
      </section>

      <section className="features-section flex flex-col items-center p-8 min-h-screen">
        <div className="flex flex-col items-start mt-[10%] w-full  ml-[20%]">
          <h2 className="text-3xl font-sans font-thin uppercase text-left mb-4 inline-block">
            <span className="bg-orange-400 px-2 text-black">
              The Research That Inspired This Project
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-2 w-full ">
          <div className="flex flex-col pr-24 font-mono row-span-2" >
            <p> <span className="font-bold bg-[#75bfcf] px-1 text-black shadow-md">Anchor</span> is a liquidity-saving AMM that executes multi-party cross-chain swaps using Avail Nexus SDK; without any upfront collateral, powered by our netting engine and Pyth Pull Oracle Feeds; minimizing the risk of liquidity fragmentation, gas fees and slippage risks.
            Inspired by the paper <span className="font-bold bg-[#75bfcf] px-1 text-black shadow-md">"A Netting Protocol for Liquidity-saving Automated Market Makers" - Renieri et al., DLT 2024</span>, Anchor queues pending trades, simulates net balances, and settles them atomically the moment all user positions return to non-negative — eliminating overdraft rejections common in Uniswap-style DEXs. This enables cyclic token exchanges, arbitrage loops, and coordinated multi-user trades that were previously impossible due to liquidity constraints. We have implemented a hedging mechanism to mitigate the risk of price volatility.</p>

            <div className="flex flex-row mt-20 gap-10">
              <div>
                <a
                  href="https://ceur-ws.org/Vol-3791/paper18.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 md:text-sm text-xs border border-[1px]  text-white backdrop-blur-md hover:bg-white/10 transition-colors duration-200 shadow"
                  style={{ minWidth: 0 }}
                >
                  Read the Research Paper
                 
                </a>
              </div>
              <div>
                <Link href="/intent">
                  <button className="group relative text-black inline-flex items-center px-2 py-1 bg-[#75bfcf] dark:bg-[#75bfcf] md:text-sm text-xs hover:bg-[#75bfcf]/50">
                    Start Trading
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="ml-2 w-4 h-4 -rotate-45"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ transform: 'rotate(45deg) ' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l14-14M8 5h11v11" />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>
            </div>
            <div className="flex flex-row -ml-24">
              <div className="backdrop-blur-md bg-white/10 border border-white/25 rounded-2xl shadow-2xl p-3 w-[80%] flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
                <img
                  src="/net-1.png"
                  alt="Netting Protocol"
                  className="rounded-xl w-full h-full object-cover shadow-lg"
                  style={{ border: '0.25px solid rgba(255,255,255,0.25)' }}
                />
              </div>
            </div>
            <div className="flex flex-row -ml-24">
              <div className="backdrop-blur-md bg-white/10 border border-white/25 rounded-2xl shadow-2xl p-3 w-[80%] flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
                <img
                  src="/amm.png"
                  alt="Automated Market Makers"
                  className="rounded-xl w-full h-full object-cover shadow-lg"
                  style={{ border: '0.25px solid rgba(255,255,255,0.25)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default page;
