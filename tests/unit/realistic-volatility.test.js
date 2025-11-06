/**
 * Test: Realistic Stock Price Volatility
 * 
 * Validates that stock prices don't exhibit unrealistic daily changes,
 * especially in future years (2025+, 2045, etc.)
 * 
 * Issue: Unrealistic stock price changes (>200%) in 2045 and after 2025
 * Fix: Cap daily price changes to realistic bounds (±20%)
 */

const stocks = require('../../data/stocks');
const { GARCHModel } = require('../../helpers/volatilityModeling');

describe('Stock Price Volatility Test', () => {
  const testStocks = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'IBM'];
  const testYear = 2045;
  const testMonth = 6; // July (0-indexed)

  describe('Daily price changes in July 2045', () => {
    testStocks.forEach(symbol => {
      test(`${symbol} should have realistic daily price changes (<28%)`, () => {
        let maxDailyChange = 0;
        
        for (let day = 1; day <= 30; day++) {
          const date1 = new Date(testYear, testMonth, day);
          const date2 = new Date(testYear, testMonth, day + 1);
          
          const price1 = stocks.getStockPrice(symbol, date1, 3600, false, true);
          const price2 = stocks.getStockPrice(symbol, date2, 3600, false, true);
          
          if (price1 && price2) {
            const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
            maxDailyChange = Math.max(maxDailyChange, change);
          }
        }
        
        expect(maxDailyChange).toBeLessThanOrEqual(28);
        expect(maxDailyChange).toBeLessThan(50);
      });
    });
  });

  describe('Price distribution across all stocks (July 15-16, 2045)', () => {
    test('No stocks should have >50% daily changes', () => {
      const date1 = new Date(2045, 6, 15);
      const date2 = new Date(2045, 6, 16);

      const allStocks = stocks.getAvailableStocks(date1, 3600, false);
      const changes = [];

      for (const stock of allStocks) {
        const price1 = stocks.getStockPrice(stock.symbol, date1, 3600, false, true);
        const price2 = stocks.getStockPrice(stock.symbol, date2, 3600, false, true);
        
        if (price1 && price2) {
          const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
          changes.push({ symbol: stock.symbol, change });
        }
      }

      const extremeChanges = changes.filter(c => c.change > 50);
      expect(extremeChanges.length).toBe(0);
    });

    test('<5% of stocks should have >25% changes', () => {
      const date1 = new Date(2045, 6, 15);
      const date2 = new Date(2045, 6, 16);

      const allStocks = stocks.getAvailableStocks(date1, 3600, false);
      const changes = [];

      for (const stock of allStocks) {
        const price1 = stocks.getStockPrice(stock.symbol, date1, 3600, false, true);
        const price2 = stocks.getStockPrice(stock.symbol, date2, 3600, false, true);
        
        if (price1 && price2) {
          const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
          changes.push({ symbol: stock.symbol, change });
        }
      }

      const largeChanges = changes.filter(c => c.change > 25);
      expect(largeChanges.length).toBeLessThan(changes.length * 0.05);
    });

    test('>50% of stocks should have <10% changes', () => {
      const date1 = new Date(2045, 6, 15);
      const date2 = new Date(2045, 6, 16);

      const allStocks = stocks.getAvailableStocks(date1, 3600, false);
      const changes = [];

      for (const stock of allStocks) {
        const price1 = stocks.getStockPrice(stock.symbol, date1, 3600, false, true);
        const price2 = stocks.getStockPrice(stock.symbol, date2, 3600, false, true);
        
        if (price1 && price2) {
          const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
          changes.push({ symbol: stock.symbol, change });
        }
      }

      const normalChanges = changes.filter(c => c.change <= 10);
      expect(normalChanges.length).toBeGreaterThan(changes.length * 0.50);
    });
  });

  describe('Price changes at maximum game speed (1s = 1 day)', () => {
    ['AAPL', 'MSFT', 'GOOGL'].forEach(symbol => {
      test(`${symbol} at max speed should have realistic changes (<28%)`, () => {
        let maxDailyChange = 0;
        
        for (let day = 1; day <= 30; day++) {
          const date1 = new Date(testYear, testMonth, day);
          const date2 = new Date(testYear, testMonth, day + 1);
          
          // Test at maximum speed: timeMultiplier = 86400 (1s = 1 day)
          const price1 = stocks.getStockPrice(symbol, date1, 86400, false, true);
          const price2 = stocks.getStockPrice(symbol, date2, 86400, false, true);
          
          if (price1 && price2) {
            const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
            maxDailyChange = Math.max(maxDailyChange, change);
          }
        }
        
        expect(maxDailyChange).toBeLessThanOrEqual(28);
      });
    });
  });

  describe('Price changes in 2026 (early future)', () => {
    ['AAPL', 'MSFT'].forEach(symbol => {
      test(`${symbol} in 2026 should have realistic changes (<28%)`, () => {
        let maxDailyChange = 0;
        
        for (let day = 1; day <= 30; day++) {
          const date1 = new Date(2026, 0, day);
          const date2 = new Date(2026, 0, day + 1);
          
          const price1 = stocks.getStockPrice(symbol, date1, 3600, false, true);
          const price2 = stocks.getStockPrice(symbol, date2, 3600, false, true);
          
          if (price1 && price2) {
            const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
            maxDailyChange = Math.max(maxDailyChange, change);
          }
        }
        
        expect(maxDailyChange).toBeLessThanOrEqual(28);
      });
    });
  });

  describe('GARCH volatility model caps', () => {
    const garch = new GARCHModel();

    test('GARCH normal mode returns should be capped at ~15%', () => {
      let maxReturn = 0;
      for (let i = 0; i < 1000; i++) {
        const ret = Math.abs(garch.generateReturn(5, 0, 0.15)); // Normal conditions: ±15%
        maxReturn = Math.max(maxReturn, ret);
      }
      
      expect(maxReturn).toBeLessThanOrEqual(0.16);
    });

    test('GARCH crash mode returns should be capped at ~25%', () => {
      let maxReturn = 0;
      for (let i = 0; i < 1000; i++) {
        const ret = Math.abs(garch.generateReturn(5, 0, 0.25)); // Crash conditions: ±25%
        maxReturn = Math.max(maxReturn, ret);
      }
      
      expect(maxReturn).toBeLessThanOrEqual(0.26);
    });
  });
});
