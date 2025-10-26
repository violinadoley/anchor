const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory storage
let intents = [];
let batchCounter = 0;

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'anchor-batch-engine'
  });
});

/**
 * Submit intent endpoint
 */
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

/**
 * Process batch endpoint
 */
app.post('/api/batch/process', (req, res) => {
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
    
    // Simple netting simulation
    const matchedSwaps = [];
    const processedIds = new Set();
    
    // Group by token pairs
    const groups = {};
    for (const intent of pendingIntents) {
      const key = `${intent.fromToken}-${intent.toToken}-${intent.fromChain}-${intent.toChain}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(intent);
    }
    
    // Simple matching logic
    for (const [key, groupIntents] of Object.entries(groups)) {
      if (groupIntents.length >= 2) {
        // Match first two intents
        const intent1 = groupIntents[0];
        const intent2 = groupIntents[1];
        
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
          netAmount: Math.min(parseFloat(intent1.amount), parseFloat(intent2.amount)).toString()
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
          netAmount: Math.min(parseFloat(intent1.amount), parseFloat(intent2.amount)).toString()
        });
        
        processedIds.add(intent1.id);
        processedIds.add(intent2.id);
      }
    }
    
    // Add unmatched intents
    for (const intent of pendingIntents) {
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
    
    // Update intent statuses
    for (const intent of pendingIntents) {
      intent.status = 'matched';
      intent.batchId = batchId;
    }
    
    // Generate mock Merkle root
    const merkleRoot = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    const batchResult = {
      batchId,
      summary: {
        batchId,
        timestamp: Date.now(),
        merkleRoot,
        totalIntents: matchedSwaps.length,
        matchedSwaps: matchedSwaps.filter(s => s.matchedWith).length,
        nettedAmount: '100.50',
        poolFilled: '50.25',
        priceData: {
          timestamp: Date.now(),
          prices: { USDC: 1.0, USDT: 1.0, ETH: 2000.0, MATIC: 0.8 },
          source: 'mock'
        },
        chainSummaries: []
      },
      merkleProofs: {},
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
      error: 'Failed to process batch'
    });
  }
});

/**
 * Get queue statistics
 */
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

/**
 * Get all intents
 */
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

/**
 * Simulate multiple intents for testing
 */
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
  console.log(`🚀 Anchor Batch Engine running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📝 API docs: http://localhost:${port}/api`);
});
