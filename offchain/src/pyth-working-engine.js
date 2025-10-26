const express = require('express');
const cors = require('cors');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const axios = require('axios');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Real data storage
let intents = [];
let batchCounter = 0;

// Real Pyth price feed IDs
const PYTH_PRICE_IDS = {
  'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a5066a9c',
  'USDT': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'MATIC': '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
  'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
};

// Real Pyth price fetching - NO FALLBACKS
async function fetchPythPrices() {
  try {
    console.log('Fetching real prices from Pyth Network...');
    
    const prices = {};
    
    // Fetch each price individually from Pyth API
    for (const [token, priceId] of Object.entries(PYTH_PRICE_IDS)) {
      try {
        const response = await axios.get(`https://api.pyth.network/v1/price_feeds/${priceId}`, {
          timeout: 10000
        });
        
        if (response.data && response.data.price) {
          const price = parseFloat(response.data.price.price);
          const expo = response.data.price.expo || 0;
          const adjustedPrice = price * Math.pow(10, expo);
          prices[token] = adjustedPrice;
          console.log(`${token}: ${adjustedPrice} USD (from Pyth)`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${token} price:`, error.message);
        throw new Error(`Failed to fetch ${token} price from Pyth Network`);
      }
    }

    if (Object.keys(prices).length === 0) {
      throw new Error('No prices received from Pyth Network');
    }

    console.log('✅ Real Pyth prices fetched successfully:', prices);
    return {
      timestamp: Date.now(),
      prices,
      source: 'pyth'
    };
  } catch (error) {
    console.error('❌ Error fetching real Pyth prices:', error.message);
    throw new Error(`Failed to fetch real prices from Pyth Network: ${error.message}`);
  }
}

// Real Merkle tree generation
function generateRealMerkleTree(matchedSwaps) {
  console.log('Generating real Merkle tree...');
  
  // Create leaves from matched swaps
  const leaves = matchedSwaps.map(swap => {
    const leafData = {
      intentId: swap.intentId,
      userAddress: swap.userAddress,
      fromToken: swap.fromToken,
      toToken: swap.toToken,
      fromChain: swap.fromChain,
      toChain: swap.toChain,
      amount: swap.amount,
      recipient: swap.recipient,
      netAmount: swap.netAmount,
      matchedWith: swap.matchedWith
    };
    
    const leafString = JSON.stringify(leafData, Object.keys(leafData).sort());
    return keccak256(leafString);
  });
  
  // Generate real Merkle tree
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();
  
  // Generate real proofs
  const proofs = {};
  for (let i = 0; i < matchedSwaps.length; i++) {
    const swap = matchedSwaps[i];
    const leaf = leaves[i];
    const proof = tree.getHexProof(leaf);
    
    proofs[swap.intentId] = {
      leaf: leaf.toString('hex'),
      path: proof,
      indices: [i]
    };
  }
  
  console.log('✅ Real Merkle tree generated with root:', root);
  return { tree, root, proofs };
}

// Real netting algorithm
function performRealNetting(intents) {
  console.log('Performing real netting algorithm...');
  
  const matchedSwaps = [];
  const processedIds = new Set();
  
  // Group intents by token pairs
  const groups = {};
  for (const intent of intents) {
    const key = `${intent.fromToken}-${intent.toToken}-${intent.fromChain}-${intent.toChain}`;
    const reverseKey = `${intent.toToken}-${intent.fromToken}-${intent.toChain}-${intent.fromChain}`;
    
    if (!groups[key] && !groups[reverseKey]) {
      groups[key] = [];
    }
    
    const groupKey = groups[key] ? key : reverseKey;
    groups[groupKey].push(intent);
  }
  
  // Real matching logic
  for (const [key, groupIntents] of Object.entries(groups)) {
    if (groupIntents.length >= 2) {
      // Sort by amount for better matching
      groupIntents.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      
      // Match intents
      for (let i = 0; i < groupIntents.length - 1; i += 2) {
        const intent1 = groupIntents[i];
        const intent2 = groupIntents[i + 1];
        
        const amount1 = parseFloat(intent1.amount);
        const amount2 = parseFloat(intent2.amount);
        const matchAmount = Math.min(amount1, amount2);
        
        // Create matched swaps
        matchedSwaps.push({
          intentId: intent1.id,
          userAddress: intent1.userAddress,
          fromToken: intent1.fromToken,
          toToken: intent1.toToken,
          fromChain: intent1.fromChain,
          toChain: intent1.toChain,
          amount: intent1.amount,
          recipient: intent1.recipient,
          matchedWith: intent2.id,
          netAmount: matchAmount.toString()
        });
        
        matchedSwaps.push({
          intentId: intent2.id,
          userAddress: intent2.userAddress,
          fromToken: intent2.fromToken,
          toToken: intent2.toToken,
          fromChain: intent2.fromChain,
          toChain: intent2.toChain,
          amount: intent2.amount,
          recipient: intent2.recipient,
          matchedWith: intent1.id,
          netAmount: matchAmount.toString()
        });
        
        processedIds.add(intent1.id);
        processedIds.add(intent2.id);
      }
    }
  }
  
  // Handle unmatched intents
  for (const intent of intents) {
    if (!processedIds.has(intent.id)) {
      matchedSwaps.push({
        intentId: intent.id,
        userAddress: intent.userAddress,
        fromToken: intent.fromToken,
        toToken: intent.toToken,
        fromChain: intent.fromChain,
        toChain: intent.toChain,
        amount: intent.amount,
        recipient: intent.recipient,
        netAmount: intent.amount
      });
    }
  }
  
  console.log(`✅ Real netting complete: ${matchedSwaps.length} swaps processed`);
  return matchedSwaps;
}

// Routes

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'anchor-batch-engine-pyth'
  });
});

app.post('/api/intent', (req, res) => {
  try {
    const intent = {
      id: `intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userAddress: req.body.userAddress,
      fromToken: req.body.fromToken,
      toToken: req.body.toToken,
      fromChain: req.body.fromChain,
      toChain: req.body.toChain,
      amount: req.body.amount,
      recipient: req.body.recipient || req.body.userAddress,
      timestamp: Date.now(),
      status: 'pending'
    };

    intents.push(intent);
    
    res.json({
      success: true,
      intentId: intent.id,
      message: 'Intent submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit intent'
    });
  }
});

app.post('/api/batch/process', async (req, res) => {
  try {
    const pendingIntents = intents.filter(intent => intent.status === 'pending');
    
    if (pendingIntents.length === 0) {
      return res.json({
        success: false,
        message: 'No pending intents to process'
      });
    }

    batchCounter++;
    const batchId = `batch-${batchCounter}`;
    
    console.log(`Processing real batch ${batchId} with ${pendingIntents.length} intents`);
    
    // Fetch real Pyth prices - NO FALLBACKS
    const priceData = await fetchPythPrices();
    
    // Perform real netting
    const matchedSwaps = performRealNetting(pendingIntents);
    
    // Generate real Merkle tree
    const { tree, root, proofs } = generateRealMerkleTree(matchedSwaps);
    
    // Update intent statuses
    for (const intent of pendingIntents) {
      intent.status = 'matched';
      intent.batchId = batchId;
    }
    
    // Calculate real statistics
    const totalOriginalAmount = matchedSwaps.reduce((sum, swap) => 
      sum + parseFloat(swap.amount), 0
    );
    const totalNetAmount = matchedSwaps.reduce((sum, swap) => 
      sum + parseFloat(swap.netAmount), 0
    );
    const nettedAmount = (totalOriginalAmount - totalNetAmount).toString();
    
    const poolFilled = matchedSwaps
      .filter(swap => !swap.matchedWith)
      .reduce((sum, swap) => sum + parseFloat(swap.netAmount), 0)
      .toString();

    const batchResult = {
      batchId,
      summary: {
        batchId,
        timestamp: Date.now(),
        merkleRoot: root,
        totalIntents: matchedSwaps.length,
        matchedSwaps: matchedSwaps.filter(s => s.matchedWith).length,
        nettedAmount,
        poolFilled,
        priceData,
        chainSummaries: []
      },
      merkleProofs: proofs,
      rawData: JSON.stringify({ batchId, intents: pendingIntents, matchedSwaps })
    };

    res.json({
      success: true,
      batchResult
    });
  } catch (error) {
    console.error('Error processing batch:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/queue/stats', (req, res) => {
  try {
    const stats = {
      total: intents.length,
      pending: intents.filter(i => i.status === 'pending').length,
      processed: intents.filter(i => i.status !== 'pending').length
    };
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue stats'
    });
  }
});

app.get('/api/intents', (req, res) => {
  try {
    res.json({
      success: true,
      intents
    });
  } catch (error) {
    console.error('Error getting intents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get intents'
    });
  }
});

app.post('/api/simulate', (req, res) => {
  try {
    const { count = 10 } = req.body;
    const tokens = ['USDC', 'USDT', 'ETH', 'MATIC'];
    const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
    
    const simulatedIntents = [];
    
    for (let i = 0; i < count; i++) {
      const fromToken = tokens[Math.floor(Math.random() * tokens.length)];
      const toToken = tokens[Math.floor(Math.random() * tokens.length)];
      const fromChain = chains[Math.floor(Math.random() * chains.length)];
      const toChain = chains[Math.floor(Math.random() * chains.length)];
      
      // Skip if same token or same chain
      if (fromToken === toToken || fromChain === toChain) {
        continue;
      }
      
      const intent = {
        id: `sim-${Date.now()}-${i}`,
        userAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        fromToken,
        toToken,
        fromChain,
        toChain,
        amount: (Math.random() * 1000 + 100).toFixed(2),
        recipient: `0x${Math.random().toString(16).substr(2, 40)}`,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      intents.push(intent);
      simulatedIntents.push(intent);
    }
    
    res.json({
      success: true,
      message: `Generated ${simulatedIntents.length} simulated intents`,
      intents: simulatedIntents
    });
  } catch (error) {
    console.error('Error simulating intents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate intents'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Anchor Batch Engine (PYTH ONLY) running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📝 API docs: http://localhost:${port}/api`);
  console.log(`🔗 Pyth Network integration: REAL PRICES ONLY`);
});
