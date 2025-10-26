import { v4 as uuidv4 } from 'uuid';
import { IntentQueue } from './IntentQueue';
import { NettingEngine } from './NettingEngine';
import { MerkleTreeGenerator } from './MerkleTreeGenerator';
import { PriceService } from './PriceService';
import { SwapIntent, BatchResult, BatchSummary, ChainSummary, TokenFlow } from './types';

export class BatchEngine {
  private intentQueue: IntentQueue;
  private nettingEngine: NettingEngine;
  private merkleTreeGenerator: MerkleTreeGenerator;
  private priceService: PriceService;

  constructor() {
    this.intentQueue = new IntentQueue();
    this.nettingEngine = new NettingEngine();
    this.merkleTreeGenerator = new MerkleTreeGenerator();
    this.priceService = new PriceService();
  }

  /**
   * Process a batch of intents
   */
  public async processBatch(): Promise<BatchResult | null> {
    const pendingIntents = this.intentQueue.getPendingIntents();
    
    if (pendingIntents.length === 0) {
      console.log('No pending intents to process');
      return null;
    }

    console.log(`Processing batch with ${pendingIntents.length} intents`);

    // Generate batch ID
    const batchId = `batch-${uuidv4()}`;
    
    // Update intent statuses
    for (const intent of pendingIntents) {
      this.intentQueue.updateIntentStatus(intent.id, 'matched', batchId);
    }

    try {
      // Fetch current prices
      const priceData = await this.priceService.fetchPrices();
      
      // Process intents through netting engine
      const matchedSwaps = this.nettingEngine.processIntents(pendingIntents);
      
      // Generate Merkle tree and proofs
      const { tree, root, proofs } = this.merkleTreeGenerator.generateMerkleTree(matchedSwaps);
      
      // Generate batch summary
      const summary = await this.generateBatchSummary(batchId, matchedSwaps, priceData, root);
      
      // Create batch result
      const batchResult: BatchResult = {
        batchId,
        summary,
        merkleProofs: proofs,
        rawData: JSON.stringify({
          batchId,
          intents: pendingIntents,
          matchedSwaps,
          priceData,
          timestamp: Date.now()
        })
      };

      console.log(`Batch ${batchId} processed successfully`);
      console.log(`Summary: ${summary.matchedSwaps} matched swaps, ${summary.nettedAmount} netted amount`);
      
      return batchResult;
    } catch (error) {
      console.error('Error processing batch:', error);
      
      // Revert intent statuses on error
      for (const intent of pendingIntents) {
        this.intentQueue.updateIntentStatus(intent.id, 'pending');
      }
      
      return null;
    }
  }

  /**
   * Generate batch summary with chain flow analysis
   */
  private async generateBatchSummary(
    batchId: string,
    matchedSwaps: any[],
    priceData: any,
    merkleRoot: string
  ): Promise<BatchSummary> {
    const chainSummaries = this.analyzeChainFlows(matchedSwaps);
    
    // Calculate netted amount (amount saved through matching)
    const totalOriginalAmount = matchedSwaps.reduce((sum, swap) => 
      sum + parseFloat(swap.amount), 0
    );
    const totalNetAmount = matchedSwaps.reduce((sum, swap) => 
      sum + parseFloat(swap.netAmount || swap.amount), 0
    );
    const nettedAmount = (totalOriginalAmount - totalNetAmount).toString();
    
    // Calculate pool filled amount (unmatched portions)
    const poolFilled = matchedSwaps
      .filter(swap => !swap.matchedWith)
      .reduce((sum, swap) => sum + parseFloat(swap.netAmount || swap.amount), 0)
      .toString();

    return {
      batchId,
      timestamp: Date.now(),
      merkleRoot,
      totalIntents: matchedSwaps.length,
      matchedSwaps: matchedSwaps.filter(swap => swap.matchedWith).length,
      nettedAmount,
      poolFilled,
      priceData,
      chainSummaries
    };
  }

  /**
   * Analyze token flows across chains
   */
  private analyzeChainFlows(matchedSwaps: any[]): ChainSummary[] {
    const chainFlows = new Map<string, {
      inflows: Map<string, number>;
      outflows: Map<string, number>;
    }>();

    // Initialize chain flows
    for (const swap of matchedSwaps) {
      if (!chainFlows.has(swap.fromChain)) {
        chainFlows.set(swap.fromChain, {
          inflows: new Map(),
          outflows: new Map()
        });
      }
      if (!chainFlows.has(swap.toChain)) {
        chainFlows.set(swap.toChain, {
          inflows: new Map(),
          outflows: new Map()
        });
      }
    }

    // Calculate flows
    for (const swap of matchedSwaps) {
      const fromChain = chainFlows.get(swap.fromChain)!;
      const toChain = chainFlows.get(swap.toChain)!;
      
      // Outflow from source chain
      const currentOutflow = fromChain.outflows.get(swap.fromToken) || 0;
      fromChain.outflows.set(swap.fromToken, currentOutflow + parseFloat(swap.amount));
      
      // Inflow to destination chain
      const currentInflow = toChain.inflows.get(swap.toToken) || 0;
      toChain.inflows.set(swap.toToken, currentInflow + parseFloat(swap.netAmount || swap.amount));
    }

    // Convert to ChainSummary format
    const chainSummaries: ChainSummary[] = [];
    for (const [chainId, flows] of chainFlows.entries()) {
      const tokens: TokenFlow[] = [];
      
      // Add outflows
      for (const [token, amount] of flows.outflows.entries()) {
        tokens.push({
          token,
          amount: amount.toString(),
          direction: 'outflow'
        });
      }
      
      // Add inflows
      for (const [token, amount] of flows.inflows.entries()) {
        tokens.push({
          token,
          amount: amount.toString(),
          direction: 'inflow'
        });
      }

      const netInflow = tokens
        .filter(t => t.direction === 'inflow')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        .toString();
      
      const netOutflow = tokens
        .filter(t => t.direction === 'outflow')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        .toString();

      chainSummaries.push({
        chainId,
        netInflow,
        netOutflow,
        tokens
      });
    }

    return chainSummaries;
  }

  /**
   * Get queue statistics
   */
  public getQueueStats() {
    return this.intentQueue.getQueueStats();
  }

  /**
   * Add intent to queue
   */
  public addIntent(intent: SwapIntent) {
    this.intentQueue.addIntent(intent);
  }

  /**
   * Get all intents
   */
  public getAllIntents() {
    return this.intentQueue.getAllIntents();
  }

  /**
   * Update intent status
   */
  public updateIntentStatus(intentId: string, status: SwapIntent['status'], batchId?: string) {
    this.intentQueue.updateIntentStatus(intentId, status, batchId);
  }
}
