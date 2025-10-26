// SettlementContract ABI (main functions only)
export const SETTLEMENT_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "bytes32", name: "batchId", type: "bytes32" },
          { internalType: "bytes32", name: "merkleRoot", type: "bytes32" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "totalIntents", type: "uint256" },
          { internalType: "bool", name: "isSettled", type: "bool" },
          { internalType: "string", name: "priceDataHash", type: "string" }
        ],
        internalType: "struct SettlementContract.BatchData",
        name: "batchData",
        type: "tuple"
      },
      { internalType: "string[]", name: "tokens", type: "string[]" },
      { internalType: "uint256[]", name: "prices", type: "uint256[]" }
    ],
    name: "settleBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "batchId", type: "bytes32" },
      { indexed: true, internalType: "bytes32", name: "merkleRoot", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "totalIntents", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "BatchSettled",
    type: "event"
  },
  {
    inputs: [
      {
        components: [
          { internalType: "bytes32", name: "intentId", type: "bytes32" },
          { internalType: "address", name: "userAddress", type: "address" },
          { internalType: "string", name: "fromToken", type: "string" },
          { internalType: "string", name: "toToken", type: "string" },
          { internalType: "string", name: "fromChain", type: "string" },
          { internalType: "string", name: "toChain", type: "string" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "netAmount", type: "uint256" },
          { internalType: "bytes32", name: "matchedWith", type: "bytes32" }
        ],
        internalType: "struct SettlementContract.SwapIntent",
        name: "intent",
        type: "tuple"
      },
      {
        components: [
          { internalType: "bytes32", name: "leaf", type: "bytes32" },
          { internalType: "bytes32[]", name: "path", type: "bytes32[]" },
          { internalType: "uint256[]", name: "indices", type: "uint256[]" }
        ],
        internalType: "struct SettlementContract.MerkleProof",
        name: "proof",
        type: "tuple"
      },
      { internalType: "bytes32", name: "batchId", type: "bytes32" }
    ],
    name: "claimIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "claimedIntents",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
