"use client";

import { useEffect, useState } from 'react';
import { useNexus } from './NexusInit';

export function UnifiedBalances() {
  const { nexus, isInitialized } = useNexus();
  const [isReady, setIsReady] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (nexus && isInitialized) {
      setIsReady(true);
      // Fetch balances when Nexus is ready
      fetchBalances();
    } else {
      setIsReady(false);
    }
  }, [nexus, isInitialized]);

  const fetchBalances = async () => {
    if (!nexus) return;
    
    try {
      setIsLoading(true);
      console.log('📊 Fetching balances via Nexus SDK...');
      
      // Use the actual SDK method
      const data = await nexus.getUnifiedBalances();
      setBalances(data || []);
      console.log('✅ Real balances fetched from Nexus SDK:', data);
    } catch (error) {
      console.error('❌ Error fetching balances from Nexus SDK:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return null;
  }

  return null;
}
