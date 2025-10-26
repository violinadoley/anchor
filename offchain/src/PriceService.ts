import axios from 'axios';
import { PriceData } from './types';

export class PriceService {
  private readonly PYTH_API_URL = 'https://hermes.pyth.network/v2/updates/price/latest';
  private readonly TOKEN_MAPPING = {
    'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    'USDT': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'MATIC': '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
    'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
  };

  /**
   * Fetch current prices from Pyth Network
   */
  public async fetchPrices(): Promise<PriceData> {
    try {
      console.log('Fetching prices from Pyth Network...');
      
      const priceIds = Object.values(this.TOKEN_MAPPING);
      const response = await axios.post(this.PYTH_API_URL, {
        ids: priceIds
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const prices: Record<string, number> = {};
      
      if (response.data && response.data.parsed) {
        for (const [token, priceId] of Object.entries(this.TOKEN_MAPPING)) {
          const priceData = response.data.parsed[priceId];
          if (priceData && priceData.price && priceData.expo) {
            // Convert from Pyth format (price * 10^expo) to USD
            prices[token] = priceData.price * Math.pow(10, priceData.expo);
          }
        }
      }

      console.log('Prices fetched successfully:', prices);

      return {
        timestamp: Date.now(),
        prices,
        source: 'pyth'
      };
    } catch (error) {
      console.error('Error fetching prices from Pyth:', error);
      
      // Fallback to mock prices for development
      return this.getMockPrices();
    }
  }

  /**
   * Get mock prices for development/testing
   */
  private getMockPrices(): PriceData {
    console.log('Using mock prices for development');
    
    return {
      timestamp: Date.now(),
      prices: {
        'USDC': 1.0,
        'USDT': 1.0,
        'ETH': 2000.0,
        'MATIC': 0.8,
        'BTC': 45000.0
      },
      source: 'mock'
    };
  }

  /**
   * Get price for a specific token
   */
  public async getTokenPrice(token: string): Promise<number> {
    const priceData = await this.fetchPrices();
    return priceData.prices[token] || 0;
  }

  /**
   * Convert amount from one token to another using current prices
   */
  public async convertAmount(
    amount: string,
    fromToken: string,
    toToken: string
  ): Promise<string> {
    const prices = await this.fetchPrices();
    const fromPrice = prices.prices[fromToken] || 0;
    const toPrice = prices.prices[toToken] || 0;

    if (fromPrice === 0 || toPrice === 0) {
      throw new Error(`Price not available for ${fromToken} or ${toToken}`);
    }

    const amountInUSD = parseFloat(amount) * fromPrice;
    const convertedAmount = amountInUSD / toPrice;

    return convertedAmount.toFixed(6);
  }
}
