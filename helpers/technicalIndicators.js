/**
 * Technical Indicators Module
 * Provides calculations for various technical analysis indicators
 */

/**
 * Calculate Simple Moving Average (SMA)
 * @param {Array<number>} data - Array of prices
 * @param {number} period - Number of periods
 * @returns {Array<number>} - Array of SMA values (null for periods without enough data)
 */
function calculateSMA(data, period) {
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param {Array<number>} data - Array of prices
 * @param {number} period - Number of periods
 * @returns {Array<number>} - Array of EMA values
 */
function calculateEMA(data, period) {
  const result = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
    if (i < period - 1) {
      result.push(null);
    }
  }
  
  if (data.length >= period) {
    result.push(sum / period);
    
    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
      const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
      result.push(ema);
    }
  }
  
  return result;
}

/**
 * Calculate Weighted Moving Average (WMA)
 * @param {Array<number>} data - Array of prices
 * @param {number} period - Number of periods
 * @returns {Array<number>} - Array of WMA values
 */
function calculateWMA(data, period) {
  const result = [];
  const totalWeight = (period * (period + 1)) / 2;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += data[i - j] * (period - j);
    }
    result.push(weightedSum / totalWeight);
  }
  
  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param {Array<number>} data - Array of prices
 * @param {number} period - Number of periods (default 14)
 * @returns {Array<number>} - Array of RSI values (0-100)
 */
function calculateRSI(data, period = 14) {
  const result = [];
  
  if (data.length < period + 1) {
    return data.map(() => null);
  }
  
  // Calculate price changes
  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  
  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // First RSI value
  result.push(null); // No RSI for first data point
  for (let i = 0; i < period; i++) {
    result.push(null);
  }
  
  const rs = avgGain / (avgLoss || 0.0001);
  const rsi = 100 - (100 / (1 + rs));
  result.push(rsi);
  
  // Calculate RSI for remaining values using smoothing
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const newRs = avgGain / (avgLoss || 0.0001);
    const newRsi = 100 - (100 / (1 + newRs));
    result.push(newRsi);
  }
  
  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {Array<number>} data - Array of prices
 * @param {number} fastPeriod - Fast EMA period (default 12)
 * @param {number} slowPeriod - Slow EMA period (default 26)
 * @param {number} signalPeriod - Signal line period (default 9)
 * @returns {Object} - {macd: Array, signal: Array, histogram: Array}
 */
function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const validMacdValues = macdLine.filter(v => v !== null);
  const signalLine = calculateEMA(validMacdValues, signalPeriod);
  
  // Align signal line with MACD line
  const alignedSignal = [];
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      alignedSignal.push(null);
    } else {
      alignedSignal.push(signalLine[signalIndex] || null);
      signalIndex++;
    }
  }
  
  // Calculate histogram
  const histogram = [];
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || alignedSignal[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - alignedSignal[i]);
    }
  }
  
  return {
    macd: macdLine,
    signal: alignedSignal,
    histogram: histogram
  };
}

/**
 * Calculate Bollinger Bands
 * @param {Array<number>} data - Array of prices
 * @param {number} period - Number of periods (default 20)
 * @param {number} stdDev - Number of standard deviations (default 2)
 * @returns {Object} - {upper: Array, middle: Array, lower: Array}
 */
function calculateBollingerBands(data, period = 20, stdDev = 2) {
  const middle = calculateSMA(data, period);
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    
    // Calculate standard deviation
    const slice = data.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    
    upper.push(mean + (stdDev * sd));
    lower.push(mean - (stdDev * sd));
  }
  
  return {
    upper: upper,
    middle: middle,
    lower: lower
  };
}

/**
 * Calculate Stochastic Oscillator
 * @param {Array<Object>} data - Array of OHLC data {high, low, close}
 * @param {number} period - Number of periods (default 14)
 * @param {number} kSmoothing - %K smoothing (default 3)
 * @param {number} dSmoothing - %D smoothing (default 3)
 * @returns {Object} - {k: Array, d: Array}
 */
function calculateStochastic(data, period = 14, kSmoothing = 3, dSmoothing = 3) {
  const k = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      k.push(null);
      continue;
    }
    
    const slice = data.slice(i - period + 1, i + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const close = data[i].close;
    
    const stochastic = ((close - low) / (high - low || 1)) * 100;
    k.push(stochastic);
  }
  
  // Smooth %K
  const kValues = k.filter(v => v !== null);
  const smoothedK = calculateSMA(kValues, kSmoothing);
  
  // Calculate %D (SMA of %K)
  const d = calculateSMA(smoothedK, dSmoothing);
  
  // Align arrays
  const alignedK = [];
  const alignedD = [];
  let validIndex = 0;
  
  for (let i = 0; i < k.length; i++) {
    if (k[i] === null) {
      alignedK.push(null);
      alignedD.push(null);
    } else {
      alignedK.push(smoothedK[validIndex] || null);
      alignedD.push(d[validIndex] || null);
      validIndex++;
    }
  }
  
  return {
    k: alignedK,
    d: alignedD
  };
}

/**
 * Calculate Average True Range (ATR)
 * @param {Array<Object>} data - Array of OHLC data {high, low, close}
 * @param {number} period - Number of periods (default 14)
 * @returns {Array<number>} - Array of ATR values
 */
function calculateATR(data, period = 14) {
  const tr = [];
  
  // Calculate True Range
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      tr.push(data[i].high - data[i].low);
    } else {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      const trueRange = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      tr.push(trueRange);
    }
  }
  
  // Calculate ATR (smoothed TR)
  return calculateEMA(tr, period);
}

/**
 * Calculate On-Balance Volume (OBV)
 * @param {Array<Object>} data - Array of data {close, volume}
 * @returns {Array<number>} - Array of OBV values
 */
function calculateOBV(data) {
  const obv = [];
  let currentOBV = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      obv.push(data[i].volume || 0);
      currentOBV = data[i].volume || 0;
    } else {
      if (data[i].close > data[i - 1].close) {
        currentOBV += data[i].volume || 0;
      } else if (data[i].close < data[i - 1].close) {
        currentOBV -= data[i].volume || 0;
      }
      obv.push(currentOBV);
    }
  }
  
  return obv;
}

/**
 * Calculate Volume Weighted Average Price (VWAP)
 * @param {Array<Object>} data - Array of OHLC data {high, low, close, volume}
 * @returns {Array<number>} - Array of VWAP values
 */
function calculateVWAP(data) {
  const vwap = [];
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;
  
  for (let i = 0; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    const volume = data[i].volume || 1;
    
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
    
    vwap.push(cumulativeTPV / cumulativeVolume);
  }
  
  return vwap;
}

/**
 * Generate OHLC data from price data
 * Simulates realistic open, high, low values around the close price
 * @param {Array<Object>} priceData - Array of {date, price}
 * @returns {Array<Object>} - Array of {date, open, high, low, close, volume}
 */
function generateOHLC(priceData) {
  const ohlcData = [];
  
  for (let i = 0; i < priceData.length; i++) {
    const close = priceData[i].price;
    const prevClose = i > 0 ? priceData[i - 1].price : close;
    
    // Generate realistic open based on gap from previous close
    const gap = (Math.random() - 0.5) * 0.02; // ±1% gap
    const open = prevClose * (1 + gap);
    
    // Generate high and low based on volatility
    const volatility = 0.015 + (Math.random() * 0.02); // 1.5-3.5% range
    const high = Math.max(open, close) * (1 + volatility * Math.random());
    const low = Math.min(open, close) * (1 - volatility * Math.random());
    
    // Generate random volume (larger for volatile days)
    const priceChange = Math.abs(close - prevClose) / prevClose;
    const baseVolume = 1000000 + (Math.random() * 2000000);
    const volume = Math.floor(baseVolume * (1 + priceChange * 10));
    
    ohlcData.push({
      date: priceData[i].date,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume
    });
  }
  
  return ohlcData;
}

module.exports = {
  calculateSMA,
  calculateEMA,
  calculateWMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateATR,
  calculateOBV,
  calculateVWAP,
  generateOHLC
};
