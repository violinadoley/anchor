# End-to-End Test Checklist

## Testing Workflow

### 1. ✅ Backend Health Check
- [ ] Start backend: `cd offchain && node src/pyth-official-engine.js`
- [ ] Check health: `curl http://localhost:3001/health`
- [ ] Verify Pyth prices endpoint: `curl http://localhost:3001/api/prices`

### 2. Frontend Health Check
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Check http://localhost:3000 loads

### 3. Simulation Page Testing (`/simulation`)
- [ ] Page loads without errors
- [ ] Click "Start Real-Time Simulation" button
- [ ] Verify intents are submitted to backend
- [ ] Check P2P Matched and Pool Filled boxes appear
- [ ] Verify efficiency gains metrics display
- [ ] Check scenario names are descriptive (not specific numbers)
- [ ] Verify results show actual netting output

**Expected Behavior**: Results should match backend netting algorithm output (not forced scenario names)

### 4. Intent Submission Page (`/intent`)
- [ ] Connect wallet
- [ ] Submit an intent with real wallet
- [ ] Check intent appears in queue
- [ ] Verify backend auto-batches after 5 seconds
- [ ] Check browser console for no errors

### 5. Claims Page (`/claims`)
- [ ] Connect wallet
- [ ] Enter wallet address
- [ ] Click "Search Claims"
- [ ] Verify claims list displays
- [ ] ✅ No "Avail Nexus SDK" box (removed)
- [ ] ✅ No "Automatic Batch Processing" box (removed)
- [ ] Check claim details display correctly

### 6. Pool Page (`/pool`)
- [ ] Connect wallet
- [ ] Check pool stats display
- [ ] Try deposit (if supported)
- [ ] Check pool balance updates

### 7. Cross-Chain Integration
- [ ] Verify cross-chain intent submission works
- [ ] Check Nexus SDK mock integration (should be present but marked as mock)

## Issues to Watch For

1. **Scenario Name Mismatch**: If scenario says "Mixed Match (2.5 Pairs)" but shows different results, that's OK - it's just describing input characteristics
2. **Backend Not Running**: Error "Failed to fetch" means backend isn't running on port 3001
3. **Wallet Connection Issues**: Make sure Metamask or wallet is connected
4. **Real Pyth Prices**: Check backend logs show "from Pyth" (not fallback)

## Quick Commands

```bash
# Start backend
cd offchain && node src/pyth-official-engine.js

# Start frontend  
cd frontend && npm run dev

# Test backend API
curl http://localhost:3001/health
curl http://localhost:3001/api/prices

# Submit test intent
curl -X POST http://localhost:3001/api/intent \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0xTest","fromToken":"USDC","toToken":"ETH","fromChain":"ethereum","toChain":"base","amount":1000}'
```
