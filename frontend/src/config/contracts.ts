// Contract addresses for different networks
export const CONTRACTS = {
  // Local Hardhat Network (for development)
  hardhat: {
    factory: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    settlement: "0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968",
    tokenManager: "0xeEBe00Ac0756308ac4AaBfD76c05c4F3088B8883",
    pythOracle: "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be",
    liquidityPool: "0x0000000000000000000000000000000000000000", // Not deployed locally
  },
  
  // Ethereum Sepolia Testnet
  sepolia: {
    factory: "0xfc4432AaE4041F4f425B74183801a55De5DB5C36",
    settlement: "0xec69dBE31F53DC6882f3Bc2DEe53Fabde9Ec2Ba9",
    tokenManager: "0x9b8c2c0491FF27b89D9e2Bc776aBF3F910EbCd9f",
    pythOracle: "0x5676a1346B8c0D60E61D459c984b2c771e93F938",
    liquidityPool: "0x2132905560710a9A9D14443b7067285a246E9670",
  },
  
  // Polygon Mumbai Testnet
  mumbai: {
    factory: "0x0000000000000000000000000000000000000000", // Will be updated after deployment
    settlement: "0x0000000000000000000000000000000000000000",
    tokenManager: "0x0000000000000000000000000000000000000000",
    pythOracle: "0x0000000000000000000000000000000000000000",
  },
  
  // Arbitrum Sepolia Testnet
  arbitrumSepolia: {
    factory: "0x0000000000000000000000000000000000000000", // Will be updated after deployment
    settlement: "0x0000000000000000000000000000000000000000",
    tokenManager: "0x0000000000000000000000000000000000000000",
    pythOracle: "0x0000000000000000000000000000000000000000",
  },
  
  // Optimism Sepolia Testnet
  optimismSepolia: {
    factory: "0x0000000000000000000000000000000000000000", // Will be updated after deployment
    settlement: "0x0000000000000000000000000000000000000000",
    tokenManager: "0x0000000000000000000000000000000000000000",
    pythOracle: "0x0000000000000000000000000000000000000000",
  },
};

// Network configuration
export const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: "Hardhat Local",
    rpcUrl: "http://localhost:8545",
    blockExplorer: "https://hardhat.dev",
  },
  sepolia: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  mumbai: {
    chainId: 80001,
    name: "Polygon Mumbai",
    rpcUrl: "https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://mumbai.polygonscan.com",
  },
  arbitrumSepolia: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia-explorer.arbitrum.io",
  },
  optimismSepolia: {
    chainId: 11155420,
    name: "Optimism Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
  },
};

// Get contract addresses for current network
export function getContracts(chainId: number) {
  const network = Object.entries(NETWORKS).find(([_, config]) => config.chainId === chainId);
  if (network) {
    return CONTRACTS[network[0] as keyof typeof CONTRACTS];
  }
  return CONTRACTS.hardhat; // Default to hardhat
}

// Get network info for current chain
export function getNetwork(chainId: number) {
  const network = Object.entries(NETWORKS).find(([_, config]) => config.chainId === chainId);
  return network ? network[1] : NETWORKS.hardhat;
}

// Map chain names to IDs
export const CHAIN_NAME_TO_ID: Record<string, number> = {
  'ethereum': 11155111,      // Sepolia
  'polygon': 80001,          // Mumbai
  'arbitrum': 421614,        // Arbitrum Sepolia
  'optimism': 11155420,      // Optimism Sepolia
  'base': 84532,             // Base Sepolia
};

// Map chain IDs to names
export const CHAIN_ID_TO_NAME: Record<number, string> = {
  11155111: 'ethereum',
  80001: 'polygon',
  421614: 'arbitrum',
  11155420: 'optimism',
  84532: 'base',
};
