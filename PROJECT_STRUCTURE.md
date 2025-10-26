# 📁 Anchor Protocol - Project Structure

## Project Overview

Cross-chain netted settlement protocol with intelligent batching, multilateral netting, and unified liquidity management.

---

## 📂 Directory Structure

```
anchor/
├── frontend/              # Next.js Frontend Application
│   ├── src/
│   │   ├── app/          # Pages (landing, intent, claims, pool)
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── config/       # Configuration (contracts, networks)
│   │   └── abi/          # Smart contract ABIs
│   ├── public/           # Static assets (images, backgrounds)
│   └── package.json
│
├── offchain/             # Backend Batch Processing Engine
│   ├── src/
│   │   ├── pyth-official-engine.js      # Main batch engine
│   │   ├── MultilateralNettingEngine.js # Netting algorithm
│   │   ├── PoolHedgingEngine.js         # Pool risk management
│   │   └── AvailDAService.js            # Data availability
│   ├── data/             # Intent queue storage
│   └── package.json
│
├── contracts/            # Smart Contracts (Solidity)
│   ├── src/
│   │   ├── SettlementContract.sol
│   │   ├── UnifiedLiquidityPool.sol
│   │   ├── TokenManager.sol
│   │   └── PythOracle.sol
│   ├── scripts/          # Deployment scripts
│   ├── test/             # Contract tests
│   └── hardhat.config.js
│
├── README.md             # Main documentation
└── PROJECT_FLOW.md       # Detailed system flow

```

---

## 🎯 Core Components

### 1. Frontend (`frontend/`)
- **Landing Page**: Beautiful hero section with research background
- **Intent Submission**: User interface for submitting swap intents
- **Claims View**: Interface for checking and claiming tokens
- **Pool Dashboard**: Liquidity pool management interface
- **Navigation**: Integrated navbar with all pages

### 2. Backend (`offchain/`)
- **Batch Engine**: Processes intents every 5 seconds
- **Multilateral Netting**: Graph-based optimization algorithm
- **Price Oracle**: Pyth Network integration
- **Pool Hedging**: Risk management system
- **Avail DA**: Data availability integration

### 3. Smart Contracts (`contracts/`)
- **SettlementContract**: Handles batch settlement with Merkle proofs
- **UnifiedLiquidityPool**: Manages pool liquidity and fulfillment
- **TokenManager**: Token handling and transfers
- **PythOracle**: Price feed integration

---

## 🔄 Workflow

1. **Intent Submission** → Frontend receives user intent
2. **Batch Processing** → Backend processes every 5 seconds
3. **Netting** → Multilateral netting algorithm matches intents
4. **Pool Fulfillment** → Unmatched intents routed to pool
5. **Settlement** → On-chain settlement with Merkle proofs
6. **Claims** → Users claim tokens using proofs

---

## 📊 Deployed Contracts (Sepolia)

- **Settlement Contract**: `0xec69dBE31F53DC6882f3Bc2DEe53Fabde9Ec2Ba9`
- **Liquidity Pool**: `0x2132905560710a9A9D14443b7067285a246E9670`
- **Factory**: `0xfc4432AaE4041F4f425B74183801a55De5DB5C36`
- **Token Manager**: `0x9b8c2c0491FF27b89D9e2Bc776aBF3F910EbCd9f`
- **Pyth Oracle**: `0x5676a1346B8c0D60E61D459c984b2c771e93F938`

---

## 🚀 Quick Start

### Backend
```bash
cd offchain
npm install
node src/pyth-official-engine.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

---

## ✅ Features

- ✅ Cross-chain settlement
- ✅ Multilateral netting
- ✅ Unified liquidity pool
- ✅ Real-time Pyth prices
- ✅ Merkle proof verification
- ✅ Automatic batching (5s intervals)
- ✅ Pool auto-fulfillment
- ✅ Hedging system

---

**Status**: Production-ready for testnet 🚀
