import { SwapIntent } from './types';

export interface DemoUser {
  address: string;
  privateKey: string;
  name: string;
  description: string;
  hasFunds: boolean;
}

export class DemoUserManager {
  private demoUsers: DemoUser[] = [
    {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      name: 'Alice (Demo User 1)',
      description: 'Ethereum mainnet user',
      hasFunds: false
    },
    {
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      name: 'Bob (Demo User 2)',
      description: 'Polygon user',
      hasFunds: false
    },
    {
      address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      privateKey: '0x5de4111daeba5db4cc54f4c4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4',
      name: 'Charlie (Demo User 3)',
      description: 'Arbitrum user',
      hasFunds: false
    },
    {
      address: '0x90F79bf6EB2c4f870365E785982E1f101E9b2e6',
      privateKey: '0x7c852118294e51e653712a81e05800f5411412815a56e408a34f58c114d5a4b2',
      name: 'Diana (Demo User 4)',
      description: 'Optimism user',
      hasFunds: false
    },
    {
      address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
      name: 'Eve (Demo User 5)',
      description: 'Base user',
      hasFunds: false
    }
  ];

  /**
   * Get a random demo user
   */
  getRandomDemoUser(): DemoUser {
    const randomIndex = Math.floor(Math.random() * this.demoUsers.length);
    return this.demoUsers[randomIndex];
  }

  /**
   * Get all demo users
   */
  getAllDemoUsers(): DemoUser[] {
    return this.demoUsers;
  }

  /**
   * Get demo user by address
   */
  getDemoUserByAddress(address: string): DemoUser | undefined {
    return this.demoUsers.find(user => user.address.toLowerCase() === address.toLowerCase());
  }

  /**
   * Generate realistic swap intents using demo users
   */
  generateRealisticIntents(count: number): SwapIntent[] {
    const tokens = ['USDC', 'USDT', 'ETH', 'MATIC', 'ARB', 'OP'];
    const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'];
    const amounts = [100, 250, 500, 1000, 2000, 5000]; // Realistic amounts
    
    const intents: SwapIntent[] = [];
    
    for (let i = 0; i < count; i++) {
      const user = this.getRandomDemoUser();
      const fromToken = tokens[Math.floor(Math.random() * tokens.length)];
      const toToken = tokens[Math.floor(Math.random() * tokens.length)];
      const fromChain = chains[Math.floor(Math.random() * chains.length)];
      const toChain = chains[Math.floor(Math.random() * chains.length)];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      
      // Skip if same token or same chain
      if (fromToken === toToken || fromChain === toChain) {
        continue;
      }
      
      const intent: SwapIntent = {
        id: `demo-${Date.now()}-${i}`,
        userAddress: user.address,
        fromToken,
        toToken,
        fromChain,
        toChain,
        amount: amount.toString(),
        recipient: user.address, // Users send to themselves
        timestamp: Date.now(),
        status: 'pending',
        isDemo: true, // Mark as demo intent
        demoUser: user.name
      };
      
      intents.push(intent);
    }
    
    return intents;
  }

  /**
   * Get demo user info for display
   */
  getDemoUserInfo(): string {
    return this.demoUsers.map(user => 
      `${user.name}: ${user.address} (${user.description})`
    ).join('\n');
  }
}


