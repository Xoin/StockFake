/**
 * Unit tests for Technical Indicators Module
 */

const technicalIndicators = require('../../helpers/technicalIndicators');

describe('Technical Indicators Unit Tests', () => {
  // Test data: simple price series
  const testPrices = [10, 11, 12, 11, 10, 11, 12, 13, 14, 13, 12, 13, 14, 15, 14, 13, 14, 15, 16, 17];

  describe('SMA (Simple Moving Average)', () => {
    const sma5 = technicalIndicators.calculateSMA(testPrices, 5);

    test('Returns correct array length', () => {
      expect(sma5.length).toBe(testPrices.length);
    });

    test('Returns null for insufficient data points', () => {
      expect(sma5[0]).toBeNull();
    });

    test('Calculates value at period boundary', () => {
      expect(sma5[4]).not.toBeNull();
    });

    test('Calculates correct average', () => {
      expect(sma5[4]).toBeCloseTo(10.8, 1);
    });
  });

  describe('EMA (Exponential Moving Average)', () => {
    const ema5 = technicalIndicators.calculateEMA(testPrices, 5);

    test('Returns correct array length', () => {
      expect(ema5.length).toBe(testPrices.length);
    });

    test('Returns null for insufficient data points', () => {
      expect(ema5[0]).toBeNull();
    });

    test('Calculates value at period boundary', () => {
      expect(ema5[4]).not.toBeNull();
    });

    test('Calculates positive value', () => {
      expect(ema5[testPrices.length - 1]).toBeGreaterThan(0);
    });
  });

  describe('RSI (Relative Strength Index)', () => {
    const rsi14 = technicalIndicators.calculateRSI(testPrices, 14);

    test('Returns an array', () => {
      expect(Array.isArray(rsi14)).toBe(true);
      expect(rsi14.length).toBeGreaterThan(0);
    });

    test('Calculates value after period + 1', () => {
      expect(rsi14[15]).not.toBeNull();
      expect(rsi14[15]).not.toBeUndefined();
    });

    test('RSI value is between 0 and 100', () => {
      const lastRSI = rsi14.filter(v => v !== null).pop();
      expect(lastRSI).toBeGreaterThanOrEqual(0);
      expect(lastRSI).toBeLessThanOrEqual(100);
    });
  });

  describe('MACD (Moving Average Convergence Divergence)', () => {
    const macd = technicalIndicators.calculateMACD(testPrices, 12, 26, 9);

    test('MACD returns correct array length', () => {
      expect(macd.macd.length).toBe(testPrices.length);
    });

    test('Signal returns correct array length', () => {
      expect(macd.signal.length).toBe(testPrices.length);
    });

    test('Histogram returns correct array length', () => {
      expect(macd.histogram.length).toBe(testPrices.length);
    });

    test('Returns null for insufficient data', () => {
      expect(macd.macd[0]).toBeNull();
    });
  });

  describe('Bollinger Bands', () => {
    const bb = technicalIndicators.calculateBollingerBands(testPrices, 20, 2);

    test('Upper band returns correct array length', () => {
      expect(bb.upper.length).toBe(testPrices.length);
    });

    test('Middle band returns correct array length', () => {
      expect(bb.middle.length).toBe(testPrices.length);
    });

    test('Lower band returns correct array length', () => {
      expect(bb.lower.length).toBe(testPrices.length);
    });

    test('Upper band is above middle', () => {
      expect(bb.upper[testPrices.length - 1]).toBeGreaterThan(bb.middle[testPrices.length - 1]);
    });

    test('Middle band is above lower', () => {
      expect(bb.middle[testPrices.length - 1]).toBeGreaterThan(bb.lower[testPrices.length - 1]);
    });
  });

  describe('OHLC Generation', () => {
    const priceData = testPrices.map((price, i) => ({
      date: new Date(2020, 0, i + 1),
      price: price
    }));
    const ohlc = technicalIndicators.generateOHLC(priceData);

    test('Returns correct array length', () => {
      expect(ohlc.length).toBe(priceData.length);
    });

    test('Has open price', () => {
      expect(ohlc[0].open).toBeDefined();
    });

    test('Has high price', () => {
      expect(ohlc[0].high).toBeDefined();
    });

    test('Has low price', () => {
      expect(ohlc[0].low).toBeDefined();
    });

    test('Has close price', () => {
      expect(ohlc[0].close).toBeDefined();
    });

    test('Has volume', () => {
      expect(ohlc[0].volume).toBeDefined();
    });

    test('High is >= close', () => {
      expect(ohlc[0].high).toBeGreaterThanOrEqual(ohlc[0].close);
    });

    test('Low is <= close', () => {
      expect(ohlc[0].low).toBeLessThanOrEqual(ohlc[0].close);
    });
  });

  describe('ATR (Average True Range)', () => {
    const priceData = testPrices.map((price, i) => ({
      date: new Date(2020, 0, i + 1),
      price: price
    }));
    const ohlc = technicalIndicators.generateOHLC(priceData);
    const atr = technicalIndicators.calculateATR(ohlc, 14);

    test('Returns correct array length', () => {
      expect(atr.length).toBe(ohlc.length);
    });

    test('Calculates positive value', () => {
      expect(atr[testPrices.length - 1]).toBeGreaterThan(0);
    });
  });

  describe('OBV (On-Balance Volume)', () => {
    const priceData = testPrices.map((price, i) => ({
      date: new Date(2020, 0, i + 1),
      price: price
    }));
    const ohlc = technicalIndicators.generateOHLC(priceData);
    const obv = technicalIndicators.calculateOBV(ohlc);

    test('Returns correct array length', () => {
      expect(obv.length).toBe(ohlc.length);
    });

    test('Calculates initial value', () => {
      expect(obv[0]).toBeDefined();
    });
  });

  describe('VWAP (Volume Weighted Average Price)', () => {
    const priceData = testPrices.map((price, i) => ({
      date: new Date(2020, 0, i + 1),
      price: price
    }));
    const ohlc = technicalIndicators.generateOHLC(priceData);
    const vwap = technicalIndicators.calculateVWAP(ohlc);

    test('Returns correct array length', () => {
      expect(vwap.length).toBe(ohlc.length);
    });

    test('Calculates positive value', () => {
      expect(vwap[0]).toBeGreaterThan(0);
    });
  });
});
