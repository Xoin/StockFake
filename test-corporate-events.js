// Test script for corporate events functionality

const dbModule = require('./database');
const corporateEvents = require('./helpers/corporateEvents');

console.log('Testing Corporate Events Functionality');
console.log('=====================================\n');

// Initialize database
dbModule.initializeDatabase();

// Test 1: Initialize corporate events
console.log('Test 1: Initialize Corporate Events');
console.log('------------------------------------');
try {
  corporateEvents.initializeCorporateEvents();
  console.log('✓ Corporate events initialized successfully\n');
} catch (error) {
  console.error('✗ Error initializing corporate events:', error.message);
}

// Test 2: Check pending events
console.log('Test 2: Check Pending Events at Different Times');
console.log('------------------------------------------------');
const testDates = [
  new Date('1970-06-21'),  // Penn Central bankruptcy
  new Date('2001-12-02'),  // Enron bankruptcy
  new Date('2008-09-15'),  // Lehman Brothers bankruptcy
  new Date('2016-10-27'),  // LinkedIn acquisition by Microsoft
];

for (const testDate of testDates) {
  const events = dbModule.getPendingCorporateEvents.all(testDate.toISOString());
  console.log(`Date: ${testDate.toISOString().split('T')[0]}`);
  console.log(`  Pending events: ${events.length}`);
  if (events.length > 0) {
    const event = events[0];
    const eventData = JSON.parse(event.event_data);
    console.log(`  Event: ${eventData.companyName} - ${event.event_type}`);
  }
}
console.log();

// Test 3: Test financial data generation
console.log('Test 3: Generate Financial Data');
console.log('--------------------------------');
const financials = corporateEvents.generateFinancialData('TEST', 2020, 2024, 'Technology');
console.log(`Generated ${financials.length} years of financial data for TEST`);
financials.forEach(f => {
  console.log(`  ${f.year}: Revenue=$${f.revenue}M, NetIncome=$${f.netIncome}M, Employees=${f.employees}`);
});
console.log();

// Test 4: Test company availability
console.log('Test 4: Company Availability Check');
console.log('-----------------------------------');
console.log('IBM availability:', corporateEvents.isCompanyAvailable('IBM', new Date('2020-01-01')));
console.log('LEH availability (after bankruptcy):', corporateEvents.isCompanyAvailable('LEH', new Date('2009-01-01')));
console.log();

// Test 5: Get all corporate events
console.log('Test 5: Get All Corporate Events');
console.log('---------------------------------');
const allEvents = dbModule.getAllCorporateEvents.all(100);
console.log(`Total events in database: ${allEvents.length}`);

// Group by event type
const eventsByType = {};
for (const event of allEvents) {
  eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
}

console.log('Events by type:');
for (const [type, count] of Object.entries(eventsByType)) {
  console.log(`  ${type}: ${count}`);
}
console.log();

// Test 6: Simulate processing an event
console.log('Test 6: Simulate Event Processing');
console.log('----------------------------------');
console.log('Note: This would require setting up user portfolio and account state.');
console.log('In production, events are processed automatically by the game loop.\n');

// Test 7: Test unavailable companies list
console.log('Test 7: Get Unavailable Companies');
console.log('----------------------------------');
const unavailable = corporateEvents.getUnavailableCompanies();
console.log(`Companies with non-active status: ${unavailable.length}`);
if (unavailable.length > 0) {
  unavailable.slice(0, 5).forEach(company => {
    console.log(`  ${company.symbol}: ${company.status} - ${company.reason}`);
  });
}
console.log();

console.log('All tests completed! ✓');
