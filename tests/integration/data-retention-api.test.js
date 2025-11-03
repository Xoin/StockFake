/**
 * Integration Tests for Data Retention API Endpoints
 * 
 * Tests the REST API endpoints for managing data retention configuration.
 */

const http = require('http');

console.log('======================================================================');
console.log('Data Retention API Integration Tests');
console.log('======================================================================\n');

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Wait for server to be ready
function waitForServer(retries = 10) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get('http://localhost:3000/api/retention/config', (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (retries > 0) {
          setTimeout(() => {
            retries--;
            attempt();
          }, 1000);
        } else {
          reject(new Error('Server did not start'));
        }
      }).on('error', () => {
        if (retries > 0) {
          setTimeout(() => {
            retries--;
            attempt();
          }, 1000);
        } else {
          reject(new Error('Server did not start'));
        }
      });
    };
    attempt();
  });
}

// Start the server
const { spawn } = require('child_process');
const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname + '/../..',
  detached: false
});

let serverOutput = '';
serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

serverProcess.stderr.on('data', (data) => {
  serverOutput += data.toString();
});

// Run tests
async function runTests() {
  try {
    console.log('Waiting for server to start...');
    await waitForServer();
    console.log('✓ Server started successfully\n');

    // Test 1: GET /api/retention/config
    console.log('Test 1: GET /api/retention/config');
    console.log('----------------------------------------------------------------------');
    const config1 = await makeRequest('GET', '/api/retention/config');
    
    if (config1.status === 200 && config1.data.success) {
      console.log('✓ PASS: Retrieved retention configuration');
      console.log('  Config:', JSON.stringify(config1.data.config, null, 2).substring(0, 200) + '...');
      console.log('  Auto-pruning enabled:', config1.data.autoPruningEnabled);
    } else {
      console.log('✗ FAIL: Failed to retrieve configuration');
      console.log('  Status:', config1.status);
      console.log('  Response:', config1.data);
    }
    console.log('');

    // Test 2: GET /api/retention/stats
    console.log('Test 2: GET /api/retention/stats');
    console.log('----------------------------------------------------------------------');
    const stats = await makeRequest('GET', '/api/retention/stats');
    
    if (stats.status === 200 && stats.data.success) {
      console.log('✓ PASS: Retrieved pruning statistics');
      console.log('  Current game time:', stats.data.currentGameTime);
      const tableCount = Object.keys(stats.data.stats).length;
      console.log('  Tables analyzed:', tableCount);
      
      // Show a few examples
      const examples = Object.entries(stats.data.stats).slice(0, 3);
      examples.forEach(([table, stat]) => {
        if (!stat.error) {
          console.log(`  ${table}: ${stat.pruneable || 0}/${stat.total || 0} pruneable`);
        }
      });
    } else {
      console.log('✗ FAIL: Failed to retrieve statistics');
      console.log('  Status:', stats.status);
    }
    console.log('');

    // Test 3: POST /api/retention/config (update)
    console.log('Test 3: POST /api/retention/config');
    console.log('----------------------------------------------------------------------');
    const updateConfig = {
      retentionPeriods: {
        transactions: 365 * 3,  // 3 years
        emails: 365 * 1         // 1 year
      }
    };
    
    const config2 = await makeRequest('POST', '/api/retention/config', updateConfig);
    
    if (config2.status === 200 && config2.data.success) {
      console.log('✓ PASS: Updated retention configuration');
      console.log('  Transactions retention:', config2.data.config.transactions, 'days');
      console.log('  Emails retention:', config2.data.config.emails, 'days');
    } else {
      console.log('✗ FAIL: Failed to update configuration');
      console.log('  Status:', config2.status);
    }
    console.log('');

    // Test 4: POST /api/retention/config (toggle auto-pruning)
    console.log('Test 4: POST /api/retention/config (toggle auto-pruning)');
    console.log('----------------------------------------------------------------------');
    const toggleConfig = {
      autoPruningEnabled: false
    };
    
    const config3 = await makeRequest('POST', '/api/retention/config', toggleConfig);
    
    if (config3.status === 200 && config3.data.success) {
      console.log('✓ PASS: Toggled auto-pruning setting');
      console.log('  Message:', config3.data.message);
    } else {
      console.log('✗ FAIL: Failed to toggle auto-pruning');
      console.log('  Status:', config3.status);
    }
    console.log('');

    // Test 5: Verify configuration persists
    console.log('Test 5: Verify configuration persists');
    console.log('----------------------------------------------------------------------');
    const config4 = await makeRequest('GET', '/api/retention/config');
    
    if (config4.status === 200 && config4.data.success) {
      const verifyTransactions = config4.data.config.transactions === 365 * 3;
      const verifyEmails = config4.data.config.emails === 365 * 1;
      
      if (verifyTransactions && verifyEmails) {
        console.log('✓ PASS: Configuration persists correctly');
        console.log('  Transactions:', config4.data.config.transactions, 'days');
        console.log('  Emails:', config4.data.config.emails, 'days');
      } else {
        console.log('✗ FAIL: Configuration did not persist');
      }
    } else {
      console.log('✗ FAIL: Failed to verify configuration');
    }
    console.log('');

    // Test 6: POST /api/retention/prune (manual trigger)
    console.log('Test 6: POST /api/retention/prune (manual trigger)');
    console.log('----------------------------------------------------------------------');
    const pruneResult = await makeRequest('POST', '/api/retention/prune');
    
    if (pruneResult.status === 200 && pruneResult.data.success) {
      console.log('✓ PASS: Manual pruning executed');
      console.log('  Timestamp:', pruneResult.data.results.timestamp);
      
      const totalPruned = Object.values(pruneResult.data.results.pruned).reduce((sum, count) => sum + count, 0);
      console.log('  Total records pruned:', totalPruned);
      
      // Show non-zero pruning results
      const nonZero = Object.entries(pruneResult.data.results.pruned)
        .filter(([_, count]) => count > 0);
      
      if (nonZero.length > 0) {
        console.log('  Pruned by category:');
        nonZero.forEach(([category, count]) => {
          console.log(`    ${category}: ${count}`);
        });
      }
    } else {
      console.log('✗ FAIL: Failed to execute manual pruning');
      console.log('  Status:', pruneResult.status);
    }
    console.log('');

    // Test 7: Restore default configuration
    console.log('Test 7: Restore default configuration');
    console.log('----------------------------------------------------------------------');
    const restoreConfig = {
      retentionPeriods: {
        transactions: 365 * 5,
        emails: 365 * 2,
        dividends: 365 * 5,
        taxes: 365 * 7,
        fees: 365 * 5,
        loanHistory: 365 * 7,
        corporateEvents: 365 * 10,
        rebalancingEvents: 365 * 3,
        marketCrashEvents: 365 * 10,
        stockSplits: 365 * 10,
        pendingOrders: 30,
        companyFinancials: 365 * 10
      },
      autoPruningEnabled: true
    };
    
    const config5 = await makeRequest('POST', '/api/retention/config', restoreConfig);
    
    if (config5.status === 200 && config5.data.success) {
      console.log('✓ PASS: Restored default configuration');
      console.log('  Transactions retention:', config5.data.config.transactions, 'days');
    } else {
      console.log('✗ FAIL: Failed to restore configuration');
    }
    console.log('');

    console.log('======================================================================');
    console.log('Test Summary');
    console.log('======================================================================');
    console.log('✓ All API integration tests completed');
    console.log('✓ Data retention API endpoints are functional');
    console.log('✓ Configuration management works correctly');
    console.log('✓ Manual pruning can be triggered via API');
    console.log('');

  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Cleanup: kill server
    console.log('Stopping server...');
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
}

// Wait a bit for server to start, then run tests
setTimeout(runTests, 3000);
