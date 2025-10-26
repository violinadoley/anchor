# 🌉 Anchor Protocol - Cross-Chain Netted Settlement

A fully functional cross-chain settlement system with intelligent batching, multilateral netting, and unified liquidity management.

## 🚀 Features

- **Cross-Chain Settlement**: Seamlessly swap tokens across multiple blockchains
- **Intelligent Netting**: Multilateral graph-based optimization minimizes settlement volume
- **Always-On Liquidity**: Unified pool ensures 100% intent fulfillment
- **Real-Time Pricing**: Pyth Network integration for accurate USD pricing
- **Cryptographic Proofs**: Merkle tree verification for secure claims
- **Automatic Batching**: Processes intents every 5 seconds (AMM-like speed)

## 🏗️ Architecture

```
Frontend (Next.js) → Backend (Node.js) → Smart Contracts (Solidity)
                                ↓
                    Pyth Network (Prices)
```

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd anchor
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Install backend dependencies**
```bash
cd ../offchain
npm install
```

4. **Install smart contract dependencies**
```bash
cd ../contracts
npm install
```

### Running the Application

1. **Start the backend** (Terminal 1)
```bash
cd offchain
node src/pyth-official-engine.js
```

2. **Start the frontend** (Terminal 2)
```bash
cd frontend
npm run dev
```

3. **Open your browser**
```
http://localhost:3000
```

## 📍 Deployed Contracts (Sepolia Testnet)

- **Settlement Contract**: `0xec69dBE31F53DC6882f3Bc2DEe53Fabde9Ec2Ba9`
- **Liquidity Pool**: `0x2132905560710a9A9D14443b7067285a246E9670`
- **Factory**: `0xfc4432AaE4041F4f425B74183801a55De5DB5C36`
- **Token Manager**: `0x9b8c2c0491FF27b89D9e2Bc776aBF3F910EbCd9f`
- **Pyth Oracle**: `0x5676a1346B8c0D60E61D459c984b2c771e93F938`

## 🔄 Workflow

1. **Submit Intent**: User submits swap intent via frontend
2. **Batch Processing**: Backend processes intents every 5 seconds
3. **Netting**: Multilateral netting minimizes settlement volume
4. **Settlement**: Matched intents settle P2P, unmatched use pool
5. **On-Chain**: Batch settled on blockchain with Merkle proofs
6. **Claim**: Users claim tokens with cryptographic proofs

## 📚 Documentation

- [Complete Project Summary](./COMPLETE_PROJECT_SUMMARY.md) - Full feature list and status
- [Project Flow](./PROJECT_FLOW.md) - Detailed system flow and architecture
- [Smart Contracts Summary](./SMART_CONTRACTS_SUMMARY.md) - Contract documentation

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express
- **Smart Contracts**: Solidity, OpenZeppelin
- **Oracles**: Pyth Network
- **Testing**: Hardhat, Sepolia Testnet

## 📊 Current Status

✅ Fully Operational:
- Intent submission and batching
- Real Pyth price feeds
- Multilateral netting engine
- Merkle tree generation
- Smart contracts on Sepolia
- Pool fulfillment system

⚠️ Partial Implementation:
- Cross-chain Nexus (installed, not fully connected)

## 🤝 Contributing

This is a research/development project. Contributions welcome!

## 📄 License

MIT

---

**Status**: ✅ Production-ready for testnet deployment
