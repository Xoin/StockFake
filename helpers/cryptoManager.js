// Crypto manager - handles crypto pricing, trading, staking, and volatility
const cryptoData = require('../data/cryptocurrencies');

// Historical price points for major cryptocurrencies (simplified)
// These are rough approximations of key price points
const priceAnchors = {
  'BTC': [
    { date: '2009-01-03', price: 0.0008 },
    { date: '2010-07-01', price: 0.08 },
    { date: '2011-06-08', price: 31.50 },
    { date: '2012-01-01', price: 5.27 },
    { date: '2013-11-30', price: 1151.00 },
    { date: '2014-01-01', price: 770.00 },
    { date: '2015-01-14', price: 177.00 },
    { date: '2017-12-17', price: 19783.00 },
    { date: '2018-12-15', price: 3191.00 },
    { date: '2020-03-13', price: 3858.00 },
    { date: '2021-11-10', price: 68789.00 },
    { date: '2022-11-21', price: 15760.00 },
    { date: '2024-03-14', price: 73750.00 }
  ],
  'ETH': [
    { date: '2015-07-30', price: 0.31 },
    { date: '2016-03-01', price: 10.00 },
    { date: '2017-06-12', price: 395.00 },
    { date: '2018-01-13', price: 1396.00 },
    { date: '2018-12-15', price: 83.00 },
    { date: '2020-03-13', price: 109.00 },
    { date: '2021-11-10', price: 4812.00 },
    { date: '2022-06-18', price: 896.00 },
    { date: '2024-03-14', price: 4092.00 }
  ],
  'LTC': [
    { date: '2011-10-07', price: 3.00 },
    { date: '2013-11-28', price: 50.00 },
    { date: '2017-12-12', price: 371.00 },
    { date: '2018-12-15', price: 23.00 },
    { date: '2021-05-10', price: 412.00 },
    { date: '2022-11-21', price: 52.00 },
    { date: '2024-03-14', price: 105.00 }
  ],
  'XRP': [
    { date: '2012-06-02', price: 0.0056 },
    { date: '2017-05-15', price: 0.40 },
    { date: '2018-01-07', price: 3.84 },
    { date: '2020-03-13', price: 0.14 },
    { date: '2021-04-14', price: 1.96 },
    { date: '2022-11-21', price: 0.36 },
    { date: '2024-03-14', price: 0.63 }
  ],
  'BCH': [
    { date: '2017-08-01', price: 555.00 },
    { date: '2017-12-20', price: 4355.00 },
    { date: '2018-12-15', price: 75.00 },
    { date: '2021-05-12', price: 1638.00 },
    { date: '2022-11-21', price: 103.00 },
    { date: '2024-03-14', price: 491.00 }
  ],
  'ADA': [
    { date: '2017-10-01', price: 0.02 },
    { date: '2018-01-04', price: 1.33 },
    { date: '2020-03-13', price: 0.024 },
    { date: '2021-09-02', price: 3.10 },
    { date: '2022-11-21', price: 0.31 },
    { date: '2024-03-14', price: 0.68 }
  ],
  'DOGE': [
    { date: '2013-12-06', price: 0.0002 },
    { date: '2017-01-01', price: 0.0002 },
    { date: '2021-05-08', price: 0.74 },
    { date: '2022-11-21', price: 0.078 },
    { date: '2024-03-14', price: 0.18 }
  ],
  'DOT': [
    { date: '2020-08-18', price: 2.93 },
    { date: '2021-11-04', price: 55.09 },
    { date: '2022-11-21', price: 5.36 },
    { date: '2024-03-14', price: 10.39 }
  ],
  'MATIC': [
    { date: '2019-04-26', price: 0.0033 },
    { date: '2021-12-27', price: 2.92 },
    { date: '2022-11-21', price: 0.83 },
    { date: '2024-03-14', price: 1.14 }
  ],
  'SOL': [
    { date: '2020-03-16', price: 0.78 },
    { date: '2021-11-06', price: 259.96 },
    { date: '2022-11-21', price: 13.05 },
    { date: '2024-03-14', price: 194.90 }
  ]
};

// Generate crypto price for a given date using interpolation and volatility
function getCryptoPrice(symbol, currentDate) {
  const crypto = cryptoData.getCrypto(symbol);
  if (!crypto) return null;
  
  // Check if crypto is available at this date
  if (!cryptoData.isCryptoAvailable(symbol, currentDate)) {
    return null;
  }
  
  const anchors = priceAnchors[symbol];
  if (!anchors || anchors.length === 0) return null;
  
  // Convert current date to timestamp
  const currentTime = currentDate.getTime();
  
  // Find the two anchor points surrounding the current date
  let beforeAnchor = null;
  let afterAnchor = null;
  
  for (let i = 0; i < anchors.length; i++) {
    const anchorTime = new Date(anchors[i].date).getTime();
    
    if (anchorTime <= currentTime) {
      beforeAnchor = anchors[i];
    } else {
      afterAnchor = anchors[i];
      break;
    }
  }
  
  // Handle edge cases
  if (!beforeAnchor && afterAnchor) {
    // Before first anchor - use first anchor price
    return afterAnchor.price;
  }
  
  if (beforeAnchor && !afterAnchor) {
    // After last anchor - use last anchor with some growth/volatility
    const daysSinceAnchor = (currentTime - new Date(beforeAnchor.date).getTime()) / (1000 * 60 * 60 * 24);
    const volatility = crypto.baseVolatility;
    const randomFactor = 1 + (Math.sin(currentTime / 100000) * volatility * 2); // Deterministic "random"
    return beforeAnchor.price * randomFactor;
  }
  
  // Interpolate between two anchors
  const beforeTime = new Date(beforeAnchor.date).getTime();
  const afterTime = new Date(afterAnchor.date).getTime();
  const progress = (currentTime - beforeTime) / (afterTime - beforeTime);
  
  // Use logarithmic interpolation for price (prices tend to move logarithmically)
  const logBefore = Math.log(beforeAnchor.price);
  const logAfter = Math.log(afterAnchor.price);
  const logPrice = logBefore + (logAfter - logBefore) * progress;
  let basePrice = Math.exp(logPrice);
  
  // Add daily volatility
  const daysSinceAnchor = (currentTime - beforeTime) / (1000 * 60 * 60 * 24);
  const volatilityFactor = 1 + (Math.sin(currentTime / 100000 + symbol.charCodeAt(0)) * crypto.baseVolatility);
  let price = basePrice * volatilityFactor;
  
  // Apply blockchain events
  const events = cryptoData.getBlockchainEvents(
    new Date(currentTime - 30 * 24 * 60 * 60 * 1000), // 30 days before
    currentDate
  );
  
  for (const event of events) {
    if (event.affectedCryptos.includes(symbol)) {
      const eventDate = new Date(event.date).getTime();
      const daysSinceEvent = (currentTime - eventDate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceEvent >= 0 && daysSinceEvent < 30) {
        // Event impact decays over 30 days
        const impactDecay = Math.max(0, 1 - (daysSinceEvent / 30));
        price *= (1 + event.impact * impactDecay);
      }
    }
  }
  
  // Apply crypto crashes
  const activeCrashes = cryptoData.getActiveCryptoCrashes(currentDate);
  for (const crash of activeCrashes) {
    if (crash.affectedCryptos.includes(symbol)) {
      const crashStart = new Date(crash.startDate).getTime();
      const crashEnd = new Date(crash.endDate).getTime();
      const crashDuration = crashEnd - crashStart;
      const progressInCrash = (currentTime - crashStart) / crashDuration;
      
      // Gradual price decline during crash
      const crashImpact = crash.impactMultiplier + (1 - crash.impactMultiplier) * (1 - progressInCrash);
      price *= crashImpact;
    }
  }
  
  return Math.max(0.00001, price); // Ensure price doesn't go below a minimum
}

// Calculate crypto trading fee
function getCryptoTradingFee(symbol, totalCost) {
  const crypto = cryptoData.getCrypto(symbol);
  if (!crypto) return 0;
  
  return totalCost * crypto.tradingFee;
}

// Calculate staking rewards for a crypto holding
function calculateStakingRewards(symbol, shares, currentDate, lastRewardDate) {
  const crypto = cryptoData.getCrypto(symbol);
  if (!crypto || !crypto.stakingRewards || !crypto.stakingRewards.enabled) {
    return 0;
  }
  
  const stakingStart = new Date(crypto.stakingRewards.startDate);
  if (currentDate < stakingStart) {
    return 0;
  }
  
  const effectiveLastRewardDate = lastRewardDate && lastRewardDate > stakingStart 
    ? lastRewardDate 
    : stakingStart;
  
  if (currentDate <= effectiveLastRewardDate) {
    return 0;
  }
  
  // Calculate days since last reward
  const daysSinceReward = (currentDate - effectiveLastRewardDate) / (1000 * 60 * 60 * 24);
  
  // Calculate annual rewards and prorate for days
  const annualRewards = shares * crypto.stakingRewards.annualRate;
  const dailyRewards = annualRewards / 365;
  const rewards = dailyRewards * daysSinceReward;
  
  return rewards;
}

// Check if crypto trading is available (24/7)
function isCryptoTradingOpen() {
  return true; // Crypto markets never close
}

// Get all available cryptos with current prices
function getAllCryptoPrices(currentDate) {
  const availableCryptos = cryptoData.getAvailableCryptos(currentDate);
  
  return availableCryptos.map(symbol => {
    const crypto = cryptoData.getCrypto(symbol);
    const price = getCryptoPrice(symbol, currentDate);
    
    return {
      symbol,
      name: crypto.name,
      price,
      type: 'cryptocurrency',
      baseVolatility: crypto.baseVolatility,
      tradingFee: crypto.tradingFee,
      hasStaking: crypto.stakingRewards && crypto.stakingRewards.enabled,
      maxSupply: crypto.maxSupply
    };
  }).filter(crypto => crypto.price !== null);
}

module.exports = {
  getCryptoPrice,
  getCryptoTradingFee,
  calculateStakingRewards,
  isCryptoTradingOpen,
  getAllCryptoPrices
};
