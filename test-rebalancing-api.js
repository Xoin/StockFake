#!/usr/bin/env node

/**
 * API Integration Test for Index Fund Rebalancing
 * This script tests the API endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest('/api/time');
      console.log('✓ Server is ready\n');
      return true;
    } catch (error) {
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  throw new Error('Server did not start in time');
}

async function runTests() {
  console.log('=== Index Fund Rebalancing API Test ===\n');

  // Wait for server
  console.log('Waiting for server...');
  await waitForServer();

  // Test 1: Get rebalancing history
  console.log('Test 1: GET /api/indexfunds/:symbol/rebalancing');
  try {
    const response = await makeRequest('/api/indexfunds/SPX500/rebalancing?limit=5');
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    
    console.log(`✓ Retrieved ${response.data.length} rebalancing event(s)`);
    if (response.data.length > 0) {
      console.log(`  Latest: ${response.data[0].triggerType} on ${response.data[0].date}`);
    }
    console.log('');
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }

  // Test 2: Get current weights
  console.log('Test 2: GET /api/indexfunds/:symbol/weights');
  try {
    const response = await makeRequest('/api/indexfunds/TECH100/weights');
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    
    const weights = response.data.weights || [];
    console.log(`✓ Retrieved ${weights.length} constituent weights`);
    if (weights.length > 0) {
      console.log(`  Sample: ${weights[0].symbol} = ${(weights[0].weight * 100).toFixed(2)}%`);
    }
    console.log('');
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }

  // Test 3: Get rebalancing config
  console.log('Test 3: GET /api/indexfunds/:symbol/config');
  try {
    const response = await makeRequest('/api/indexfunds/SPX500/config');
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    
    console.log('✓ Retrieved rebalancing configuration');
    console.log(`  Strategy: ${response.data.strategy}`);
    console.log(`  Frequency: ${response.data.frequency}`);
    console.log(`  Drift threshold: ${(response.data.driftThreshold * 100).toFixed(2)}%`);
    console.log('');
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }

  // Test 4: Update rebalancing config
  console.log('Test 4: POST /api/indexfunds/:symbol/config');
  try {
    const updateData = {
      frequency: 'monthly',
      driftThreshold: 0.10
    };
    
    const response = await makeRequest('/api/indexfunds/SPX500/config', 'POST', updateData);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    
    console.log('✓ Updated rebalancing configuration');
    console.log(`  New frequency: ${response.data.config.frequency}`);
    console.log(`  New drift threshold: ${(response.data.config.driftThreshold * 100).toFixed(2)}%`);
    console.log('');
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }

  // Test 5: Manual rebalancing trigger
  console.log('Test 5: POST /api/indexfunds/:symbol/rebalance');
  try {
    const response = await makeRequest('/api/indexfunds/DJIA30/rebalance', 'POST');
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    
    console.log('✓ Manual rebalancing triggered');
    console.log(`  Constituents: ${response.data.result.constituents}`);
    console.log(`  Trigger type: ${response.data.result.triggerType}`);
    console.log('');
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }

  // Test 6: Get all rebalancing events
  console.log('Test 6: GET /api/rebalancing/events');
  try {
    const response = await makeRequest('/api/rebalancing/events?limit=20');
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    
    console.log(`✓ Retrieved ${response.data.length} rebalancing event(s) across all funds`);
    if (response.data.length > 0) {
      const fundCounts = {};
      for (const event of response.data) {
        fundCounts[event.fundSymbol] = (fundCounts[event.fundSymbol] || 0) + 1;
      }
      console.log(`  Funds with events: ${Object.keys(fundCounts).join(', ')}`);
    }
    console.log('');
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }

  console.log('=== All API Tests Passed! ===');
  console.log('\nRebalancing API endpoints are functioning correctly.');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error.message);
  process.exit(1);
});
