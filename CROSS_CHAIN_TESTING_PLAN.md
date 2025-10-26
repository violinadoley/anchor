# Cross-Chain Swap Testing Plan

## Current State
✅ Contracts deployed on Sepolia
✅ Backend netting engine working
✅ Avail Nexus SDK (mock) integrated
❌ Real cross-chain swaps not tested

## What We Need

### For Real Cross-Chain Testing

1. **Two Separate Wallets**
   - Wallet A (Alice) on Chain 1 (e.g., Sepolia Ethereum)
   - Wallet B (Bob) on Chain 2 (e.g., Base Sepolia, Polygon Mumbai, etc.)

2. **Two Different Chains**
   - Chain A: Sepolia Ethereum (contracts already deployed)
   - Chain B: Base Sepolia or Polygon Mumbai (need to deploy contracts)

3. **Actual Token Balances**
   - Alice needs tokens on Chain A
   - Bob needs tokens on Chain B
   - Both need gas tokens (ETH) on their respective chains

4. **Nexus SDK Integration** (Currently Mock)
   - Real Avail Nexus SDK needs to be integrated
   - Or use a different cross-chain bridge temporarily

## Testing Steps

### Option 1: Test with Mock Nexus (Simpler)
- Keep mock Nexus SDK
- Test the flow locally without real cross-chain
- Verify UI/UX and logic

### Option 2: Real Cross-Chain (Complex)
1. Deploy contracts to second chain (Base/Polygon)
2. Get testnet tokens for both chains
3. Set up two wallets (can use same person with different accounts)
4. Submit intent from Chain A
5. Submit intent from Chain B
6. Run netting engine
7. Verify cross-chain settlement via Nexus

## Recommended Approach

**For Now (Demo/Local)**:
- Use mock Nexus SDK
- Focus on testing single-chain functionality
- Test with two different wallets on same chain (Sepolia)

**For Production**:
- Implement real Nexus SDK integration
- Deploy contracts to multiple chains
- Set up proper testing infrastructure

## Quick Test Setup (Two Wallets on Same Chain)

1. **Set up MetaMask with 2 accounts**:
   - Import two different private keys
   - Both on Sepolia network
   - Fund both with test ETH from faucet

2. **Test Intent Submission**:
   - Account 1: Submit ETH → USDC swap
   - Account 2: Submit USDC → ETH swap
   - Both target opposite chains (for demo purposes)

3. **Verify Netting**:
   - Backend should match them
   - Both see claimable tokens
   - Verify claims work

## Which Approach Do You Want?

A) **Mock Test**: Keep mock Nexus, test with two wallets on same chain
B) **Real Cross-Chain**: Deploy to second chain, set up real cross-chain
C) **Hybrid**: Mock for now, real later
