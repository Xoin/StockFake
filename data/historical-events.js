// Historical market events with dates
// These events are only shown AFTER they occur in game time to prevent players from using future knowledge

const historicalEvents = [
  // 1970s
  {
    id: 'recession-1970',
    date: new Date('1970-12-01'),
    title: 'Recession of 1970',
    category: 'Economic',
    severity: 'moderate',
    description: 'The United States enters a recession lasting until November 1970, characterized by rising unemployment and inflation.',
    impact: 'Market decline, increased volatility'
  },
  {
    id: 'bretton-woods-1971',
    date: new Date('1971-08-15'),
    title: 'End of Bretton Woods System',
    category: 'Regulatory',
    severity: 'major',
    description: 'President Nixon ends the direct convertibility of the US dollar to gold, effectively ending the Bretton Woods system.',
    impact: 'Currency volatility, shift to floating exchange rates'
  },
  {
    id: 'oil-crisis-1973',
    date: new Date('1973-10-17'),
    title: '1973 Oil Crisis',
    category: 'Geopolitical',
    severity: 'severe',
    description: 'OPEC oil embargo causes oil prices to quadruple, leading to stagflation in Western economies.',
    impact: 'Sharp market decline, energy sector surge, recession'
  },
  {
    id: 'recession-1973',
    date: new Date('1973-11-01'),
    title: '1973-1975 Recession',
    category: 'Economic',
    severity: 'severe',
    description: 'The most severe recession since the Great Depression begins, lasting until March 1975.',
    impact: 'Prolonged bear market, high unemployment'
  },
  {
    id: 'may-day-1975',
    date: new Date('1975-05-01'),
    title: 'May Day: Deregulation of Commissions',
    category: 'Regulatory',
    severity: 'moderate',
    description: 'The SEC eliminates fixed commission rates, allowing brokers to negotiate fees with clients.',
    impact: 'Reduced trading costs, rise of discount brokers'
  },
  {
    id: 'recession-1980',
    date: new Date('1980-01-01'),
    title: '1980 Recession',
    category: 'Economic',
    severity: 'moderate',
    description: 'Brief recession caused by tight monetary policy to combat inflation.',
    impact: 'Market volatility, high interest rates'
  },
  {
    id: 'recession-1981',
    date: new Date('1981-07-01'),
    title: 'Early 1980s Recession',
    category: 'Economic',
    severity: 'severe',
    description: 'Deep recession caused by tight monetary policy under Fed Chairman Paul Volcker to combat inflation.',
    impact: 'Severe market decline, highest unemployment since Depression'
  },
  {
    id: 'bull-market-1982',
    date: new Date('1982-08-12'),
    title: 'Beginning of Great Bull Market',
    category: 'Market',
    severity: 'positive',
    description: 'Start of one of the longest bull markets in history, lasting until 2000.',
    impact: 'Sustained market growth, investor optimism'
  },
  {
    id: 'black-monday-1987',
    date: new Date('1987-10-19'),
    title: 'Black Monday',
    category: 'Crash',
    severity: 'severe',
    description: 'Stock markets around the world crash, with the Dow Jones falling 22.6% in a single day.',
    impact: 'Largest single-day percentage decline in history, market panic'
  },
  
  // 1990s
  {
    id: 'recession-1990',
    date: new Date('1990-07-01'),
    title: 'Early 1990s Recession',
    category: 'Economic',
    severity: 'moderate',
    description: 'Recession triggered by oil price shock from Gulf War and restrictive monetary policy.',
    impact: 'Market decline, savings and loan crisis'
  },
  {
    id: 'dotcom-boom-1995',
    date: new Date('1995-01-01'),
    title: 'Dot-com Boom Begins',
    category: 'Market',
    severity: 'positive',
    description: 'Rapid growth in internet and technology stocks as the World Wide Web gains popularity.',
    impact: 'Technology sector surge, speculative investing'
  },
  {
    id: 'asian-crisis-1997',
    date: new Date('1997-07-02'),
    title: 'Asian Financial Crisis',
    category: 'Geopolitical',
    severity: 'major',
    description: 'Financial crisis spreads across Asian economies, affecting global markets.',
    impact: 'Emerging market decline, flight to quality'
  },
  {
    id: 'ltcm-1998',
    date: new Date('1998-09-23'),
    title: 'LTCM Collapse',
    category: 'Financial',
    severity: 'major',
    description: 'Long-Term Capital Management hedge fund collapses, requiring Federal Reserve intervention.',
    impact: 'Market volatility, concerns about systemic risk'
  },
  
  // 2000s
  {
    id: 'dotcom-bubble-2000',
    date: new Date('2000-03-10'),
    title: 'Dot-com Bubble Bursts',
    category: 'Crash',
    severity: 'severe',
    description: 'Technology-heavy NASDAQ peaks and begins sharp decline, ending the dot-com bubble.',
    impact: 'Technology sector crash, recession, massive losses'
  },
  {
    id: 'recession-2001',
    date: new Date('2001-03-01'),
    title: '2001 Recession',
    category: 'Economic',
    severity: 'moderate',
    description: 'Recession following the dot-com bubble burst, exacerbated by 9/11 attacks.',
    impact: 'Market decline, low interest rates'
  },
  {
    id: '911-2001',
    date: new Date('2001-09-11'),
    title: 'September 11 Attacks',
    category: 'Geopolitical',
    severity: 'major',
    description: 'Terrorist attacks in the United States cause markets to close for a week.',
    impact: 'Market closure, sharp decline upon reopening, uncertainty'
  },
  {
    id: 'housing-boom-2003',
    date: new Date('2003-01-01'),
    title: 'Housing Boom',
    category: 'Market',
    severity: 'positive',
    description: 'U.S. housing market begins rapid appreciation, fueled by low interest rates and lax lending.',
    impact: 'Real estate sector surge, financial sector growth'
  },
  {
    id: 'bear-stearns-2008',
    date: new Date('2008-03-16'),
    title: 'Bear Stearns Collapse',
    category: 'Financial',
    severity: 'major',
    description: 'Bear Stearns is sold to JPMorgan Chase in a fire sale orchestrated by the Federal Reserve.',
    impact: 'Banking sector panic, credit crisis intensifies'
  },
  {
    id: 'lehman-2008',
    date: new Date('2008-09-15'),
    title: 'Lehman Brothers Bankruptcy',
    category: 'Crash',
    severity: 'severe',
    description: 'Lehman Brothers files for bankruptcy, triggering the global financial crisis.',
    impact: 'Market crash, credit freeze, global recession'
  },
  {
    id: 'financial-crisis-2008',
    date: new Date('2008-10-01'),
    title: 'Global Financial Crisis',
    category: 'Crash',
    severity: 'severe',
    description: 'Worst financial crisis since the Great Depression, requiring massive government intervention.',
    impact: 'Market crash, bank failures, Great Recession'
  },
  
  // 2010s
  {
    id: 'flash-crash-2010',
    date: new Date('2010-05-06'),
    title: 'Flash Crash',
    category: 'Market',
    severity: 'moderate',
    description: 'U.S. stock market experiences a trillion-dollar flash crash, recovering within minutes.',
    impact: 'Temporary market disruption, concerns about algorithmic trading'
  },
  {
    id: 'european-debt-2011',
    date: new Date('2011-07-01'),
    title: 'European Debt Crisis',
    category: 'Geopolitical',
    severity: 'major',
    description: 'Sovereign debt crisis threatens the eurozone, particularly Greece, Spain, and Italy.',
    impact: 'Market volatility, concerns about European banking system'
  },
  {
    id: 'bull-market-2013',
    date: new Date('2013-03-28'),
    title: 'Bull Market Milestone',
    category: 'Market',
    severity: 'positive',
    description: 'S&P 500 surpasses its pre-financial crisis peak, marking recovery from 2008.',
    impact: 'Investor confidence returns, sustained market growth'
  },
  {
    id: 'oil-crash-2014',
    date: new Date('2014-06-01'),
    title: 'Oil Price Collapse',
    category: 'Economic',
    severity: 'major',
    description: 'Global oil prices collapse from over $100 to below $30 per barrel.',
    impact: 'Energy sector decline, emerging market stress'
  },
  {
    id: 'china-crash-2015',
    date: new Date('2015-08-24'),
    title: 'China Stock Market Crash',
    category: 'Geopolitical',
    severity: 'major',
    description: 'Chinese stock market bubble bursts, causing global market turmoil.',
    impact: 'Global market sell-off, concerns about Chinese economy'
  },
  
  // 2020s
  {
    id: 'covid-crash-2020',
    date: new Date('2020-02-19'),
    title: 'COVID-19 Market Crash',
    category: 'Crash',
    severity: 'severe',
    description: 'Global pandemic causes fastest bear market in history, with markets falling over 30%.',
    impact: 'Market crash, economic shutdown, unprecedented stimulus'
  },
  {
    id: 'covid-recovery-2020',
    date: new Date('2020-08-18'),
    title: 'Rapid V-Shaped Recovery',
    category: 'Market',
    severity: 'positive',
    description: 'Markets recover to new highs within months, driven by massive fiscal and monetary stimulus.',
    impact: 'Technology sector boom, meme stock phenomenon'
  },
  {
    id: 'inflation-surge-2021',
    date: new Date('2021-05-01'),
    title: 'Inflation Surge',
    category: 'Economic',
    severity: 'major',
    description: 'Inflation reaches highest levels in 40 years, driven by supply chain issues and stimulus.',
    impact: 'Rising interest rates, market volatility'
  },
  {
    id: 'rate-hikes-2022',
    date: new Date('2022-03-16'),
    title: 'Aggressive Rate Hikes Begin',
    category: 'Regulatory',
    severity: 'major',
    description: 'Federal Reserve begins most aggressive rate hiking cycle in decades to combat inflation.',
    impact: 'Market decline, bond market volatility, tech sector weakness'
  },
  {
    id: 'banking-crisis-2023',
    date: new Date('2023-03-10'),
    title: 'Regional Banking Crisis',
    category: 'Financial',
    severity: 'major',
    description: 'Silicon Valley Bank and Signature Bank fail, triggering concerns about banking system.',
    impact: 'Banking sector stress, flight to safety, regulatory response'
  }
];

// Get events that have occurred by a given date
function getEventsUpToDate(currentGameDate) {
  const gameDate = new Date(currentGameDate);
  return historicalEvents
    .filter(event => event.date <= gameDate)
    .sort((a, b) => b.date - a.date); // Most recent first
}

// Get events by category
function getEventsByCategory(category, currentGameDate) {
  const availableEvents = getEventsUpToDate(currentGameDate);
  return availableEvents.filter(event => event.category === category);
}

// Get events by severity
function getEventsBySeverity(severity, currentGameDate) {
  const availableEvents = getEventsUpToDate(currentGameDate);
  return availableEvents.filter(event => event.severity === severity);
}

// Get all categories
function getCategories() {
  return ['Economic', 'Market', 'Crash', 'Regulatory', 'Geopolitical', 'Financial'];
}

// Get upcoming events (for admin/debug purposes only - not shown to players)
function getUpcomingEvents(currentGameDate, daysAhead = 365) {
  const gameDate = new Date(currentGameDate);
  const futureDate = new Date(gameDate.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return historicalEvents
    .filter(event => event.date > gameDate && event.date <= futureDate)
    .sort((a, b) => a.date - b.date); // Chronological order
}

module.exports = {
  historicalEvents,
  getEventsUpToDate,
  getEventsByCategory,
  getEventsBySeverity,
  getCategories,
  getUpcomingEvents
};
