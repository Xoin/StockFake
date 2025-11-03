// Historical corporate events: mergers, bankruptcies, IPOs, and going private
// Events are shown as they occur in game time

const EVENT_TYPES = {
  MERGER: 'merger',
  ACQUISITION: 'acquisition',
  BANKRUPTCY: 'bankruptcy',
  IPO: 'ipo',
  GOING_PRIVATE: 'going_private',
  DELISTING: 'delisting'
};

const historicalCorporateEvents = [
  // 1970s Bankruptcies
  {
    eventType: EVENT_TYPES.BANKRUPTCY,
    eventDate: new Date('1970-06-21'),
    primarySymbol: 'PC',
    companyName: 'Penn Central Transportation',
    description: 'Penn Central files for bankruptcy, largest corporate bankruptcy in U.S. history at the time.',
    impact: 'Complete loss for shareholders',
    stockPriceImpact: -1.0  // 100% loss
  },

  // 1980s Events
  {
    eventType: EVENT_TYPES.BANKRUPTCY,
    eventDate: new Date('1982-09-13'),
    primarySymbol: 'MEX',
    companyName: 'Braniff International Airways',
    description: 'Braniff International files for bankruptcy after rapid expansion and fuel price increases.',
    impact: 'Complete loss for shareholders',
    stockPriceImpact: -1.0
  },

  // 1990s Events
  {
    eventType: EVENT_TYPES.ACQUISITION,
    eventDate: new Date('1995-12-15'),
    primarySymbol: 'NEXT',
    secondarySymbol: 'AAPL',
    acquirerSymbol: 'AAPL',
    companyName: 'NeXT Computer',
    description: 'Apple acquires NeXT for $429 million, bringing Steve Jobs back to Apple.',
    impact: 'NeXT shareholders receive cash, boosting Apple\'s technology capabilities',
    exchangeRatio: null,  // Cash acquisition
    cashPerShare: 4.29  // Approximate
  },

  // 2000s Events
  {
    eventType: EVENT_TYPES.BANKRUPTCY,
    eventDate: new Date('2001-12-02'),
    primarySymbol: 'ENRNQ',
    companyName: 'Enron Corporation',
    description: 'Enron files for bankruptcy following accounting fraud scandal.',
    impact: 'Complete loss for shareholders, major financial scandal',
    stockPriceImpact: -1.0
  },
  {
    eventType: EVENT_TYPES.BANKRUPTCY,
    eventDate: new Date('2002-07-21'),
    primarySymbol: 'WCOEQ',
    companyName: 'WorldCom',
    description: 'WorldCom files for bankruptcy after $11 billion accounting fraud.',
    impact: 'Complete loss for shareholders',
    stockPriceImpact: -1.0
  },
  {
    eventType: EVENT_TYPES.ACQUISITION,
    eventDate: new Date('2006-05-05'),
    primarySymbol: 'PIXR',
    secondarySymbol: 'DIS',
    acquirerSymbol: 'DIS',
    companyName: 'Pixar Animation Studios',
    description: 'Disney acquires Pixar for $7.4 billion in stock.',
    impact: 'Pixar shareholders receive Disney stock',
    exchangeRatio: 2.3,  // Approximate - Pixar to Disney
    cashPerShare: 0
  },
  {
    eventType: EVENT_TYPES.BANKRUPTCY,
    eventDate: new Date('2008-09-15'),
    primarySymbol: 'LEH',
    companyName: 'Lehman Brothers',
    description: 'Lehman Brothers files for bankruptcy, triggering the global financial crisis.',
    impact: 'Complete loss for shareholders, systemic financial crisis',
    stockPriceImpact: -1.0
  },
  {
    eventType: EVENT_TYPES.BANKRUPTCY,
    eventDate: new Date('2009-06-01'),
    primarySymbol: 'GMGMQ',
    companyName: 'General Motors',
    description: 'General Motors files for Chapter 11 bankruptcy, largest industrial bankruptcy.',
    impact: 'Old GM shareholders wiped out, company restructures as "New GM"',
    stockPriceImpact: -1.0
  },

  // 2010s Events
  {
    eventType: EVENT_TYPES.GOING_PRIVATE,
    eventDate: new Date('2013-11-14'),
    primarySymbol: 'DELL',
    companyName: 'Dell Inc.',
    description: 'Dell goes private in $24.9 billion leveraged buyout led by Michael Dell.',
    impact: 'Shareholders receive $13.75 per share in cash',
    cashPerShare: 13.75
  },
  {
    eventType: EVENT_TYPES.ACQUISITION,
    eventDate: new Date('2016-10-27'),
    primarySymbol: 'LNKD',
    secondarySymbol: 'MSFT',
    acquirerSymbol: 'MSFT',
    companyName: 'LinkedIn',
    description: 'Microsoft acquires LinkedIn for $26.2 billion in cash.',
    impact: 'LinkedIn shareholders receive $196 per share in cash',
    exchangeRatio: null,
    cashPerShare: 196.00
  },
  {
    eventType: EVENT_TYPES.ACQUISITION,
    eventDate: new Date('2017-06-16'),
    primarySymbol: 'WFM',
    secondarySymbol: 'AMZN',
    acquirerSymbol: 'AMZN',
    companyName: 'Whole Foods Market',
    description: 'Amazon acquires Whole Foods Market for $13.7 billion in cash.',
    impact: 'Whole Foods shareholders receive $42 per share in cash',
    exchangeRatio: null,
    cashPerShare: 42.00
  },

  // 2020s Events
  {
    eventType: EVENT_TYPES.BANKRUPTCY,
    eventDate: new Date('2020-05-22'),
    primarySymbol: 'HTZ',
    companyName: 'Hertz Global Holdings',
    description: 'Hertz files for bankruptcy during COVID-19 pandemic due to travel collapse.',
    impact: 'Shareholders face significant losses',
    stockPriceImpact: -0.95  // 95% loss
  },
  {
    eventType: EVENT_TYPES.BANKRUPTCY,
    eventDate: new Date('2022-11-11'),
    primarySymbol: 'FTX',
    companyName: 'FTX Trading',
    description: 'FTX cryptocurrency exchange files for bankruptcy amid fraud allegations.',
    impact: 'Complete loss for shareholders and depositors',
    stockPriceImpact: -1.0
  }
];

// Dynamic IPO generation for new companies entering the market
// This allows for simulating new companies going public in the future
const dynamicIPOCandidates = [
  {
    symbol: 'STRIPE',
    name: 'Stripe Inc.',
    sector: 'Technology',
    description: 'Online payment processing platform',
    minYear: 2025,  // Earliest year for IPO
    probability: 0.15  // 15% chance per year after minYear
  },
  {
    symbol: 'SPACEX',
    name: 'Space Exploration Technologies',
    sector: 'Industrials',
    description: 'Private space exploration and satellite company',
    minYear: 2026,
    probability: 0.10
  },
  {
    symbol: 'EPIC',
    name: 'Epic Games',
    sector: 'Technology',
    description: 'Video game and software developer',
    minYear: 2025,
    probability: 0.12
  },
  {
    symbol: 'DISCORD',
    name: 'Discord Inc.',
    sector: 'Technology',
    description: 'Communication platform for communities',
    minYear: 2025,
    probability: 0.15
  },
  {
    symbol: 'DATABRICKS',
    name: 'Databricks Inc.',
    sector: 'Technology',
    description: 'Data analytics and AI platform',
    minYear: 2025,
    probability: 0.18
  }
];

module.exports = {
  EVENT_TYPES,
  historicalCorporateEvents,
  dynamicIPOCandidates
};
