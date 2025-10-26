/**
 * Multilateral Netting Engine
 * Uses graph-based optimization to minimize settlement volume across all intents
 * Based on flow optimization algorithms used in clearing houses
 */

class MultilateralNettingEngine {
  constructor() {
    this.intents = [];
  }

  /**
   * Build directed graph G(V, E) where:
   * - Nodes = users
   * - Edges = swap intents (amount, direction, tokens)
   * - Weights = amounts
   */
  buildGraph(intents) {
    const graph = {
      nodes: new Set(),
      edges: []
    };

    for (const intent of intents) {
      const fromNode = `${intent.userAddress}|${intent.fromToken}`;
      const toNode = `${intent.userAddress}|${intent.toToken}`;
      
      graph.nodes.add(intent.userAddress);
      
      graph.edges.push({
        from: fromNode,
        to: toNode,
        amount: parseFloat(intent.amount),
        intent: intent,
        token: intent.fromToken
      });
    }

    return graph;
  }

  /**
   * Compute net positions per user per token
   * Returns: Map<userAddress_token, netBalance>
   */
  computeNetPositions(intents) {
    const positions = new Map();

    for (const intent of intents) {
      const fromKey = `${intent.userAddress}_${intent.fromToken}`;
      const toKey = `${intent.userAddress}_${intent.toToken}`;
      
      const fromAmount = parseFloat(intent.amount);
      const toAmount = this.calculateOutputAmount(intent);

      // Debit from token
      positions.set(fromKey, (positions.get(fromKey) || 0) - fromAmount);
      
      // Credit to token
      positions.set(toKey, (positions.get(toKey) || 0) + toAmount);
    }

    return positions;
  }

  /**
   * Calculate output amount using price data
   */
  calculateOutputAmount(intent, prices = {}) {
    const fromPrice = prices[intent.fromToken] || 1;
    const toPrice = prices[intent.toToken] || 1;
    const exchangeRate = fromPrice / toPrice;
    return parseFloat(intent.amount) * exchangeRate;
  }

  /**
   * Aggregate edges for the same asset pairs
   * Returns: Map<tokenPair, totalAmount>
   */
  aggregateByTokenPair(intents) {
    const aggregated = new Map();

    for (const intent of intents) {
      const pairKey = `${intent.fromToken}-${intent.toToken}`;
      const current = aggregated.get(pairKey) || 0;
      aggregated.set(pairKey, current + parseFloat(intent.amount));
    }

    return aggregated;
  }

  /**
   * Solves min-cost flow problem to minimize settlement volume
   * Using greedy approach for simplicity (can be upgraded to LP solver)
   */
  solveMinFlow(positions, intents) {
    console.log('Solving min-cost flow optimization...');

    // Separate creditors and debtors
    const creditors = new Map();
    const debtors = new Map();

    for (const [key, balance] of positions.entries()) {
      if (balance > 0) {
        creditors.set(key, balance);
      } else if (balance < 0) {
        debtors.set(key, Math.abs(balance));
      }
    }

    console.log(`Creditors: ${creditors.size}, Debtors: ${debtors.size}`);

    // Match creditors with debtors (simplified greedy matching)
    const settlements = [];
    const processedCreditors = new Set();
    const processedDebtors = new Set();

    for (const [creditorKey, creditorAmount] of creditors.entries()) {
      if (processedCreditors.has(creditorKey)) continue;

      const [creditorUser, creditorToken] = creditorKey.split('_');
      
      // Find best matching debtor
      let bestMatch = null;
      let bestAmount = 0;

      for (const [debtorKey, debtorAmount] of debtors.entries()) {
        if (processedDebtors.has(debtorKey)) continue;

        const [debtorUser, debtorToken] = debtorKey.split('_');
        
        // Only match if same token
        if (debtorToken === creditorToken) {
          const matchAmount = Math.min(creditorAmount, debtorAmount);
          
          // Prioritize higher amounts for better netting
          if (matchAmount > bestAmount) {
            bestMatch = debtorKey;
            bestAmount = matchAmount;
          }
        }
      }

      if (bestMatch) {
        const [debtorUser, debtorToken] = bestMatch.split('_');
        
        settlements.push({
          from: debtorUser,
          to: creditorUser,
          token: creditorToken,
          amount: bestAmount,
          type: 'DIRECT_SETTLEMENT'
        });

        // Update amounts
        const remainingCredit = creditorAmount - bestAmount;
        const remainingDebt = debtors.get(bestMatch) - bestAmount;

        if (remainingCredit > 0.01) {
          creditors.set(creditorKey, remainingCredit);
        } else {
          processedCreditors.add(creditorKey);
        }

        if (remainingDebt > 0.01) {
          debtors.set(bestMatch, remainingDebt);
        } else {
          processedDebtors.add(bestMatch);
          debtors.delete(bestMatch);
        }
      }
    }

    // Remaining unmatched positions go to pool
    const poolFulfillments = [];
    
    for (const [creditorKey, amount] of creditors.entries()) {
      if (!processedCreditors.has(creditorKey) && amount > 0.01) {
        const [user, token] = creditorKey.split('_');
        poolFulfillments.push({
          user,
          token,
          amount,
          type: 'POOL_CREDIT'
        });
      }
    }

    for (const [debtorKey, amount] of debtors.entries()) {
      if (!processedDebtors.has(debtorKey) && amount > 0.01) {
        const [user, token] = debtorKey.split('_');
        poolFulfillments.push({
          user,
          token,
          amount,
          type: 'POOL_DEBIT'
        });
      }
    }

    return { settlements, poolFulfillments };
  }

  /**
   * Main netting function - applies graph-based optimization
   */
  performNetting(intents, prices = {}) {
    console.log('🔗 Starting Multilateral Netting...');
    console.log(`Processing ${intents.length} intents`);

    // Step 1: Build graph
    const graph = this.buildGraph(intents);
    console.log(`Graph built: ${graph.nodes.size} nodes, ${graph.edges.length} edges`);

    // Step 2: Compute net positions
    const positions = this.computeNetPositions(intents);
    console.log(`Net positions computed: ${positions.size} positions`);

    // Step 3: Aggregate by token pair
    const aggregated = this.aggregateByTokenPair(intents);
    console.log(`Token pairs: ${aggregated.size}`);

    // Step 4: Solve min-cost flow
    const result = this.solveMinFlow(positions, intents);

    // Calculate statistics
    const totalOriginalVolume = intents.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const directSettledVolume = result.settlements.reduce((sum, s) => sum + s.amount, 0);
    const nettedVolume = totalOriginalVolume - directSettledVolume;
    const nettingRatio = ((1 - directSettledVolume / totalOriginalVolume) * 100).toFixed(2);

    console.log(`📊 Netting Statistics:`);
    console.log(`  Total Original Volume: $${totalOriginalVolume.toFixed(2)}`);
    console.log(`  Direct Settled Volume: $${directSettledVolume.toFixed(2)}`);
    console.log(`  Netted Volume: $${nettedVolume.toFixed(2)}`);
    console.log(`  Netting Ratio: ${nettingRatio}%`);

    return {
      settlements: result.settlements,
      poolFulfillments: result.poolFulfillments,
      statistics: {
        totalOriginalVolume,
        directSettledVolume,
        nettedVolume,
        nettingRatio
      }
    };
  }
}

module.exports = MultilateralNettingEngine;
