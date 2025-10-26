import { SwapIntent, MatchedSwap } from './types';

export class NettingEngine {
  /**
   * Main netting algorithm that matches intents to minimize liquidity requirements
   */
  public processIntents(intents: SwapIntent[]): MatchedSwap[] {
    console.log(`Processing ${intents.length} intents for netting`);
    
    const matchedSwaps: MatchedSwap[] = [];
    const processedIntentIds = new Set<string>();
    
    // Group intents by token pair and direction
    const intentGroups = this.groupIntentsByTokenPair(intents);
    
    // Process each token pair group
    for (const [tokenPair, groupIntents] of intentGroups.entries()) {
      const { fromToken, toToken, fromChain, toChain } = groupIntents[0];
      
      console.log(`Processing ${groupIntents.length} intents for ${fromToken}->${toToken} on ${fromChain}->${toChain}`);
      
      // Separate into buy and sell orders
      const buyOrders = groupIntents.filter(intent => 
        intent.fromToken === fromToken && intent.toToken === toToken
      );
      const sellOrders = groupIntents.filter(intent => 
        intent.fromToken === toToken && intent.toToken === fromToken
      );
      
      // Match buy and sell orders
      const matches = this.matchOrders(buyOrders, sellOrders);
      
      // Add matched swaps to results
      for (const match of matches) {
        matchedSwaps.push(match);
        processedIntentIds.add(match.intentId);
      }
    }
    
    // Handle unmatched intents (will be filled by pool)
    for (const intent of intents) {
      if (!processedIntentIds.has(intent.id)) {
        matchedSwaps.push({
          intentId: intent.id,
          userAddress: intent.userAddress,
          fromToken: intent.fromToken,
          toToken: intent.toToken,
          fromChain: intent.fromChain,
          toChain: intent.toChain,
          amount: intent.amount,
          recipient: intent.recipient,
          netAmount: intent.amount // Full amount needs pool liquidity
        });
      }
    }
    
    console.log(`Netting complete: ${matchedSwaps.length} swaps processed`);
    return matchedSwaps;
  }
  
  private groupIntentsByTokenPair(intents: SwapIntent[]): Map<string, SwapIntent[]> {
    const groups = new Map<string, SwapIntent[]>();
    
    for (const intent of intents) {
      // Create a key that represents both directions of the token pair
      const key1 = `${intent.fromToken}-${intent.toToken}-${intent.fromChain}-${intent.toChain}`;
      const key2 = `${intent.toToken}-${intent.fromToken}-${intent.toChain}-${intent.fromChain}`;
      
      // Check if we already have a group for either direction
      let groupKey = key1;
      if (groups.has(key2)) {
        groupKey = key2;
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      
      groups.get(groupKey)!.push(intent);
    }
    
    return groups;
  }
  
  private matchOrders(buyOrders: SwapIntent[], sellOrders: SwapIntent[]): MatchedSwap[] {
    const matches: MatchedSwap[] = [];
    const processedBuyIds = new Set<string>();
    const processedSellIds = new Set<string>();
    
    // Sort orders by amount (largest first for better matching)
    buyOrders.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    sellOrders.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    
    for (const buyOrder of buyOrders) {
      if (processedBuyIds.has(buyOrder.id)) continue;
      
      const buyAmount = parseFloat(buyOrder.amount);
      let remainingBuyAmount = buyAmount;
      
      for (const sellOrder of sellOrders) {
        if (processedSellIds.has(sellOrder.id)) continue;
        
        const sellAmount = parseFloat(sellOrder.amount);
        const matchAmount = Math.min(remainingBuyAmount, sellAmount);
        
        if (matchAmount > 0) {
          // Create matched swap for buy order
          matches.push({
            intentId: buyOrder.id,
            userAddress: buyOrder.userAddress,
            fromToken: buyOrder.fromToken,
            toToken: buyOrder.toToken,
            fromChain: buyOrder.fromChain,
            toChain: buyOrder.toChain,
            amount: buyOrder.amount,
            recipient: buyOrder.recipient,
            matchedWith: sellOrder.id,
            netAmount: matchAmount.toString()
          });
          
          // Create matched swap for sell order
          matches.push({
            intentId: sellOrder.id,
            userAddress: sellOrder.userAddress,
            fromToken: sellOrder.fromToken,
            toToken: sellOrder.toToken,
            fromChain: sellOrder.fromChain,
            toChain: sellOrder.toChain,
            amount: sellOrder.amount,
            recipient: sellOrder.recipient,
            matchedWith: buyOrder.id,
            netAmount: matchAmount.toString()
          });
          
          remainingBuyAmount -= matchAmount;
          
          if (remainingBuyAmount <= 0) {
            processedBuyIds.add(buyOrder.id);
            break;
          }
        }
      }
      
      if (remainingBuyAmount > 0) {
        // Partial match - remaining amount needs pool liquidity
        matches.push({
          intentId: buyOrder.id,
          userAddress: buyOrder.userAddress,
          fromToken: buyOrder.fromToken,
          toToken: buyOrder.toToken,
          fromChain: buyOrder.fromChain,
          toChain: buyOrder.toChain,
          amount: buyOrder.amount,
          recipient: buyOrder.recipient,
          netAmount: remainingBuyAmount.toString()
        });
        processedBuyIds.add(buyOrder.id);
      }
    }
    
    // Handle unmatched sell orders
    for (const sellOrder of sellOrders) {
      if (!processedSellIds.has(sellOrder.id)) {
        matches.push({
          intentId: sellOrder.id,
          userAddress: sellOrder.userAddress,
          fromToken: sellOrder.fromToken,
          toToken: sellOrder.toToken,
          fromChain: sellOrder.fromChain,
          toChain: sellOrder.toChain,
          amount: sellOrder.amount,
          recipient: sellOrder.recipient,
          netAmount: sellOrder.amount
        });
      }
    }
    
    return matches;
  }
}
