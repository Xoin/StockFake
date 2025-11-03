// Corporate Events Management
// Handles mergers, bankruptcies, IPOs, and going private events

const dbModule = require('../database');
const corporateEventsData = require('../data/corporate-events');
const { EVENT_TYPES } = corporateEventsData;

// Get database instance
function getDb() {
  return dbModule.db;
}

/**
 * Initialize corporate events in database from historical data
 */
function initializeCorporateEvents() {
  const db = getDb();
  
  // Check if events already initialized
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM corporate_events').get();
  if (eventCount.count > 0) {
    console.log('Corporate events already initialized');
    return;
  }

  console.log('Initializing historical corporate events...');
  
  for (const event of corporateEventsData.historicalCorporateEvents) {
    try {
      const eventData = JSON.stringify({
        companyName: event.companyName,
        description: event.description,
        impact: event.impact,
        stockPriceImpact: event.stockPriceImpact,
        exchangeRatio: event.exchangeRatio,
        cashPerShare: event.cashPerShare,
        acquirerSymbol: event.acquirerSymbol
      });

      dbModule.insertCorporateEvent.run(
        event.eventType,
        event.eventDate.toISOString(),
        event.primarySymbol,
        event.secondarySymbol || null,
        eventData,
        'pending'
      );
    } catch (err) {
      console.error(`Error initializing event for ${event.primarySymbol}:`, err.message);
    }
  }
  
  console.log(`Initialized ${corporateEventsData.historicalCorporateEvents.length} corporate events`);
}

/**
 * Check for and process corporate events that should trigger at current game time
 */
function processCorporateEvents(currentGameTime) {
  const events = dbModule.getPendingCorporateEvents.all(currentGameTime.toISOString());
  
  if (events.length === 0) {
    return [];
  }

  const processedEvents = [];
  
  for (const event of events) {
    try {
      const eventData = JSON.parse(event.event_data);
      
      switch (event.event_type) {
        case EVENT_TYPES.MERGER:
        case EVENT_TYPES.ACQUISITION:
          processMergerOrAcquisition(event, eventData, currentGameTime);
          break;
        case EVENT_TYPES.BANKRUPTCY:
          processBankruptcy(event, eventData, currentGameTime);
          break;
        case EVENT_TYPES.IPO:
          processIPO(event, eventData, currentGameTime);
          break;
        case EVENT_TYPES.GOING_PRIVATE:
          processGoingPrivate(event, eventData, currentGameTime);
          break;
      }
      
      // Mark event as applied
      dbModule.updateCorporateEventStatus.run('applied', currentGameTime.toISOString(), event.id);
      processedEvents.push(event);
      
    } catch (err) {
      console.error(`Error processing corporate event ${event.id}:`, err.message);
    }
  }
  
  return processedEvents;
}

/**
 * Process a merger or acquisition event
 */
function processMergerOrAcquisition(event, eventData, currentGameTime) {
  const db = getDb();
  
  // Check if user has position in acquired company
  const portfolio = dbModule.getPortfolioItem.get(event.primary_symbol);
  const shortPosition = dbModule.getShortPosition.get(event.primary_symbol);
  
  if (!portfolio && !shortPosition) {
    // User has no position, just update company status
    dbModule.upsertCompanyStatus.run(
      event.primary_symbol,
      'acquired',
      currentGameTime.toISOString(),
      `Acquired by ${eventData.acquirerSymbol || 'another company'}`,
      event.id
    );
    return;
  }

  // Generate email notification
  const email = generateMergerEmail(event, eventData, portfolio, shortPosition, currentGameTime);
  insertEmail(email);

  // Handle stock conversion or cash payout
  if (portfolio && portfolio.shares > 0) {
    if (eventData.cashPerShare > 0) {
      // Cash acquisition - liquidate position
      const cashReceived = portfolio.shares * eventData.cashPerShare;
      const userAccount = dbModule.getUserAccount.get();
      dbModule.updateUserAccount.run(userAccount.cash + cashReceived, userAccount.credit_score);
      
      // Record transaction
      dbModule.insertTransaction.run(
        currentGameTime.toISOString(),
        'merger_cash',
        event.primary_symbol,
        portfolio.shares,
        eventData.cashPerShare,
        0,
        0,
        cashReceived,
        JSON.stringify({ reason: 'Merger/Acquisition cash payout', eventId: event.id })
      );
      
      // Remove from portfolio
      dbModule.deletePortfolio.run(event.primary_symbol);
    } else if (eventData.exchangeRatio && eventData.acquirerSymbol) {
      // Stock-for-stock exchange
      const newShares = Math.floor(portfolio.shares * eventData.exchangeRatio);
      const acquirerPortfolio = dbModule.getPortfolioItem.get(eventData.acquirerSymbol);
      const currentShares = acquirerPortfolio ? acquirerPortfolio.shares : 0;
      
      dbModule.upsertPortfolio.run(eventData.acquirerSymbol, currentShares + newShares);
      dbModule.deletePortfolio.run(event.primary_symbol);
      
      // Record transaction
      dbModule.insertTransaction.run(
        currentGameTime.toISOString(),
        'merger_exchange',
        event.primary_symbol,
        portfolio.shares,
        0,
        0,
        0,
        0,
        JSON.stringify({ 
          reason: 'Merger stock exchange',
          acquirerSymbol: eventData.acquirerSymbol,
          sharesReceived: newShares,
          exchangeRatio: eventData.exchangeRatio,
          eventId: event.id
        })
      );
    }
  }

  // Handle short positions - force cover
  if (shortPosition && shortPosition.shares > 0) {
    const coverPrice = eventData.cashPerShare || 0;  // Use cash price or 0 if stock-for-stock
    const coverCost = shortPosition.shares * coverPrice;
    const profit = (shortPosition.borrow_price - coverPrice) * shortPosition.shares;
    
    const userAccount = dbModule.getUserAccount.get();
    dbModule.updateUserAccount.run(userAccount.cash - coverCost + profit, userAccount.credit_score);
    
    dbModule.insertTransaction.run(
      currentGameTime.toISOString(),
      'forced_cover',
      event.primary_symbol,
      shortPosition.shares,
      coverPrice,
      0,
      0,
      -coverCost,
      JSON.stringify({ reason: 'Forced cover due to merger', eventId: event.id })
    );
    
    dbModule.deleteShortPosition.run(event.primary_symbol);
  }

  // Update company status
  dbModule.upsertCompanyStatus.run(
    event.primary_symbol,
    'acquired',
    currentGameTime.toISOString(),
    `Acquired by ${eventData.acquirerSymbol || 'another company'}`,
    event.id
  );
}

/**
 * Process a bankruptcy event
 */
function processBankruptcy(event, eventData, currentGameTime) {
  const portfolio = dbModule.getPortfolioItem.get(event.primary_symbol);
  const shortPosition = dbModule.getShortPosition.get(event.primary_symbol);
  
  if (!portfolio && !shortPosition) {
    // User has no position
    dbModule.upsertCompanyStatus.run(
      event.primary_symbol,
      'bankrupt',
      currentGameTime.toISOString(),
      'Filed for bankruptcy',
      event.id
    );
    return;
  }

  // Generate email notification
  const email = generateBankruptcyEmail(event, eventData, portfolio, shortPosition, currentGameTime);
  insertEmail(email);

  // Handle long positions - complete loss
  if (portfolio && portfolio.shares > 0) {
    // Record the loss
    dbModule.insertTransaction.run(
      currentGameTime.toISOString(),
      'bankruptcy_loss',
      event.primary_symbol,
      portfolio.shares,
      0,
      0,
      0,
      0,
      JSON.stringify({ 
        reason: 'Bankruptcy - total loss',
        sharesLost: portfolio.shares,
        eventId: event.id
      })
    );
    
    // Remove from portfolio
    dbModule.deletePortfolio.run(event.primary_symbol);
    dbModule.deleteShareholderInfluence.run(event.primary_symbol);
  }

  // Handle short positions - profit (stock goes to $0)
  if (shortPosition && shortPosition.shares > 0) {
    const profit = shortPosition.borrow_price * shortPosition.shares;
    const userAccount = dbModule.getUserAccount.get();
    dbModule.updateUserAccount.run(userAccount.cash + profit, userAccount.credit_score);
    
    dbModule.insertTransaction.run(
      currentGameTime.toISOString(),
      'bankruptcy_profit',
      event.primary_symbol,
      shortPosition.shares,
      0,
      0,
      0,
      profit,
      JSON.stringify({ 
        reason: 'Short position profit from bankruptcy',
        borrowPrice: shortPosition.borrow_price,
        eventId: event.id
      })
    );
    
    dbModule.deleteShortPosition.run(event.primary_symbol);
  }

  // Update company status
  dbModule.upsertCompanyStatus.run(
    event.primary_symbol,
    'bankrupt',
    currentGameTime.toISOString(),
    'Filed for bankruptcy',
    event.id
  );
}

/**
 * Process an IPO event (make company available for trading)
 */
function processIPO(event, eventData, currentGameTime) {
  // Update company status to active
  dbModule.upsertCompanyStatus.run(
    event.primary_symbol,
    'active',
    currentGameTime.toISOString(),
    'IPO - Company went public',
    event.id
  );

  // Generate email notification about new IPO
  const email = generateIPOEmail(event, eventData, currentGameTime);
  insertEmail(email);
}

/**
 * Process a going private event
 */
function processGoingPrivate(event, eventData, currentGameTime) {
  const portfolio = dbModule.getPortfolioItem.get(event.primary_symbol);
  const shortPosition = dbModule.getShortPosition.get(event.primary_symbol);
  
  if (!portfolio && !shortPosition) {
    dbModule.upsertCompanyStatus.run(
      event.primary_symbol,
      'private',
      currentGameTime.toISOString(),
      'Went private',
      event.id
    );
    return;
  }

  // Generate email notification
  const email = generateGoingPrivateEmail(event, eventData, portfolio, shortPosition, currentGameTime);
  insertEmail(email);

  // Force liquidation at buyout price
  if (portfolio && portfolio.shares > 0 && eventData.cashPerShare > 0) {
    const cashReceived = portfolio.shares * eventData.cashPerShare;
    const userAccount = dbModule.getUserAccount.get();
    dbModule.updateUserAccount.run(userAccount.cash + cashReceived, userAccount.credit_score);
    
    dbModule.insertTransaction.run(
      currentGameTime.toISOString(),
      'going_private',
      event.primary_symbol,
      portfolio.shares,
      eventData.cashPerShare,
      0,
      0,
      cashReceived,
      JSON.stringify({ reason: 'Going private buyout', eventId: event.id })
    );
    
    dbModule.deletePortfolio.run(event.primary_symbol);
    dbModule.deleteShareholderInfluence.run(event.primary_symbol);
  }

  // Force cover short positions
  if (shortPosition && shortPosition.shares > 0 && eventData.cashPerShare > 0) {
    const coverCost = shortPosition.shares * eventData.cashPerShare;
    const profit = (shortPosition.borrow_price - eventData.cashPerShare) * shortPosition.shares;
    
    const userAccount = dbModule.getUserAccount.get();
    dbModule.updateUserAccount.run(userAccount.cash - coverCost + profit, userAccount.credit_score);
    
    dbModule.insertTransaction.run(
      currentGameTime.toISOString(),
      'forced_cover',
      event.primary_symbol,
      shortPosition.shares,
      eventData.cashPerShare,
      0,
      0,
      -coverCost,
      JSON.stringify({ reason: 'Forced cover due to going private', eventId: event.id })
    );
    
    dbModule.deleteShortPosition.run(event.primary_symbol);
  }

  dbModule.upsertCompanyStatus.run(
    event.primary_symbol,
    'private',
    currentGameTime.toISOString(),
    'Went private',
    event.id
  );
}

/**
 * Generate dynamic financial data for a company
 */
function generateFinancialData(symbol, startYear, endYear, sector = 'Technology') {
  const financials = [];
  
  // Base values depend on sector and symbol
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 31 + symbol.charCodeAt(i)) % 1000000;
  }
  
  // Sector multipliers
  const sectorMultipliers = {
    'Technology': { revenue: 1.2, growth: 1.15 },
    'Financial': { revenue: 1.5, growth: 1.08 },
    'Energy': { revenue: 2.0, growth: 1.05 },
    'Healthcare': { revenue: 1.3, growth: 1.12 },
    'Industrials': { revenue: 1.8, growth: 1.06 },
    'Consumer': { revenue: 1.0, growth: 1.10 }
  };
  
  const multipliers = sectorMultipliers[sector] || sectorMultipliers['Technology'];
  
  // Initial values (millions)
  let revenue = (100 + (seed % 900)) * multipliers.revenue;
  let netIncome = revenue * (0.05 + (seed % 100) / 1000);
  let assets = revenue * (1.5 + (seed % 50) / 100);
  let employees = Math.floor(50 + (seed % 500));
  let patents = Math.floor(10 + (seed % 100));
  
  for (let year = startYear; year <= endYear; year++) {
    // Add some year-to-year variation
    const yearSeed = year * 1103515245 + seed;
    const growthRate = multipliers.growth + ((yearSeed % 100) / 1000 - 0.05);
    
    revenue *= growthRate;
    netIncome = revenue * (0.05 + ((yearSeed % 150) / 1000));
    assets *= (1 + (growthRate - 1) * 0.8);
    employees = Math.floor(employees * (1 + (growthRate - 1) * 0.5));
    patents = Math.floor(patents * (1 + (growthRate - 1) * 0.3));
    
    financials.push({
      symbol,
      year,
      revenue: Math.round(revenue),
      netIncome: Math.round(netIncome),
      assets: Math.round(assets),
      employees,
      patents
    });
  }
  
  return financials;
}

/**
 * Save financial data to database
 */
function saveFinancialData(financialData) {
  for (const data of financialData) {
    try {
      dbModule.insertCompanyFinancial.run(
        data.symbol,
        data.year,
        data.revenue,
        data.netIncome,
        data.assets,
        data.employees,
        data.patents
      );
    } catch (err) {
      console.error(`Error saving financial data for ${data.symbol} ${data.year}:`, err.message);
    }
  }
}

/**
 * Email generation functions
 */
function generateMergerEmail(event, eventData, portfolio, shortPosition, currentGameTime) {
  const hasLongPosition = portfolio && portfolio.shares > 0;
  const hasShortPosition = shortPosition && shortPosition.shares > 0;
  
  let body = `IMPORTANT: Corporate Action Notice\n\n`;
  body += `${eventData.companyName} (${event.primary_symbol}) has been acquired`;
  if (eventData.acquirerSymbol) {
    body += ` by ${eventData.acquirerSymbol}`;
  }
  body += `.\n\n`;
  body += `${eventData.description}\n\n`;
  
  if (hasLongPosition) {
    body += `YOUR POSITION:\n`;
    body += `You held ${portfolio.shares} shares of ${event.primary_symbol}\n\n`;
    
    if (eventData.cashPerShare > 0) {
      body += `You will receive $${eventData.cashPerShare.toFixed(2)} per share in cash.\n`;
      body += `Total cash received: $${(portfolio.shares * eventData.cashPerShare).toFixed(2)}\n\n`;
    } else if (eventData.exchangeRatio && eventData.acquirerSymbol) {
      const newShares = Math.floor(portfolio.shares * eventData.exchangeRatio);
      body += `Your shares have been converted to ${newShares} shares of ${eventData.acquirerSymbol}\n`;
      body += `Exchange ratio: ${eventData.exchangeRatio}:1\n\n`;
    }
  }
  
  if (hasShortPosition) {
    body += `SHORT POSITION:\n`;
    body += `Your short position of ${shortPosition.shares} shares has been automatically covered.\n\n`;
  }
  
  body += `This corporate action has been automatically processed in your account.\n\n`;
  body += `Investment Operations Team`;
  
  return {
    from: 'corporate.actions@stockfake.com',
    subject: `Corporate Action: ${event.primary_symbol} Merger/Acquisition`,
    body,
    date: currentGameTime,
    category: 'corporate_action',
    spam: false
  };
}

function generateBankruptcyEmail(event, eventData, portfolio, shortPosition, currentGameTime) {
  const hasLongPosition = portfolio && portfolio.shares > 0;
  const hasShortPosition = shortPosition && shortPosition.shares > 0;
  
  let body = `URGENT: Bankruptcy Notice\n\n`;
  body += `${eventData.companyName} (${event.primary_symbol}) has filed for bankruptcy.\n\n`;
  body += `${eventData.description}\n\n`;
  
  if (hasLongPosition) {
    body += `YOUR POSITION:\n`;
    body += `You held ${portfolio.shares} shares of ${event.primary_symbol}\n\n`;
    body += `Unfortunately, your shares are now worthless. This represents a complete loss of your investment.\n\n`;
    body += `Your position has been removed from your portfolio.\n\n`;
  }
  
  if (hasShortPosition) {
    body += `SHORT POSITION:\n`;
    body += `Your short position of ${shortPosition.shares} shares has been closed.\n`;
    const profit = shortPosition.borrow_price * shortPosition.shares;
    body += `Profit from short position: $${profit.toFixed(2)}\n\n`;
  }
  
  body += `We apologize for this outcome.\n\n`;
  body += `Investment Operations Team`;
  
  return {
    from: 'corporate.actions@stockfake.com',
    subject: `URGENT: ${event.primary_symbol} Bankruptcy Filing`,
    body,
    date: currentGameTime,
    category: 'corporate_action',
    spam: false
  };
}

function generateIPOEmail(event, eventData, currentGameTime) {
  let body = `NEW INVESTMENT OPPORTUNITY\n\n`;
  body += `${eventData.companyName} (${event.primary_symbol}) is now publicly traded!\n\n`;
  body += `${eventData.description}\n\n`;
  body += `The company is now available for trading on our platform.\n\n`;
  body += `Research Team`;
  
  return {
    from: 'research@stockfake.com',
    subject: `New IPO: ${event.primary_symbol} - ${eventData.companyName}`,
    body,
    date: currentGameTime,
    category: 'ipo',
    spam: false
  };
}

function generateGoingPrivateEmail(event, eventData, portfolio, shortPosition, currentGameTime) {
  const hasLongPosition = portfolio && portfolio.shares > 0;
  const hasShortPosition = shortPosition && shortPosition.shares > 0;
  
  let body = `IMPORTANT: Corporate Action Notice\n\n`;
  body += `${eventData.companyName} (${event.primary_symbol}) is going private.\n\n`;
  body += `${eventData.description}\n\n`;
  
  if (hasLongPosition) {
    body += `YOUR POSITION:\n`;
    body += `You held ${portfolio.shares} shares of ${event.primary_symbol}\n\n`;
    body += `You will receive $${eventData.cashPerShare.toFixed(2)} per share in cash.\n`;
    body += `Total cash received: $${(portfolio.shares * eventData.cashPerShare).toFixed(2)}\n\n`;
  }
  
  if (hasShortPosition) {
    body += `SHORT POSITION:\n`;
    body += `Your short position has been automatically covered at $${eventData.cashPerShare.toFixed(2)} per share.\n\n`;
  }
  
  body += `The company will no longer be publicly traded.\n\n`;
  body += `Investment Operations Team`;
  
  return {
    from: 'corporate.actions@stockfake.com',
    subject: `Corporate Action: ${event.primary_symbol} Going Private`,
    body,
    date: currentGameTime,
    category: 'corporate_action',
    spam: false
  };
}

function insertEmail(emailData) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO emails (from_address, subject, body, date, is_read, spam, category)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `);
  
  stmt.run(
    emailData.from,
    emailData.subject,
    emailData.body,
    emailData.date.toISOString(),
    emailData.spam ? 1 : 0,
    emailData.category || null
  );
}

/**
 * Check if a company is available for trading
 */
function isCompanyAvailable(symbol, currentGameTime) {
  const status = dbModule.getCompanyStatus.get(symbol);
  
  if (!status) {
    return true;  // No status entry means active by default
  }
  
  return status.status === 'active';
}

/**
 * Get list of all unavailable companies with reasons
 */
function getUnavailableCompanies() {
  const allStatuses = dbModule.getAllCompanyStatuses.all();
  return allStatuses.filter(s => s.status !== 'active');
}

module.exports = {
  initializeCorporateEvents,
  processCorporateEvents,
  generateFinancialData,
  saveFinancialData,
  isCompanyAvailable,
  getUnavailableCompanies
};
