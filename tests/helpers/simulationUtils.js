/**
 * Simulation utilities for testing StockFake game logic
 * Provides functions to create mock game states and run market simulations
 */

const stocks = require('../../data/stocks');

/**
 * Create a mock user account for testing
 */
function createMockUserAccount(overrides = {}) {
  return {
    cash: overrides.cash !== undefined ? overrides.cash : 10000,
    creditScore: overrides.creditScore !== undefined ? overrides.creditScore : 750,
    portfolio: overrides.portfolio || {},
    indexFundHoldings: overrides.indexFundHoldings || {},
    shortPositions: overrides.shortPositions || {},
    purchaseHistory: overrides.purchaseHistory || {},
    transactions: overrides.transactions || [],
    dividends: overrides.dividends || [],
    taxes: overrides.taxes || [],
    fees: overrides.fees || [],
    lastTradeTime: overrides.lastTradeTime || {},
    shareholderInfluence: overrides.shareholderInfluence || {},
    loans: overrides.loans || [],
    loanHistory: overrides.loanHistory || [],
    lastNegativeBalanceCheck: overrides.lastNegativeBalanceCheck || null,
    daysWithNegativeBalance: overrides.daysWithNegativeBalance || 0,
    marginAccount: overrides.marginAccount || {
      marginBalance: 0,
      marginInterestRate: 0.08,
      lastMarginInterestDate: null,
      marginCalls: [],
      hasMarginEnabled: false
    },
    riskControls: overrides.riskControls || {
      maxLeverage: 2.0,
      maxPositionSize: 0.30,
      maintenanceMarginRatio: 0.30,
      concentrationWarningThreshold: 0.20
    }
  };
}

/**
 * Calculate portfolio value at a given time
 */
function calculatePortfolioValue(portfolio, gameTime, timeMultiplier = 3600) {
  let totalValue = 0;
  
  for (const [symbol, shares] of Object.entries(portfolio)) {
    if (shares <= 0) continue;
    
    const stockData = stocks.getStockPrice(symbol, gameTime, timeMultiplier, false);
    if (stockData && stockData.price > 0) {
      totalValue += stockData.price * shares;
    }
  }
  
  return totalValue;
}

/**
 * Calculate total loan debt
 */
function calculateTotalLoanDebt(loans) {
  return loans
    .filter(loan => loan.status === 'active')
    .reduce((total, loan) => total + loan.balance, 0);
}

/**
 * Calculate net worth (cash + portfolio value - loan debt)
 */
function calculateNetWorth(account, gameTime, timeMultiplier = 3600) {
  const portfolioValue = calculatePortfolioValue(account.portfolio, gameTime, timeMultiplier);
  const loanDebt = calculateTotalLoanDebt(account.loans);
  return account.cash + portfolioValue - loanDebt;
}

/**
 * Simulate a period of time and return account state changes
 */
function simulateTimePeriod(initialAccount, startDate, endDate, dailyCallback) {
  const account = JSON.parse(JSON.stringify(initialAccount)); // Deep clone
  const results = [];
  
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    if (dailyCallback) {
      const dayResult = dailyCallback(account, new Date(currentDate));
      results.push(dayResult);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    finalAccount: account,
    dailyResults: results
  };
}

/**
 * Create a scenario with specific market conditions
 */
function createScenario(name, config = {}) {
  return {
    name,
    startDate: config.startDate || new Date('1970-01-01T09:30:00'),
    endDate: config.endDate || new Date('1970-12-31T16:00:00'),
    initialCash: config.initialCash || 10000,
    initialPortfolio: config.initialPortfolio || {},
    initialLoans: config.initialLoans || [],
    events: config.events || [],
    description: config.description || ''
  };
}

/**
 * Run a market scenario simulation
 */
function runScenario(scenario) {
  const account = createMockUserAccount({
    cash: scenario.initialCash,
    portfolio: scenario.initialPortfolio,
    loans: scenario.initialLoans
  });
  
  return simulateTimePeriod(
    account,
    scenario.startDate,
    scenario.endDate,
    (acc, date) => {
      // Apply any events for this date
      const dayEvents = scenario.events.filter(e => 
        e.date.toDateString() === date.toDateString()
      );
      
      dayEvents.forEach(event => {
        if (event.action) {
          event.action(acc, date);
        }
      });
      
      return {
        date,
        cash: acc.cash,
        portfolioValue: calculatePortfolioValue(acc.portfolio, date),
        loanDebt: calculateTotalLoanDebt(acc.loans),
        netWorth: calculateNetWorth(acc, date)
      };
    }
  );
}

module.exports = {
  createMockUserAccount,
  calculatePortfolioValue,
  calculateTotalLoanDebt,
  calculateNetWorth,
  simulateTimePeriod,
  createScenario,
  runScenario
};
