// Dynamic share availability management
// Tracks outstanding shares and available float for each company

// Total outstanding shares per company (in millions, then converted to actual shares)
// This represents the public float available for trading
const companyShares = {
  // Technology
  'IBM': 920, 'AAPL': 15500, 'MSFT': 7430, 'INTC': 4100, 'ORCL': 2470,
  'CSCO': 4100, 'GOOGL': 5840, 'GOOG': 5840, 'AMZN': 10300, 'FB': 2850,
  'NVDA': 2470, 'NFLX': 441, 'ADBE': 478, 'CRM': 980, 'PYPL': 1160,
  'TXN': 920, 'QCOM': 1120, 'AVGO': 411, 'AMD': 1620, 'MU': 1110,
  'NOW': 200, 'INTU': 279, 'AMAT': 890, 'ADI': 370, 'LRCX': 140,
  'HPQ': 1220, 'HPE': 1300, 'DELL': 735, 'WDC': 310, 'STX': 226,
  
  // Energy
  'XOM': 4230, 'CVX': 1830, 'BP': 2000, 'RDS': 1600, 'TOT': 2650,
  'COP': 1340, 'SLB': 1390, 'OXY': 937, 'EOG': 583, 'PXD': 238,
  'HAL': 894, 'MPC': 411, 'VLO': 408, 'PSX': 453, 'KMI': 2260,
  'WMB': 1220, 'DVN': 665, 'APA': 378, 'HES': 310, 'NOV': 398,
  
  // Financial Services
  'JPM': 2950, 'BAC': 8200, 'WFC': 4100, 'C': 2050, 'GS': 347,
  'MS': 1640, 'AXP': 741, 'BLK': 152, 'SCHW': 1850, 'USB': 1490,
  'PNC': 423, 'TFC': 1340, 'COF': 419, 'BK': 820, 'STT': 357,
  
  // Insurance
  'BRK.B': 1330, 'AIG': 870, 'MET': 814, 'PRU': 394, 'ALL': 289,
  'TRV': 244, 'PGR': 584, 'AIG': 870, 'AFL': 674, 'HIG': 324,
  
  // Healthcare & Pharmaceuticals
  'JNJ': 2630, 'PFE': 5570, 'MRK': 2530, 'LLY': 948, 'BMY': 2160,
  'AMGN': 562, 'GILD': 1260, 'UNH': 943, 'CVS': 1310, 'ABT': 1760,
  'MDT': 1350, 'TMO': 393, 'ABBV': 1770, 'DHR': 716, 'ISRG': 117,
  'VRTX': 260, 'REGN': 107, 'BIIB': 146, 'ILMN': 146, 'ALXN': 223,
  
  // Industrials
  'GE': 8710, 'BA': 565, 'CAT': 536, 'MMM': 576, 'HON': 697,
  'LMT': 274, 'UTX': 866, 'DE': 312, 'EMR': 596, 'ETN': 398,
  'ITW': 324, 'PH': 131, 'ROK': 116, 'FTV': 387, 'CARR': 866,
  
  // Automotive
  'GM': 1430, 'F': 3960, 'TM': 1400, 'HMC': 1660, 'TSLA': 960,
  
  // Retail
  'WMT': 2720, 'HD': 1070, 'LOW': 691, 'TGT': 495, 'COST': 442,
  'KR': 756, 'WBA': 863, 'ROST': 353, 'TJX': 1200, 'DG': 235,
  
  // Consumer Goods
  'PG': 2480, 'KO': 4290, 'PEP': 1380, 'PM': 1560, 'MO': 1840,
  'CL': 847, 'KMB': 339, 'GIS': 607, 'K': 341, 'CPB': 302,
  'HSY': 204, 'MCD': 744, 'SBUX': 1160, 'NKE': 1570, 'EL': 361,
  
  // Telecom
  'T': 7140, 'VZ': 4140, 'TMUS': 1240, 'CTL': 1100, 'CHTR': 194,
  
  // Media & Entertainment
  'DIS': 1810, 'CMCSA': 4550, 'TWX': 777, 'FOXA': 1830, 'VIAB': 404,
  'NFLX': 441, 'EA': 295, 'ATVI': 775, 'TTWO': 114, 'LYV': 213,
  
  // Chemicals & Materials
  'DOW': 744, 'DD': 435, 'ECL': 287, 'APD': 221, 'PPG': 237,
  'NEM': 806, 'FCX': 1450, 'LIN': 521, 'SHW': 259, 'NUE': 299,
  
  // Utilities
  'NEE': 1960, 'DUK': 772, 'SO': 1060, 'D': 751, 'EXC': 975,
  'AEP': 494, 'SRE': 314, 'PEG': 504, 'ED': 340, 'XEL': 554,
  
  // Transportation
  'UPS': 869, 'FDX': 265, 'UNP': 667, 'NSC': 242, 'CSX': 757,
  'DAL': 648, 'AAL': 614, 'UAL': 290, 'LUV': 592, 'ALK': 124,
  
  // Real Estate
  'AMT': 446, 'PLD': 739, 'CCI': 421, 'SPG': 308, 'EQIX': 89,
  'PSA': 175, 'WELL': 414, 'DLR': 282, 'AVB': 139, 'EQR': 372,
  
  // Other
  'ADM': 559, 'BG': 440, 'TSN': 364, 'CLX': 125, 'IP': 392,
  'WY': 736, 'AA': 185, 'SBUX': 1160, 'YUM': 301, 'CMG': 28
};

// Convert millions to actual shares and initialize availability tracking
// We'll track what percentage of shares are available for trading (not held by institutions/insiders)
// Typically 50-80% of shares are in the public float
const shareAvailability = {};

for (const [symbol, sharesInMillions] of Object.entries(companyShares)) {
  const totalShares = sharesInMillions * 1000000; // Convert to actual shares
  const publicFloat = totalShares * (0.5 + Math.random() * 0.3); // 50-80% public float
  
  shareAvailability[symbol] = {
    totalOutstanding: Math.floor(totalShares),
    publicFloat: Math.floor(publicFloat),
    availableForTrading: Math.floor(publicFloat), // Initially all public float is available
    playerOwned: 0
  };
}

// Get available shares for a symbol
function getAvailableShares(symbol) {
  return shareAvailability[symbol] || null;
}

// Check if a purchase is possible
function canPurchaseShares(symbol, quantity) {
  const availability = shareAvailability[symbol];
  if (!availability) return { canPurchase: false, reason: 'Stock not found' };
  
  if (quantity > availability.availableForTrading) {
    return { 
      canPurchase: false, 
      reason: `Only ${availability.availableForTrading.toLocaleString()} shares available for trading`,
      availableShares: availability.availableForTrading
    };
  }
  
  return { canPurchase: true };
}

// Update share counts after a purchase
function recordPurchase(symbol, quantity) {
  const availability = shareAvailability[symbol];
  if (!availability) return false;
  
  availability.availableForTrading -= quantity;
  availability.playerOwned += quantity;
  return true;
}

// Update share counts after a sale
function recordSale(symbol, quantity) {
  const availability = shareAvailability[symbol];
  if (!availability) return false;
  
  availability.availableForTrading += quantity;
  availability.playerOwned -= quantity;
  return true;
}

// Get all share availability data
function getAllShareAvailability() {
  return shareAvailability;
}

// Calculate ownership percentage
function getOwnershipPercentage(symbol) {
  const availability = shareAvailability[symbol];
  if (!availability || availability.totalOutstanding === 0) return 0;
  
  return (availability.playerOwned / availability.totalOutstanding) * 100;
}

// Track last buyback check date
let lastBuybackCheck = null;

/**
 * Perform stock buybacks when economy is doing well
 * Companies buy back their own shares, reducing available float
 * @param {Date} currentTime - Current game time
 * @param {number} marketSentiment - Market sentiment score (-1 to 1, where 1 is very positive)
 * @returns {Array} - List of buyback events that occurred
 */
function processBuybacks(currentTime, marketSentiment = 0.5) {
  const buybackEvents = [];
  
  // Only process buybacks once per month
  if (lastBuybackCheck) {
    const daysSinceLastCheck = (currentTime - lastBuybackCheck) / (1000 * 60 * 60 * 24);
    if (daysSinceLastCheck < 30) {
      return buybackEvents;
    }
  }
  
  lastBuybackCheck = currentTime;
  
  // Buyback probability increases with positive market sentiment
  // When sentiment is high (>0.6), companies are more likely to buy back shares
  if (marketSentiment < 0.3) {
    return buybackEvents; // No buybacks in poor economy
  }
  
  // Seeded random for deterministic behavior
  const seed = Math.floor(currentTime.getTime() / (1000 * 60 * 60 * 24));
  
  for (const [symbol, availability] of Object.entries(shareAvailability)) {
    // Skip if no shares available to buy back
    if (availability.availableForTrading <= availability.totalOutstanding * 0.1) {
      continue; // Keep at least 10% float
    }
    
    // Probability of buyback increases with market sentiment
    const buybackProbability = Math.max(0, (marketSentiment - 0.3) * 0.15); // 0-10.5% monthly chance
    
    // Use deterministic random
    const random = Math.abs(Math.sin(seed + symbol.charCodeAt(0)) * 10000) % 1;
    
    if (random < buybackProbability) {
      // Calculate buyback amount (0.5% to 2% of public float)
      const buybackRandomFactor = Math.abs(Math.sin(seed * 2 + symbol.charCodeAt(0)) * 10000) % 1;
      const buybackPercentage = 0.005 + (buybackRandomFactor * 0.015); // 0.5% to 2%
      const sharesToBuyBack = Math.floor(availability.publicFloat * buybackPercentage);
      
      if (sharesToBuyBack > 0) {
        // Reduce available shares and total outstanding
        availability.availableForTrading = Math.max(
          Math.floor(availability.totalOutstanding * 0.1), // Minimum 10% float
          availability.availableForTrading - sharesToBuyBack
        );
        availability.totalOutstanding -= sharesToBuyBack;
        availability.publicFloat -= sharesToBuyBack;
        
        buybackEvents.push({
          symbol: symbol,
          date: currentTime,
          sharesBoughtBack: sharesToBuyBack,
          percentageOfFloat: (buybackPercentage * 100).toFixed(2),
          newTotalOutstanding: availability.totalOutstanding,
          newAvailableForTrading: availability.availableForTrading
        });
      }
    }
  }
  
  return buybackEvents;
}

/**
 * Issue new shares (opposite of buybacks)
 * Companies issue new shares when they need capital, increasing available float
 * @param {Date} currentTime - Current game time
 * @param {number} marketSentiment - Market sentiment score (-1 to 1)
 * @returns {Array} - List of stock issuance events
 */
function processShareIssuance(currentTime, marketSentiment = 0) {
  const issuanceEvents = [];
  
  // Share issuance is more likely in poor economy or when companies need capital
  // Only check quarterly
  const seed = Math.floor(currentTime.getTime() / (1000 * 60 * 60 * 24 * 90));
  
  for (const [symbol, availability] of Object.entries(shareAvailability)) {
    // Higher probability of issuance when market is weak
    const issuanceProbability = marketSentiment < 0 ? 0.05 : 0.02; // 5% or 2% quarterly
    
    const random = Math.abs(Math.sin(seed * 3 + symbol.charCodeAt(0)) * 10000) % 1;
    
    if (random < issuanceProbability) {
      // Calculate issuance amount (1% to 5% of current outstanding)
      const issuanceRandomFactor = Math.abs(Math.sin(seed * 4 + symbol.charCodeAt(0)) * 10000) % 1;
      const issuancePercentage = 0.01 + (issuanceRandomFactor * 0.04); // 1% to 5%
      const sharesToIssue = Math.floor(availability.totalOutstanding * issuancePercentage);
      
      if (sharesToIssue > 0) {
        // Increase available shares and total outstanding
        availability.availableForTrading += sharesToIssue;
        availability.totalOutstanding += sharesToIssue;
        availability.publicFloat += sharesToIssue;
        
        issuanceEvents.push({
          symbol: symbol,
          date: currentTime,
          sharesIssued: sharesToIssue,
          percentageIncrease: (issuancePercentage * 100).toFixed(2),
          newTotalOutstanding: availability.totalOutstanding,
          newAvailableForTrading: availability.availableForTrading
        });
      }
    }
  }
  
  return issuanceEvents;
}

/**
 * Adjust share counts based on historical stock splits
 * @param {string} symbol - Stock symbol
 * @param {number} splitRatio - Split ratio (e.g., 2 for 2:1 split)
 */
function applyStockSplit(symbol, splitRatio) {
  const availability = shareAvailability[symbol];
  if (!availability) return false;
  
  availability.totalOutstanding = Math.floor(availability.totalOutstanding * splitRatio);
  availability.publicFloat = Math.floor(availability.publicFloat * splitRatio);
  availability.availableForTrading = Math.floor(availability.availableForTrading * splitRatio);
  availability.playerOwned = Math.floor(availability.playerOwned * splitRatio);
  
  return true;
}

module.exports = {
  getAvailableShares,
  canPurchaseShares,
  recordPurchase,
  recordSale,
  getAllShareAvailability,
  getOwnershipPercentage,
  processBuybacks,
  processShareIssuance,
  applyStockSplit
};
