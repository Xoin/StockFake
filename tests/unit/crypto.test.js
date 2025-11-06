// Test cryptocurrency functionality

// Load modules
const cryptoData = require('../../data/cryptocurrencies');
const cryptoManager = require('../../helpers/cryptoManager');

describe('Cryptocurrency Feature Tests', () => {
  describe('Cryptocurrency Data Structure', () => {
    test('Should have BTC cryptocurrency', () => {
      const btc = cryptoData.getCrypto('BTC');
      expect(btc).not.toBeNull();
      expect(btc.name).toBe('Bitcoin');
      expect(btc.launchDate).toBe('2009-01-03');
    });

    test('Should have ETH cryptocurrency', () => {
      const eth = cryptoData.getCrypto('ETH');
      expect(eth).not.toBeNull();
      expect(eth.name).toBe('Ethereum');
      expect(eth.launchDate).toBe('2015-07-30');
    });

    test('Should have multiple cryptocurrencies', () => {
      const allCryptos = cryptoData.getAllCryptos();
      expect(allCryptos.length).toBeGreaterThanOrEqual(5);
      const symbols = allCryptos.map(c => c.symbol);
      expect(symbols).toContain('BTC');
      expect(symbols).toContain('ETH');
      expect(symbols).toContain('LTC');
    });
  });

  describe('Cryptocurrency Availability by Date', () => {
    test('BTC should be available in 2010', () => {
      const date = new Date('2010-01-01');
      const isAvailable = cryptoData.isCryptoAvailable('BTC', date);
      expect(isAvailable).toBe(true);
    });

    test('BTC should NOT be available in 2008', () => {
      const date = new Date('2008-01-01');
      const isAvailable = cryptoData.isCryptoAvailable('BTC', date);
      expect(isAvailable).toBe(false);
    });

    test('ETH should be available in 2016', () => {
      const date = new Date('2016-01-01');
      const isAvailable = cryptoData.isCryptoAvailable('ETH', date);
      expect(isAvailable).toBe(true);
    });

    test('ETH should NOT be available in 2014', () => {
      const date = new Date('2014-01-01');
      const isAvailable = cryptoData.isCryptoAvailable('ETH', date);
      expect(isAvailable).toBe(false);
    });
  });

  describe('Cryptocurrency Pricing', () => {
    test('Should generate price for BTC in 2010', () => {
      const date = new Date('2010-07-01');
      const price = cryptoManager.getCryptoPrice('BTC', date);
      expect(price).not.toBeNull();
      expect(price).toBeGreaterThan(0);
      expect(price).toBeLessThan(1);
    });

    test('Should generate price for BTC in 2021', () => {
      const date = new Date('2021-11-10');
      const price = cryptoManager.getCryptoPrice('BTC', date);
      expect(price).not.toBeNull();
      expect(price).toBeGreaterThan(50000);
    });

    test('Should generate price for ETH in 2021', () => {
      const date = new Date('2021-11-10');
      const price = cryptoManager.getCryptoPrice('ETH', date);
      expect(price).not.toBeNull();
      expect(price).toBeGreaterThan(3000);
    });

    test('Should return null for BTC before launch', () => {
      const date = new Date('2008-01-01');
      const price = cryptoManager.getCryptoPrice('BTC', date);
      expect(price).toBeNull();
    });
  });

  describe('Trading Fees', () => {
    test('Should calculate correct trading fee for BTC', () => {
      const totalCost = 10000;
      const fee = cryptoManager.getCryptoTradingFee('BTC', totalCost);
      expect(fee).toBe(10);
    });

    test('Should calculate correct trading fee for ETH', () => {
      const totalCost = 5000;
      const fee = cryptoManager.getCryptoTradingFee('ETH', totalCost);
      expect(fee).toBe(5);
    });
  });

  describe('Blockchain Events', () => {
    test('Should have Bitcoin halving events', () => {
      const btc = cryptoData.getCrypto('BTC');
      expect(btc.halvingSchedule).toBeDefined();
      expect(btc.halvingSchedule.length).toBeGreaterThanOrEqual(4);
    });

    test('Should have Ethereum merge event', () => {
      const eth = cryptoData.getCrypto('ETH');
      expect(eth.majorEvents).toBeDefined();
      const mergeEvent = eth.majorEvents.find(e => e.event === 'The Merge');
      expect(mergeEvent).toBeDefined();
      expect(mergeEvent.date).toBe('2022-09-15');
    });

    test('Should have blockchain events', () => {
      const events = cryptoData.blockchainEvents;
      expect(events.length).toBeGreaterThan(0);
      const mtgox = events.find(e => e.id === 'mtgox_hack');
      expect(mtgox).toBeDefined();
    });

    test('Should have crypto crash events', () => {
      const crashes = cryptoData.cryptoCrashes;
      expect(crashes.length).toBeGreaterThan(0);
      const winter2018 = crashes.find(c => c.id === 'crypto_winter_2018');
      expect(winter2018).toBeDefined();
    });
  });

  describe('Staking Features', () => {
    test('ETH should support staking', () => {
      const eth = cryptoData.getCrypto('ETH');
      expect(eth.stakingRewards).toBeDefined();
      expect(eth.stakingRewards.enabled).toBe(true);
      expect(eth.stakingRewards.annualRate).toBeGreaterThan(0);
    });

    test('BTC should NOT support staking', () => {
      const btc = cryptoData.getCrypto('BTC');
      expect(!btc.stakingRewards || !btc.stakingRewards.enabled).toBe(true);
    });

    test('Should calculate staking rewards for ETH', () => {
      const date = new Date('2021-12-01');
      const lastRewardDate = new Date('2021-11-01');
      const shares = 10; // 10 ETH
      const rewards = cryptoManager.calculateStakingRewards('ETH', shares, date, lastRewardDate);
      expect(rewards).toBeGreaterThan(0);
      // ~4% APR / 12 months * 10 ETH ≈ 0.033 ETH
      expect(rewards).toBeGreaterThan(0.02);
      expect(rewards).toBeLessThan(0.05);
    });
  });

  describe('24/7 Trading', () => {
    test('Crypto trading should always be open', () => {
      const isOpen = cryptoManager.isCryptoTradingOpen();
      expect(isOpen).toBe(true);
    });
  });

  describe('Get All Crypto Prices', () => {
    test('Should get all available crypto prices for a given date', () => {
      const date = new Date('2021-01-01');
      const prices = cryptoManager.getAllCryptoPrices(date);
      expect(prices.length).toBeGreaterThanOrEqual(5);
      prices.forEach(crypto => {
        expect(crypto.price).toBeGreaterThan(0);
        expect(crypto.symbol).toBeDefined();
        expect(crypto.name).toBeDefined();
      });
    });

    test('Should only return launched cryptos for early date', () => {
      const date = new Date('2010-01-01');
      const prices = cryptoManager.getAllCryptoPrices(date);
      // Only BTC should be available in 2010
      expect(prices.length).toBe(1);
      expect(prices[0].symbol).toBe('BTC');
    });
  });
});
