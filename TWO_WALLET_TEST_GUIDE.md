# Two-Wallet Cross-Chain Test Setup

## Overview
Test cross-chain swap functionality using two MetaMask accounts on Sepolia.

## Setup Steps

### 1. Set Up Two MetaMask Accounts

**Option A: Create Second Account (Easier)**
1. Open MetaMask
2. Click the account circle (top right)
3. Click "Create Account" or "Add Account"
4. Name it "Account 2"
5. Save both private keys for testing

**Option B: Import Existing Wallet**
1. Generate a second wallet with a private key
2. In MetaMask, click "Import Account"
3. Paste the private key
4. Name it "Account 2"

### 2. Fund Both Accounts with Sepolia ETH

Get Sepolia testnet ETH from faucets:
- https://sepoliafaucet.com/
- https://faucets.chain.link/
- https://sepolia-faucet.pk910.de/

You'll need ETH for:
- Gas fees for transactions
- Intent submission fees (if any)

### 3. Test Flow

#### Step 1: Submit Intent from Account 1
1. Switch to Account 1 in MetaMask
2. Go to http://localhost:3000/intent
3. Submit an intent:
   - From: ETH
   - To: USDC
   - Amount: 0.01 ETH
   - From Chain: ethereum
   - To Chain: polygon (or base, arbitrum, etc.)

#### Step 2: Submit Intent from Account 2
1. Switch to Account 2 in MetaMask
2. Go to http://localhost:3000/intent
3. Submit opposing intent:
   - From: USDC
   - To: ETH
   - Amount: 40 USDC (approx 0.01 ETH worth)
   - From Chain: polygon (or whatever you chose)
   - To Chain: ethereum

#### Step 3: Wait for Batching
- Backend auto-batches every 5 seconds
- Check backend logs to see matching

#### Step 4: Check Claims
- Go to http://localhost:3000/claims
- Check both accounts see their claims
- Try claiming tokens

## Expected Results

- Both intents appear in the queue
- Backend matches them (since opposite directions)
- Both accounts can claim their tokens
- Mock Nexus SDK handles the "cross-chain" simulation

## Troubleshooting

### Can't Switch Accounts
- Make sure both accounts are imported
- Use MetaMask account switcher (circle icon)

### No Funds
- Get more testnet ETH from faucets
- Check you're on Sepolia network

### Intents Don't Match
- Make sure they're opposite swaps
- Check backend is running
- Verify both intents were submitted

### Can't Claim
- Check you're using correct account
- Verify backend processed the batch
- Check browser console for errors
