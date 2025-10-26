export interface SwapIntent {
  id: string;
  userAddress: string;
  fromToken: string;
  toToken: string;
  fromChain: string;
  toChain: string;
  amount: string;
  recipient: string;
  timestamp: number;
  status: 'pending' | 'matched' | 'settled' | 'failed';
  batchId?: string;
  settlementTxHash?: string;
  settledAt?: number;
  isDemo?: boolean;
  demoUser?: string;
}

export interface MatchedSwap {
  intentId: string;
  userAddress: string;
  fromToken: string;
  toToken: string;
  fromChain: string;
  toChain: string;
  amount: string;
  recipient: string;
  matchedWith?: string; // ID of the matched intent
  netAmount?: string; // Net amount after matching
}

export interface BatchSummary {
  batchId: string;
  timestamp: number;
  merkleRoot: string;
  totalIntents: number;
  matchedSwaps: number;
  nettedAmount: string;
  poolFilled: string;
  priceData: PriceData;
  chainSummaries: ChainSummary[];
}

export interface ChainSummary {
  chainId: string;
  netInflow: string;
  netOutflow: string;
  tokens: TokenFlow[];
}

export interface TokenFlow {
  token: string;
  amount: string;
  direction: 'inflow' | 'outflow';
}

export interface PriceData {
  timestamp: number;
  prices: Record<string, number>; // token -> price in USD
  source: string; // e.g., 'pyth'
}

export interface MerkleProof {
  leaf: string;
  path: string[];
  indices: number[];
}

export interface BatchResult {
  batchId: string;
  summary: BatchSummary;
  merkleProofs: Record<string, MerkleProof>; // intentId -> proof
  rawData: string; // JSON string of all batch data for DA
}
