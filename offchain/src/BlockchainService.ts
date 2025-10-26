import { ethers } from 'ethers';
import { SwapIntent } from './types';

export interface BatchData {
  batchId: string;
  merkleRoot: string;
  totalIntents: number;
  priceData: {
    prices: Record<string, number>;
  };
}

export interface SettlementResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private settlementContract: ethers.Contract;
  private tokenManagerContract: ethers.Contract;

  constructor() {
    // Initialize provider for Sepolia testnet (using Alchemy RPC for demo)
    this.provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
    
    // Initialize wallet with test private key (in production, use environment variable)
    // This is a test private key - DO NOT USE IN PRODUCTION
    const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Contract addresses from deployment
    const settlementAddress = '0xec69dBE31F53DC6882f3Bc2DEe53Fabde9Ec2Ba9';
    const tokenManagerAddress = '0x9b8c2c0491FF27b89D9e2Bc776aBF3F910EbCd9f';
    
    // Contract ABIs (simplified for now)
    const settlementABI = [
      'function settleBatch(bytes32 batchId, bytes32 merkleRoot, uint256 timestamp, uint256 totalIntents, bytes32 priceDataHash) external',
      'function isBatchSettled(bytes32 batchId) external view returns (bool)'
    ];
    
    const tokenManagerABI = [
      'function transfer(address token, address to, uint256 amount) external',
      'function balanceOf(address token, address account) external view returns (uint256)'
    ];
    
    this.settlementContract = new ethers.Contract(settlementAddress, settlementABI, this.wallet);
    this.tokenManagerContract = new ethers.Contract(tokenManagerAddress, tokenManagerABI, this.wallet);
  }

  /**
   * Settle a batch on-chain
   */
  async settleBatch(batchData: BatchData): Promise<SettlementResult> {
    try {
      console.log(`🚀 Starting real on-chain settlement for batch ${batchData.batchId}`);
      
      // Check if batch is already settled
      const batchIdHash = ethers.keccak256(ethers.toUtf8Bytes(batchData.batchId));
      const isAlreadySettled = await this.settlementContract.isBatchSettled(batchIdHash);
      
      if (isAlreadySettled) {
        console.log(`⚠️  Batch ${batchData.batchId} already settled`);
        return { success: true, transactionHash: 'already-settled' };
      }
      
      // Prepare settlement data
      const merkleRoot = batchData.merkleRoot.startsWith('0x') ? batchData.merkleRoot : `0x${batchData.merkleRoot}`;
      const timestamp = Math.floor(Date.now() / 1000);
      const totalIntents = batchData.totalIntents;
      const priceDataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(batchData.priceData.prices)));
      
      console.log(`📝 Settlement data:`);
      console.log(`   Batch ID: ${batchData.batchId}`);
      console.log(`   Merkle Root: ${merkleRoot}`);
      console.log(`   Timestamp: ${timestamp}`);
      console.log(`   Total Intents: ${totalIntents}`);
      console.log(`   Price Data Hash: ${priceDataHash}`);
      
      // Estimate gas
      const gasEstimate = await this.settlementContract.settleBatch.estimateGas(
        batchIdHash,
        merkleRoot,
        timestamp,
        totalIntents,
        priceDataHash
      );
      
      console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);
      
      // Execute settlement transaction
      const tx = await this.settlementContract.settleBatch(
        batchIdHash,
        merkleRoot,
        timestamp,
        totalIntents,
        priceDataHash,
        {
          gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
        }
      );
      
      console.log(`📤 Transaction submitted: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Batch ${batchData.batchId} settled successfully on-chain!`);
        console.log(`🔗 Transaction: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        return {
          success: true,
          transactionHash: tx.hash
        };
      } else {
        console.log(`❌ Transaction failed`);
        return {
          success: false,
          error: 'Transaction failed'
        };
      }
      
    } catch (error: any) {
      console.error(`❌ On-chain settlement failed:`, error.message);
      
      // If it's a gas estimation error, try with a fallback
      if (error.message.includes('gas')) {
        console.log(`🔄 Retrying with fallback gas limit...`);
        try {
          const tx = await this.settlementContract.settleBatch(
            ethers.keccak256(ethers.toUtf8Bytes(batchData.batchId)),
            batchData.merkleRoot.startsWith('0x') ? batchData.merkleRoot : `0x${batchData.merkleRoot}`,
            Math.floor(Date.now() / 1000),
            batchData.totalIntents,
            ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(batchData.priceData.prices))),
            {
              gasLimit: 500000n, // Fallback gas limit
            }
          );
          
          const receipt = await tx.wait();
          if (receipt.status === 1) {
            return {
              success: true,
              transactionHash: tx.hash
            };
          }
        } catch (retryError: any) {
          console.error(`❌ Retry also failed:`, retryError.message);
        }
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check wallet balance
   */
  async getWalletBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return '0';
    }
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }
}
