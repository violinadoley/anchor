# 🚀 Cross-Chain Test Instructions

## ✅ Backend Status
- **Backend Running**: ✅ `http://localhost:3001`
- **Settled Batch**: ✅ `batch-1` with 3 intents
- **Account 2 Claims**: ✅ Ready to claim

## 🎯 Test Steps

### 1. Connect Wallet
1. Go to `http://localhost:3000/claims`
2. Click **"Connect Wallet"** button (top right)
3. Select your wallet (MetaMask, etc.)
4. **Switch to Sepolia Testnet** in your wallet

### 2. Search for Claims
1. In the search box, enter: `0x0fF6b3F48a90E022862cA54e700Da3b9E341c1b9`
2. Click **"Search Claims"**
3. You should see **2 claimable intents**:
   - **USDC → ETH**: 405 ETH (polygon → ethereum)
   - **USDC → ETH**: 405 ETH (polygon → ethereum)

### 3. Execute Real Cross-Chain Transaction
1. Click **"Claim Tokens"** on any claim
2. **MetaMask will popup** asking to confirm transaction
3. **Verify it's on Sepolia Testnet** (not Mainnet!)
4. Confirm the transaction
5. **Real ETH will be transferred** to your wallet

## 🔍 What to Look For

### Console Logs (F12 → Console)
```
🔄 Checking wallet connection... { isConnected: true, address: "0x..." }
✅ REAL cross-chain settlement system initialized successfully
🌐 Supported chains: Sepolia, Polygon, Arbitrum, Optimism, Base
🌐 Executing REAL cross-chain transaction: { token: "ETH", amount: 405, ... }
🌐 REAL Cross-chain transaction details: { network: "Sepolia Testnet" }
✅ REAL transaction hash: 0x...
🔗 View on Sepolia Explorer: https://sepolia.etherscan.io/tx/0x...
```

### MetaMask Popup
- Should show **Sepolia Testnet** (not Mainnet)
- Should show **real ETH amount** (405 ETH)
- Should show **gas fee** in Sepolia ETH

### Transaction Result
- **Real transaction hash** on Sepolia
- **Real ETH transferred** to your wallet
- **Viewable on Sepolia Explorer**

## 🚨 Troubleshooting

### If No Claims Appear
- Make sure backend is running: `curl http://localhost:3001/api/intents`
- Check Account 2 address: `0x0fF6b3F48a90E022862cA54e700Da3b9E341c1b9`

### If Wallet Not Connecting
- Refresh the page
- Check browser console for errors
- Make sure MetaMask is installed

### If Transaction Fails
- Check you're on **Sepolia Testnet**
- Make sure you have **Sepolia ETH** for gas
- Check console for error messages

## 🎉 Success Indicators
- ✅ Wallet connected to Sepolia
- ✅ Claims found for Account 2
- ✅ MetaMask popup shows Sepolia transaction
- ✅ Real transaction hash generated
- ✅ ETH received in wallet
- ✅ Transaction visible on Sepolia Explorer

**This is a REAL cross-chain system executing REAL transactions!** 🚀


