# Anchor Protocol Smart Contracts

## Overview

This directory contains the smart contracts for the Anchor Protocol, a cross-chain netted settlement protocol that enables efficient cross-chain swaps with unified liquidity and minimal slippage.

## Architecture

The protocol consists of four main smart contracts:

### 1. SettlementContract.sol
- **Purpose**: Handles batch settlement of cross-chain swap intents
- **Key Features**:
  - Merkle proof verification for batched swaps
  - Price validation using Pyth oracles
  - Batch settlement with cryptographic proofs
  - Intent claiming mechanism

### 2. TokenManager.sol
- **Purpose**: Manages token deposits, withdrawals, and cross-chain transfers
- **Key Features**:
  - Multi-token support (USDC, USDT, ETH, BTC)
  - Cross-chain transfer processing
  - User balance management
  - Emergency recovery functions

### 3. PythOracle.sol
- **Purpose**: Integrates with Pyth Network for real-time price feeds
- **Key Features**:
  - Real-time price updates from Pyth Network
  - Price validation and circuit breakers
  - Confidence interval tracking
  - Price impact calculations

### 4. AnchorFactory.sol
- **Purpose**: Factory contract for deploying and managing protocol instances
- **Key Features**:
  - One-click protocol deployment
  - Contract configuration management
  - Protocol lifecycle management
  - Statistics and monitoring

## Installation

```bash
npm install
```

## Compilation

```bash
npm run compile
```

## Testing

```bash
npm run test
```

## Deployment

### Local Development
```bash
npm run deploy
```

### Testnets
```bash
# Sepolia (Ethereum)
npm run deploy:sepolia

# Mumbai (Polygon)
npm run deploy:mumbai

# Arbitrum Sepolia
npm run deploy:arbitrum

# Optimism Sepolia
npm run deploy:optimism
```

## Contract Interactions

### 1. Deploy Protocol
```javascript
const anchorFactory = await ethers.getContractFactory("AnchorFactory");
const factory = await anchorFactory.deploy();
const protocolConfig = await factory.deployProtocol();
```

### 2. Settle Batch
```javascript
const batchData = {
  batchId: batchId,
  merkleRoot: merkleRoot,
  timestamp: timestamp,
  totalIntents: totalIntents,
  isSettled: false,
  priceDataHash: priceDataHash
};

await settlementContract.settleBatch(batchData, tokens, prices);
```

### 3. Claim Intent
```javascript
await settlementContract.claimIntent(intent, proof, batchId);
```

### 4. Update Prices
```javascript
await pythOracle.updatePrice("ETH", newPrice, confidence);
```

## Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Access control for administrative functions
- **Price Validation**: Circuit breakers for price deviations
- **Merkle Proof Verification**: Cryptographic proof validation
- **Emergency Functions**: Emergency pause and recovery mechanisms

## Gas Optimization

- **Optimized Compilation**: Solidity optimizer enabled with 200 runs
- **Efficient Storage**: Optimized storage patterns
- **Batch Processing**: Reduced gas costs through batching
- **Library Usage**: OpenZeppelin libraries for gas efficiency

## Testing Coverage

The contracts include comprehensive tests covering:
- Contract deployment
- Batch settlement
- Merkle proof verification
- Price updates
- Token management
- Error handling
- Security scenarios

## Deployment Addresses

### Testnet Deployments
- **Sepolia**: TBD
- **Mumbai**: TBD
- **Arbitrum Sepolia**: TBD
- **Optimism Sepolia**: TBD

## Integration

### Frontend Integration
The contracts are designed to work seamlessly with the Next.js frontend:
- Wallet connection via Wagmi
- Contract interaction via ethers.js
- Real-time price updates
- Batch status monitoring

### Backend Integration
The contracts integrate with the off-chain batch engine:
- Batch settlement triggers
- Price data synchronization
- Merkle proof generation
- Intent status updates

## Monitoring

### Events
All contracts emit comprehensive events for monitoring:
- Batch settlement events
- Price update events
- Intent claim events
- Token transfer events

### Statistics
The factory contract provides protocol statistics:
- Total deployed contracts
- Active protocols
- Supported tokens
- Deployment metrics

## Future Enhancements

- **Avail DA Integration**: Data availability layer integration
- **Nexus Integration**: Cross-chain communication layer
- **Advanced Netting**: More sophisticated netting algorithms
- **Liquidity Pools**: Automated market maker integration
- **Governance**: Decentralized governance mechanisms

## License

MIT License - see LICENSE file for details.
