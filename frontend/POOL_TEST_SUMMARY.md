# Pool Page Testing Summary

## Current Status
✅ **Contract Deployed**: `0x2132905560710a9A9D14443b7067285a246E9670` on Sepolia
✅ **Page Ready**: `/pool` page is built with deposit/withdraw functionality

## Test Checklist

### 1. Basic Page Load
- [ ] Navigate to http://localhost:3000/pool
- [ ] Verify wallet connection prompt appears
- [ ] Connect wallet to Sepolia network
- [ ] Check pool balances display (should show 0.0000 ETH, 0.00 USDC, 0.00 USDT initially)

### 2. Deposit Functionality
- [ ] Select ETH from dropdown
- [ ] Enter amount (e.g., 0.1)
- [ ] Click "Deposit Liquidity"
- [ ] Wallet prompts for transaction
- [ ] Approve transaction
- [ ] Verify confirmation and balance update

### 3. Withdraw Functionality
- [ ] Select ETH from dropdown
- [ ] Enter amount (e.g., 0.05)
- [ ] Click "Withdraw Liquidity"
- [ ] Verify withdrawal succeeds and balance updates

## Quick Test
Visit: http://localhost:3000/pool
