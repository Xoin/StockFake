// Test cryptocurrency functionality
const assert = require('assert');

console.log('\n======================================================================');
console.log('Cryptocurrency Feature Test');
console.log('======================================================================\n');

// Load modules
const cryptoData = require('../../data/cryptocurrencies');
const cryptoManager = require('../../helpers/cryptoManager');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`✗ FAIL: ${description}`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
  }
}

console.log('Test 1: Cryptocurrency Data Structure');
console.log('----------------------------------------------------------------------');

test('Should have BTC cryptocurrency', () => {
  const btc = cryptoData.getCrypto('BTC');
  assert(btc !== null, 'BTC should exist');
  assert.strictEqual(btc.name, 'Bitcoin', 'BTC name should be Bitcoin');
  assert.strictEqual(btc.launchDate, '2009-01-03', 'BTC launch date should be 2009-01-03');
});

test('Should have ETH cryptocurrency', () => {
  const eth = cryptoData.getCrypto('ETH');
  assert(eth !== null, 'ETH should exist');
  assert.strictEqual(eth.name, 'Ethereum', 'ETH name should be Ethereum');
  assert.strictEqual(eth.launchDate, '2015-07-30', 'ETH launch date should be 2015-07-30');
});

test('Should have multiple cryptocurrencies', () => {
  const allCryptos = cryptoData.getAllCryptos();
  assert(allCryptos.length >= 5, 'Should have at least 5 cryptocurrencies');
  const symbols = allCryptos.map(c => c.symbol);
  assert(symbols.includes('BTC'), 'Should include BTC');
  assert(symbols.includes('ETH'), 'Should include ETH');
  assert(symbols.includes('LTC'), 'Should include LTC');
});

console.log('\nTest 2: Cryptocurrency Availability by Date');
console.log('----------------------------------------------------------------------');

test('BTC should be available in 2010', () => {
  const date = new Date('2010-01-01');
  const isAvailable = cryptoData.isCryptoAvailable('BTC', date);
  assert.strictEqual(isAvailable, true, 'BTC should be available in 2010');
});

test('BTC should NOT be available in 2008', () => {
  const date = new Date('2008-01-01');
  const isAvailable = cryptoData.isCryptoAvailable('BTC', date);
  assert.strictEqual(isAvailable, false, 'BTC should not be available in 2008');
});

test('ETH should be available in 2016', () => {
  const date = new Date('2016-01-01');
  const isAvailable = cryptoData.isCryptoAvailable('ETH', date);
  assert.strictEqual(isAvailable, true, 'ETH should be available in 2016');
});

test('ETH should NOT be available in 2014', () => {
  const date = new Date('2014-01-01');
  const isAvailable = cryptoData.isCryptoAvailable('ETH', date);
  assert.strictEqual(isAvailable, false, 'ETH should not be available in 2014');
});

console.log('\nTest 3: Cryptocurrency Pricing');
console.log('----------------------------------------------------------------------');

test('Should generate price for BTC in 2010', () => {
  const date = new Date('2010-07-01');
  const price = cryptoManager.getCryptoPrice('BTC', date);
  assert(price !== null, 'Should return a price');
  assert(price > 0, 'Price should be greater than 0');
  assert(price < 1, 'Price should be less than $1 in 2010');
});

test('Should generate price for BTC in 2021', () => {
  const date = new Date('2021-11-10');
  const price = cryptoManager.getCryptoPrice('BTC', date);
  assert(price !== null, 'Should return a price');
  assert(price > 50000, 'Price should be greater than $50,000 in late 2021');
});

test('Should generate price for ETH in 2021', () => {
  const date = new Date('2021-11-10');
  const price = cryptoManager.getCryptoPrice('ETH', date);
  assert(price !== null, 'Should return a price');
  assert(price > 3000, 'Price should be greater than $3,000 in late 2021');
});

test('Should return null for BTC before launch', () => {
  const date = new Date('2008-01-01');
  const price = cryptoManager.getCryptoPrice('BTC', date);
  assert.strictEqual(price, null, 'Should return null for BTC in 2008');
});

console.log('\nTest 4: Trading Fees');
console.log('----------------------------------------------------------------------');

test('Should calculate correct trading fee for BTC', () => {
  const totalCost = 10000;
  const fee = cryptoManager.getCryptoTradingFee('BTC', totalCost);
  assert.strictEqual(fee, 10, 'Fee should be 0.1% of $10,000 = $10');
});

test('Should calculate correct trading fee for ETH', () => {
  const totalCost = 5000;
  const fee = cryptoManager.getCryptoTradingFee('ETH', totalCost);
  assert.strictEqual(fee, 5, 'Fee should be 0.1% of $5,000 = $5');
});

console.log('\nTest 5: Blockchain Events');
console.log('----------------------------------------------------------------------');

test('Should have Bitcoin halving events', () => {
  const btc = cryptoData.getCrypto('BTC');
  assert(btc.halvingSchedule, 'BTC should have halving schedule');
  assert(btc.halvingSchedule.length >= 4, 'Should have at least 4 halvings');
});

test('Should have Ethereum merge event', () => {
  const eth = cryptoData.getCrypto('ETH');
  assert(eth.majorEvents, 'ETH should have major events');
  const mergeEvent = eth.majorEvents.find(e => e.event === 'The Merge');
  assert(mergeEvent !== undefined, 'Should have The Merge event');
  assert.strictEqual(mergeEvent.date, '2022-09-15', 'Merge date should be 2022-09-15');
});

test('Should have blockchain events', () => {
  const events = cryptoData.blockchainEvents;
  assert(events.length > 0, 'Should have blockchain events');
  const mtgox = events.find(e => e.id === 'mtgox_hack');
  assert(mtgox !== undefined, 'Should have Mt. Gox hack event');
});

test('Should have crypto crash events', () => {
  const crashes = cryptoData.cryptoCrashes;
  assert(crashes.length > 0, 'Should have crypto crashes');
  const winter2018 = crashes.find(c => c.id === 'crypto_winter_2018');
  assert(winter2018 !== undefined, 'Should have 2018 crypto winter');
});

console.log('\nTest 6: Staking Features');
console.log('----------------------------------------------------------------------');

test('ETH should support staking', () => {
  const eth = cryptoData.getCrypto('ETH');
  assert(eth.stakingRewards, 'ETH should have staking rewards');
  assert.strictEqual(eth.stakingRewards.enabled, true, 'ETH staking should be enabled');
  assert(eth.stakingRewards.annualRate > 0, 'ETH should have positive staking rate');
});

test('BTC should NOT support staking', () => {
  const btc = cryptoData.getCrypto('BTC');
  assert(!btc.stakingRewards || !btc.stakingRewards.enabled, 'BTC should not have staking');
});

test('Should calculate staking rewards for ETH', () => {
  const date = new Date('2021-12-01');
  const lastRewardDate = new Date('2021-11-01');
  const shares = 10; // 10 ETH
  const rewards = cryptoManager.calculateStakingRewards('ETH', shares, date, lastRewardDate);
  assert(rewards > 0, 'Should generate positive staking rewards');
  // ~4% APR / 12 months * 10 ETH ≈ 0.033 ETH
  assert(rewards > 0.02 && rewards < 0.05, 'Rewards should be approximately 0.033 ETH');
});

console.log('\nTest 7: 24/7 Trading');
console.log('----------------------------------------------------------------------');

test('Crypto trading should always be open', () => {
  const isOpen = cryptoManager.isCryptoTradingOpen();
  assert.strictEqual(isOpen, true, 'Crypto markets should always be open');
});

console.log('\nTest 8: Get All Crypto Prices');
console.log('----------------------------------------------------------------------');

test('Should get all available crypto prices for a given date', () => {
  const date = new Date('2021-01-01');
  const prices = cryptoManager.getAllCryptoPrices(date);
  assert(prices.length >= 5, 'Should have multiple cryptocurrencies available');
  prices.forEach(crypto => {
    assert(crypto.price > 0, `${crypto.symbol} should have a positive price`);
    assert(crypto.symbol, 'Should have symbol');
    assert(crypto.name, 'Should have name');
  });
});

test('Should only return launched cryptos for early date', () => {
  const date = new Date('2010-01-01');
  const prices = cryptoManager.getAllCryptoPrices(date);
  // Only BTC should be available in 2010
  assert.strictEqual(prices.length, 1, 'Only BTC should be available in 2010');
  assert.strictEqual(prices[0].symbol, 'BTC', 'Available crypto should be BTC');
});

console.log('\n======================================================================');
console.log('Test Summary');
console.log('======================================================================');
console.log(`Total: ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}\n`);

if (failedTests === 0) {
  console.log('✓ All tests passed!\n');
  process.exit(0);
} else {
  console.log(`✗ ${failedTests} test(s) failed!\n`);
  process.exit(1);
}
