// Historical trade halts during market crises
// These are periods when trading was suspended or significantly restricted

const tradeHalts = [
  // 1970s
  {
    id: 1,
    startDate: new Date('1970-05-25T09:30:00'), // Monday after Penn Central concerns
    endDate: new Date('1970-05-25T16:00:00'),
    reason: 'Emergency trading suspension due to Penn Central bankruptcy concerns',
    type: 'partial', // 'full' or 'partial'
    affectedSymbols: ['PC'] // Empty array means all stocks
  },
  
  // Oil Crisis
  {
    id: 2,
    startDate: new Date('1973-10-19T14:00:00'),
    endDate: new Date('1973-10-22T09:30:00'),
    reason: 'Trading suspension due to oil embargo crisis',
    type: 'full',
    affectedSymbols: []
  },
  
  // 1980s - Black Monday
  {
    id: 3,
    startDate: new Date('1987-10-19T14:30:00'), // Black Monday afternoon
    endDate: new Date('1987-10-20T10:00:00'),
    reason: 'Circuit breaker triggered - Market crash protection',
    type: 'full',
    affectedSymbols: []
  },
  {
    id: 4,
    startDate: new Date('1987-10-20T14:00:00'),
    endDate: new Date('1987-10-21T09:30:00'),
    reason: 'Extended trading halt following Black Monday',
    type: 'full',
    affectedSymbols: []
  },
  
  // 1989 - Mini-crash
  {
    id: 5,
    startDate: new Date('1989-10-13T14:30:00'),
    endDate: new Date('1989-10-16T10:00:00'),
    reason: 'Friday the 13th mini-crash - Circuit breaker',
    type: 'full',
    affectedSymbols: []
  },
  
  // 1997 - Asian Financial Crisis impact
  {
    id: 6,
    startDate: new Date('1997-10-27T14:30:00'),
    endDate: new Date('1997-10-28T10:00:00'),
    reason: 'Circuit breakers triggered amid Asian crisis contagion',
    type: 'full',
    affectedSymbols: []
  },
  
  // 2001 - 9/11
  {
    id: 7,
    startDate: new Date('2001-09-11T09:30:00'),
    endDate: new Date('2001-09-17T09:30:00'),
    reason: 'Market closure following September 11 attacks',
    type: 'full',
    affectedSymbols: []
  },
  
  // 2008 - Financial Crisis
  {
    id: 8,
    startDate: new Date('2008-09-15T14:30:00'), // Lehman Brothers collapse
    endDate: new Date('2008-09-16T10:00:00'),
    reason: 'Emergency halt following Lehman Brothers bankruptcy',
    type: 'full',
    affectedSymbols: []
  },
  {
    id: 9,
    startDate: new Date('2008-09-29T14:00:00'), // Day of biggest point drop
    endDate: new Date('2008-09-30T09:30:00'),
    reason: 'Circuit breaker - Extreme volatility',
    type: 'full',
    affectedSymbols: []
  },
  {
    id: 10,
    startDate: new Date('2008-10-10T13:00:00'),
    endDate: new Date('2008-10-13T09:30:00'),
    reason: 'Weekend emergency halt - Financial crisis deepening',
    type: 'full',
    affectedSymbols: []
  },
  
  // 2010 - Flash Crash
  {
    id: 11,
    startDate: new Date('2010-05-06T14:45:00'),
    endDate: new Date('2010-05-06T15:15:00'),
    reason: 'Flash Crash - Circuit breaker triggered',
    type: 'full',
    affectedSymbols: []
  },
  
  // 2020 - COVID-19 Pandemic
  {
    id: 12,
    startDate: new Date('2020-03-09T14:30:00'),
    endDate: new Date('2020-03-09T15:15:00'),
    reason: 'Circuit breaker Level 1 - COVID-19 market panic',
    type: 'full',
    affectedSymbols: []
  },
  {
    id: 13,
    startDate: new Date('2020-03-12T14:30:00'),
    endDate: new Date('2020-03-12T15:15:00'),
    reason: 'Circuit breaker Level 1 - COVID-19 volatility',
    type: 'full',
    affectedSymbols: []
  },
  {
    id: 14,
    startDate: new Date('2020-03-16T14:30:00'),
    endDate: new Date('2020-03-16T15:15:00'),
    reason: 'Circuit breaker Level 1 - Continued COVID-19 concerns',
    type: 'full',
    affectedSymbols: []
  },
  {
    id: 15,
    startDate: new Date('2020-03-18T14:30:00'),
    endDate: new Date('2020-03-18T15:15:00'),
    reason: 'Circuit breaker Level 1 - COVID-19 pandemic impact',
    type: 'full',
    affectedSymbols: []
  }
];

// Check if trading is halted at a given time
function isTradingHalted(currentTime, symbol = null) {
  for (const halt of tradeHalts) {
    if (currentTime >= halt.startDate && currentTime < halt.endDate) {
      // If it's a full halt, all trading is stopped
      if (halt.type === 'full') {
        return {
          isHalted: true,
          reason: halt.reason,
          endTime: halt.endDate
        };
      }
      
      // If it's a partial halt, check if this symbol is affected
      if (halt.type === 'partial' && symbol) {
        if (halt.affectedSymbols.length === 0 || halt.affectedSymbols.includes(symbol)) {
          return {
            isHalted: true,
            reason: halt.reason,
            endTime: halt.endDate
          };
        }
      }
    }
  }
  
  return { isHalted: false };
}

// Get all halts that have occurred up to a given time (for display in news/history)
function getHistoricalHalts(currentTime) {
  return tradeHalts.filter(halt => halt.startDate <= currentTime)
    .sort((a, b) => b.startDate - a.startDate);
}

// Get current or upcoming halt
function getCurrentOrUpcomingHalt(currentTime) {
  // Check for current halt
  const current = tradeHalts.find(halt => 
    currentTime >= halt.startDate && currentTime < halt.endDate
  );
  
  if (current) {
    return { status: 'current', halt: current };
  }
  
  // Check for upcoming halt in next 7 days
  const sevenDaysLater = new Date(currentTime.getTime() + (7 * 24 * 60 * 60 * 1000));
  const upcoming = tradeHalts.find(halt => 
    halt.startDate > currentTime && halt.startDate <= sevenDaysLater
  );
  
  if (upcoming) {
    return { status: 'upcoming', halt: upcoming };
  }
  
  return { status: 'none' };
}

module.exports = {
  tradeHalts,
  isTradingHalted,
  getHistoricalHalts,
  getCurrentOrUpcomingHalt
};
