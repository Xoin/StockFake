// Cryptocurrency data including Bitcoin, Ethereum, and major altcoins
// All cryptocurrencies are tradable from their respective launch dates

const cryptocurrencies = {
  'BTC': {
    symbol: 'BTC',
    name: 'Bitcoin',
    launchDate: '2009-01-03',
    maxSupply: 21000000,
    type: 'cryptocurrency',
    description: 'The first decentralized cryptocurrency',
    halvingSchedule: [
      { date: '2012-11-28', blockReward: 25 },
      { date: '2016-07-09', blockReward: 12.5 },
      { date: '2020-05-11', blockReward: 6.25 },
      { date: '2024-04-19', blockReward: 3.125 }
    ],
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.05 // 5% base daily volatility
  },
  'ETH': {
    symbol: 'ETH',
    name: 'Ethereum',
    launchDate: '2015-07-30',
    maxSupply: null, // No max supply
    type: 'cryptocurrency',
    description: 'Decentralized platform for smart contracts',
    majorEvents: [
      { date: '2022-09-15', event: 'The Merge', impact: 0.05, description: 'Transition from Proof of Work to Proof of Stake' }
    ],
    stakingRewards: {
      enabled: true,
      startDate: '2020-12-01', // Beacon Chain launch
      annualRate: 0.04 // 4% APR
    },
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.06 // 6% base daily volatility
  },
  'LTC': {
    symbol: 'LTC',
    name: 'Litecoin',
    launchDate: '2011-10-07',
    maxSupply: 84000000,
    type: 'cryptocurrency',
    description: 'Peer-to-peer cryptocurrency based on Bitcoin protocol',
    halvingSchedule: [
      { date: '2015-08-25', blockReward: 25 },
      { date: '2019-08-05', blockReward: 12.5 },
      { date: '2023-08-02', blockReward: 6.25 }
    ],
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.07 // 7% base daily volatility
  },
  'XRP': {
    symbol: 'XRP',
    name: 'Ripple',
    launchDate: '2012-06-02',
    maxSupply: 100000000000,
    type: 'cryptocurrency',
    description: 'Digital payment protocol and cryptocurrency',
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.08 // 8% base daily volatility
  },
  'BCH': {
    symbol: 'BCH',
    name: 'Bitcoin Cash',
    launchDate: '2017-08-01',
    maxSupply: 21000000,
    type: 'cryptocurrency',
    description: 'Fork of Bitcoin with increased block size',
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.09 // 9% base daily volatility
  },
  'ADA': {
    symbol: 'ADA',
    name: 'Cardano',
    launchDate: '2017-10-01',
    maxSupply: 45000000000,
    type: 'cryptocurrency',
    description: 'Proof-of-stake blockchain platform',
    stakingRewards: {
      enabled: true,
      startDate: '2020-07-29', // Shelley mainnet
      annualRate: 0.05 // 5% APR
    },
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.08 // 8% base daily volatility
  },
  'DOGE': {
    symbol: 'DOGE',
    name: 'Dogecoin',
    launchDate: '2013-12-06',
    maxSupply: null, // No max supply
    type: 'cryptocurrency',
    description: 'Cryptocurrency based on the "Doge" meme',
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.12 // 12% base daily volatility (meme coin)
  },
  'DOT': {
    symbol: 'DOT',
    name: 'Polkadot',
    launchDate: '2020-08-18',
    maxSupply: null,
    type: 'cryptocurrency',
    description: 'Multi-chain protocol for blockchain interoperability',
    stakingRewards: {
      enabled: true,
      startDate: '2020-08-18',
      annualRate: 0.10 // 10% APR
    },
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.09 // 9% base daily volatility
  },
  'MATIC': {
    symbol: 'MATIC',
    name: 'Polygon',
    launchDate: '2019-04-26',
    maxSupply: 10000000000,
    type: 'cryptocurrency',
    description: 'Ethereum scaling solution',
    stakingRewards: {
      enabled: true,
      startDate: '2020-05-30',
      annualRate: 0.08 // 8% APR
    },
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.10 // 10% base daily volatility
  },
  'SOL': {
    symbol: 'SOL',
    name: 'Solana',
    launchDate: '2020-03-16',
    maxSupply: null,
    type: 'cryptocurrency',
    description: 'High-performance blockchain',
    stakingRewards: {
      enabled: true,
      startDate: '2020-03-16',
      annualRate: 0.07 // 7% APR
    },
    tradingFee: 0.001, // 0.1%
    baseVolatility: 0.11 // 11% base daily volatility
  }
};

// Blockchain events that impact crypto prices
const blockchainEvents = [
  // Bitcoin Halvings
  {
    id: 'btc_halving_2012',
    date: '2012-11-28',
    affectedCryptos: ['BTC'],
    type: 'halving',
    impact: 0.10,
    description: 'Bitcoin first halving - Block reward reduced to 25 BTC'
  },
  {
    id: 'btc_halving_2016',
    date: '2016-07-09',
    affectedCryptos: ['BTC'],
    type: 'halving',
    impact: 0.15,
    description: 'Bitcoin second halving - Block reward reduced to 12.5 BTC'
  },
  {
    id: 'btc_halving_2020',
    date: '2020-05-11',
    affectedCryptos: ['BTC'],
    type: 'halving',
    impact: 0.12,
    description: 'Bitcoin third halving - Block reward reduced to 6.25 BTC'
  },
  {
    id: 'btc_halving_2024',
    date: '2024-04-19',
    affectedCryptos: ['BTC'],
    type: 'halving',
    impact: 0.10,
    description: 'Bitcoin fourth halving - Block reward reduced to 3.125 BTC'
  },
  
  // Ethereum events
  {
    id: 'eth_merge',
    date: '2022-09-15',
    affectedCryptos: ['ETH'],
    type: 'protocol_upgrade',
    impact: 0.08,
    description: 'The Merge - Ethereum transitions to Proof of Stake'
  },
  
  // Fork events
  {
    id: 'bch_fork',
    date: '2017-08-01',
    affectedCryptos: ['BTC', 'BCH'],
    type: 'fork',
    impact: -0.05,
    description: 'Bitcoin Cash hard fork from Bitcoin'
  },
  
  // Exchange hacks and major incidents
  {
    id: 'mtgox_hack',
    date: '2014-02-24',
    affectedCryptos: ['BTC'],
    type: 'exchange_hack',
    impact: -0.20,
    description: 'Mt. Gox exchange hack - 850,000 BTC stolen'
  },
  {
    id: 'ftx_collapse',
    date: '2022-11-08',
    affectedCryptos: ['BTC', 'ETH', 'SOL'],
    type: 'exchange_collapse',
    impact: -0.25,
    description: 'FTX exchange collapse - Major liquidity crisis'
  },
  
  // Regulatory events
  {
    id: 'china_ban_2021',
    date: '2021-09-24',
    affectedCryptos: ['BTC', 'ETH'],
    type: 'regulatory',
    impact: -0.15,
    description: 'China bans all cryptocurrency transactions'
  }
];

// Crypto market crashes and winters
const cryptoCrashes = [
  {
    id: 'crypto_winter_2018',
    name: '2018 Crypto Winter',
    startDate: '2018-01-01',
    endDate: '2018-12-31',
    affectedCryptos: ['BTC', 'ETH', 'LTC', 'XRP', 'BCH', 'ADA'],
    severity: 'severe',
    description: 'Prolonged bear market following 2017 bull run',
    impactMultiplier: 0.3 // Prices drop to 30% of peak
  },
  {
    id: 'luna_terra_collapse',
    name: 'Luna/Terra Collapse',
    startDate: '2022-05-09',
    endDate: '2022-05-13',
    affectedCryptos: ['BTC', 'ETH', 'ADA', 'DOT', 'MATIC', 'SOL'],
    severity: 'severe',
    description: 'Algorithmic stablecoin UST de-pegs, causing massive sell-off',
    impactMultiplier: 0.6 // Prices drop to 60% in days
  },
  {
    id: 'crypto_winter_2022',
    name: '2022 Crypto Winter',
    startDate: '2022-06-01',
    endDate: '2023-01-01',
    affectedCryptos: ['BTC', 'ETH', 'ADA', 'DOT', 'MATIC', 'SOL', 'DOGE'],
    severity: 'moderate',
    description: 'Bear market following Terra collapse and FTX implosion',
    impactMultiplier: 0.5 // Prices drop to 50%
  }
];

// Get cryptocurrency info
function getCrypto(symbol) {
  return cryptocurrencies[symbol] || null;
}

// Check if cryptocurrency is available at a given date
function isCryptoAvailable(symbol, currentDate) {
  const crypto = cryptocurrencies[symbol];
  if (!crypto) return false;
  
  const launchDate = new Date(crypto.launchDate);
  return currentDate >= launchDate;
}

// Get all available cryptocurrencies at a given date
function getAvailableCryptos(currentDate) {
  return Object.keys(cryptocurrencies).filter(symbol => 
    isCryptoAvailable(symbol, currentDate)
  );
}

// Get blockchain events for a specific date range
function getBlockchainEvents(startDate, endDate) {
  return blockchainEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startDate && eventDate <= endDate;
  });
}

// Get active crypto crashes at a given date
function getActiveCryptoCrashes(currentDate) {
  return cryptoCrashes.filter(crash => {
    const start = new Date(crash.startDate);
    const end = new Date(crash.endDate);
    return currentDate >= start && currentDate <= end;
  });
}

// Get all cryptocurrencies
function getAllCryptos() {
  return Object.values(cryptocurrencies);
}

module.exports = {
  cryptocurrencies,
  blockchainEvents,
  cryptoCrashes,
  getCrypto,
  isCryptoAvailable,
  getAvailableCryptos,
  getBlockchainEvents,
  getActiveCryptoCrashes,
  getAllCryptos
};
