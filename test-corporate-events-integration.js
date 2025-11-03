// Integration test for corporate events with user portfolio simulation

const dbModule = require('./database');
const corporateEvents = require('./helpers/corporateEvents');

console.log('Integration Test: Corporate Events with User Portfolio');
console.log('=======================================================\n');

// Initialize database
dbModule.initializeDatabase();
corporateEvents.initializeCorporateEvents();

// Helper function to setup test account
function setupTestAccount() {
  const userAccount = dbModule.getUserAccount.get();
  if (!userAccount) {
    console.error('User account not found!');
    return null;
  }
  
  // Reset account to clean state
  dbModule.updateUserAccount.run(10000, 750);
  
  // Clear portfolio
  const portfolio = dbModule.getPortfolio.all();
  for (const item of portfolio) {
    dbModule.deletePortfolio.run(item.symbol);
  }
  
  // Clear short positions
  const shorts = dbModule.getShortPositions.all();
  for (const item of shorts) {
    dbModule.deleteShortPosition.run(item.symbol);
  }
  
  return dbModule.getUserAccount.get();
}

// Helper function to add stock to portfolio
function addToPortfolio(symbol, shares, pricePerShare, date) {
  dbModule.upsertPortfolio.run(symbol, shares);
  dbModule.insertPurchaseHistory.run(
    symbol,
    date.toISOString(),
    shares,
    pricePerShare,
    'stock'
  );
}

// Test 1: Bankruptcy event (user loses investment)
console.log('Test 1: Bankruptcy Event - Enron');
console.log('---------------------------------');
setupTestAccount();

// Buy Enron stock before bankruptcy
const enronDate = new Date('2001-11-01');
addToPortfolio('ENRNQ', 100, 50.00, enronDate);
console.log('Setup: Bought 100 shares of ENRNQ at $50.00');

let account = dbModule.getUserAccount.get();
let portfolio = dbModule.getPortfolio.all();
console.log(`Before event: Cash=$${account.cash.toFixed(2)}, Portfolio items=${portfolio.length}`);

// Process bankruptcy event
const bankruptcyDate = new Date('2001-12-02');
const events = corporateEvents.processCorporateEvents(bankruptcyDate);
console.log(`Processed ${events.length} event(s)`);

account = dbModule.getUserAccount.get();
portfolio = dbModule.getPortfolio.all();
console.log(`After event: Cash=$${account.cash.toFixed(2)}, Portfolio items=${portfolio.length}`);

// Check if stock was removed
const enronPosition = dbModule.getPortfolioItem.get('ENRNQ');
console.log(`ENRNQ position: ${enronPosition ? enronPosition.shares + ' shares' : 'REMOVED'}`);
console.log();

// Test 2: Merger with cash acquisition (user receives cash)
console.log('Test 2: Merger with Cash Acquisition - Dell Going Private');
console.log('----------------------------------------------------------');
setupTestAccount();

// Buy Dell stock before going private
const dellPurchaseDate = new Date('2013-10-01');
addToPortfolio('DELL', 200, 12.00, dellPurchaseDate);
console.log('Setup: Bought 200 shares of DELL at $12.00');

account = dbModule.getUserAccount.get();
const cashBefore = account.cash;
console.log(`Before event: Cash=$${cashBefore.toFixed(2)}`);

// Process going private event
const dellDate = new Date('2013-11-14');
const dellEvents = corporateEvents.processCorporateEvents(dellDate);
console.log(`Processed ${dellEvents.length} event(s)`);

account = dbModule.getUserAccount.get();
const cashAfter = account.cash;
console.log(`After event: Cash=$${cashAfter.toFixed(2)}`);
console.log(`Cash received: $${(cashAfter - cashBefore).toFixed(2)} (expected: $${(200 * 13.75).toFixed(2)})`);

const dellPosition = dbModule.getPortfolioItem.get('DELL');
console.log(`DELL position: ${dellPosition ? dellPosition.shares + ' shares' : 'REMOVED'}`);
console.log();

// Test 3: Check emails were generated
console.log('Test 3: Email Notifications');
console.log('----------------------------');
const db = dbModule.db;
const emails = db.prepare('SELECT * FROM emails WHERE category = ? ORDER BY date DESC LIMIT 10')
  .all('corporate_action');
console.log(`Corporate action emails: ${emails.length}`);
if (emails.length > 0) {
  console.log('\nMost recent email:');
  console.log(`  From: ${emails[0].from_address}`);
  console.log(`  Subject: ${emails[0].subject}`);
  console.log(`  Date: ${new Date(emails[0].date).toISOString().split('T')[0]}`);
  console.log(`  Preview: ${emails[0].body.substring(0, 100)}...`);
}
console.log();

// Test 4: Check company status updates
console.log('Test 4: Company Status Tracking');
console.log('--------------------------------');
const enronStatus = dbModule.getCompanyStatus.get('ENRNQ');
if (enronStatus) {
  console.log(`ENRNQ: ${enronStatus.status} - ${enronStatus.reason}`);
} else {
  console.log('ENRNQ: No status entry (default active)');
}

const dellStatus = dbModule.getCompanyStatus.get('DELL');
if (dellStatus) {
  console.log(`DELL: ${dellStatus.status} - ${dellStatus.reason}`);
} else {
  console.log('DELL: No status entry (default active)');
}
console.log();

// Test 5: Transaction records
console.log('Test 5: Transaction Records');
console.log('---------------------------');
const transactions = dbModule.getTransactions.all(20);
const corporateTransactions = transactions.filter(t => 
  t.type.includes('bankruptcy') || t.type.includes('merger') || t.type.includes('going_private')
);
console.log(`Corporate action transactions: ${corporateTransactions.length}`);
if (corporateTransactions.length > 0) {
  console.log('\nRecent corporate transactions:');
  corporateTransactions.slice(0, 3).forEach(t => {
    const data = t.data ? JSON.parse(t.data) : {};
    console.log(`  ${t.type}: ${t.symbol} - ${data.reason || 'N/A'}`);
  });
}
console.log();

// Test 6: Verify events are marked as applied
console.log('Test 6: Event Status Updates');
console.log('-----------------------------');
const allEvents = dbModule.getAllCorporateEvents.all(20);
const appliedEvents = allEvents.filter(e => e.status === 'applied');
const pendingEvents = allEvents.filter(e => e.status === 'pending');
console.log(`Applied events: ${appliedEvents.length}`);
console.log(`Pending events: ${pendingEvents.length}`);
console.log();

console.log('All integration tests completed! ✓');
