# Live Cross-Chain Test Guide

## Your Setup
✅ Backend running on port 3001
✅ Frontend running on port 3000
✅ Contracts deployed on Sepolia
✅ You have 2 accounts with testnet tokens

## Step 1: Submit Intent from Account 1

1. **Open http://localhost:3000/intent**
2. **Connect Account 1 wallet** (switch to it in MetaMask)
3. **Fill the form**:
   - From Chain: Select any chain (e.g., Ethereum)
   - To Chain: Select a different chain (e.g., Polygon) 
   - From Token: ETH
   - To Token: USDC
   - Amount: Any amount (e.g., 0.1)
4. **Click "Submit Intent"**
5. **Wait for confirmation** (should see success message)

## Step 2: Submit Intent from Account 2

1. **Switch to Account 2** in MetaMask (click the account circle → Account 2)
2. **Go to http://localhost:3000/intent** again
3. **Fill the form with OPPOSITE intent**:
   - From Chain: Polygon (the destination from Step 1)
   - To Chain: Ethereum (the source from Step 1)
   - From Token: USDC
   - To Token: ETH
   - Amount: Matching amount (if you submitted 0.1 ETH, submit ~40 USDC worth)
4. **Click "Submit Intent"**
5. **Wait for confirmation**

## Step 3: Check Backend Logs

Look at your terminal where the backend is running. You should see:
```
⏰ Auto-batch triggered: 2 pending intents
Processing auto-batch batch-X with 2 intents
...
📊 Netting Statistics:
  P2P Matched: 2
  Pool Filled: 0
```

This means they matched! ✅

## Step 4: Check Claims

1. **Switch to Account 1** in MetaMask
2. **Go to http://localhost:3000/claims**
3. **You should see your claim** with the tokens you're supposed to receive
4. **Click "Claim"** 
5. **Approve the transaction in MetaMask**
6. **Repeat for Account 2**

## What's Happening Behind the Scenes

1. Both intents are submitted to the backend
2. Backend runs multilateral netting algorithm
3. It finds they can match (opposite directions)
4. Creates a batch settlement
5. Mock Nexus SDK simulates "cross-chain" transfer
6. Both parties get claimable tokens

## Troubleshooting

**If intents don't match:**
- Make sure they're truly opposite directions
- Check backend logs for errors
- Verify both intents were submitted successfully

**If claims don't appear:**
- Wait for backend to process (takes 5 seconds)
- Check browser console for errors
- Refresh the claims page

**If transaction fails:**
- Make sure you have enough ETH for gas
- Check you're on Sepolia network
- Verify contracts are deployed correctly

## Next Steps After This Works

Once this basic flow works, we can:
1. Test with more complex scenarios (multiple intents)
2. Test pool fulfillments (unmatched intents)
3. Integrate real Avail Nexus SDK
4. Deploy to additional chains


