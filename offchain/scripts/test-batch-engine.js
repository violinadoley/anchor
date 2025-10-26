const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBatchEngine() {
  console.log('🧪 Testing Anchor Batch Engine...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Simulate some intents
    console.log('\n2. Simulating intents...');
    const simulateResponse = await axios.post(`${BASE_URL}/api/simulate`, {
      count: 10
    });
    console.log('✅ Intents simulated:', simulateResponse.data.message);

    // Test 3: Check queue stats
    console.log('\n3. Checking queue stats...');
    const statsResponse = await axios.get(`${BASE_URL}/api/queue/stats`);
    console.log('✅ Queue stats:', statsResponse.data.stats);

    // Test 4: Process batch
    console.log('\n4. Processing batch...');
    const batchResponse = await axios.post(`${BASE_URL}/api/batch/process`);
    if (batchResponse.data.success) {
      console.log('✅ Batch processed successfully!');
      console.log('📊 Batch summary:');
      console.log(`   - Batch ID: ${batchResponse.data.batchResult.batchId}`);
      console.log(`   - Total intents: ${batchResponse.data.batchResult.summary.totalIntents}`);
      console.log(`   - Matched swaps: ${batchResponse.data.batchResult.summary.matchedSwaps}`);
      console.log(`   - Netted amount: ${batchResponse.data.batchResult.summary.nettedAmount}`);
      console.log(`   - Pool filled: ${batchResponse.data.batchResult.summary.poolFilled}`);
      console.log(`   - Merkle root: ${batchResponse.data.batchResult.summary.merkleRoot.substring(0, 20)}...`);
    } else {
      console.log('❌ Batch processing failed:', batchResponse.data.message);
    }

    // Test 5: Check final queue stats
    console.log('\n5. Final queue stats...');
    const finalStatsResponse = await axios.get(`${BASE_URL}/api/queue/stats`);
    console.log('✅ Final queue stats:', finalStatsResponse.data.stats);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testBatchEngine();
