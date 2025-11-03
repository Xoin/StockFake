const db = require('../database');

/**
 * Data Retention and Pruning Module
 * 
 * Manages automatic cleanup of old historical data to optimize memory and storage usage.
 * Preserves business-critical data while pruning old transaction history, emails, and event logs.
 */

// Default retention periods (in days)
const DEFAULT_RETENTION_PERIODS = {
  transactions: 365 * 5,      // Keep 5 years of transaction history
  emails: 365 * 2,            // Keep 2 years of emails
  dividends: 365 * 5,         // Keep 5 years of dividend history
  taxes: 365 * 7,             // Keep 7 years of tax records (IRS requirement)
  fees: 365 * 5,              // Keep 5 years of fee history
  loanHistory: 365 * 7,       // Keep 7 years of loan history
  corporateEvents: 365 * 10,  // Keep 10 years of corporate events (applied events)
  rebalancingEvents: 365 * 3, // Keep 3 years of rebalancing history
  marketCrashEvents: 365 * 10, // Keep 10 years of crash event history (inactive only)
  stockSplits: 365 * 10,      // Keep 10 years of stock split history
  pendingOrders: 30,          // Keep 30 days of completed/cancelled pending orders
  companyFinancials: 365 * 10 // Keep 10 years of company financial data
};

/**
 * Get retention configuration from database or use defaults
 */
function getRetentionConfig() {
  try {
    const config = db.db.prepare(`
      SELECT * FROM data_retention_config WHERE id = 1
    `).get();
    
    if (config) {
      return JSON.parse(config.retention_periods);
    }
  } catch (error) {
    // Table doesn't exist yet, use defaults
  }
  
  return DEFAULT_RETENTION_PERIODS;
}

/**
 * Save retention configuration to database
 */
function saveRetentionConfig(config) {
  try {
    db.db.prepare(`
      INSERT INTO data_retention_config (id, retention_periods, updated_at)
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        retention_periods = excluded.retention_periods,
        updated_at = CURRENT_TIMESTAMP
    `).run(JSON.stringify(config));
  } catch (error) {
    console.error('Error saving retention config:', error);
  }
}

/**
 * Calculate cutoff date for retention period
 */
function getCutoffDate(currentDate, retentionDays) {
  const cutoff = new Date(currentDate);
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff.toISOString();
}

/**
 * Prune old transactions
 */
function pruneTransactions(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM transactions 
      WHERE date < ? 
      AND type NOT IN ('initial_balance', 'game_reset')
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning transactions:', error);
    return 0;
  }
}

/**
 * Prune old emails (keep unread emails regardless of age)
 */
function pruneEmails(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM emails 
      WHERE date < ? 
      AND is_read = 1
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning emails:', error);
    return 0;
  }
}

/**
 * Prune old dividends
 */
function pruneDividends(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM dividends 
      WHERE date < ?
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning dividends:', error);
    return 0;
  }
}

/**
 * Prune old taxes
 */
function pruneTaxes(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM taxes 
      WHERE date < ?
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning taxes:', error);
    return 0;
  }
}

/**
 * Prune old fees
 */
function pruneFees(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM fees 
      WHERE date < ?
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning fees:', error);
    return 0;
  }
}

/**
 * Prune old loan history
 */
function pruneLoanHistory(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM loan_history 
      WHERE date < ?
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning loan history:', error);
    return 0;
  }
}

/**
 * Prune old applied corporate events
 */
function pruneCorporateEvents(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM corporate_events 
      WHERE event_date < ? 
      AND status = 'applied'
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning corporate events:', error);
    return 0;
  }
}

/**
 * Prune old rebalancing events
 */
function pruneRebalancingEvents(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM index_fund_rebalancing_events 
      WHERE rebalancing_date < ?
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning rebalancing events:', error);
    return 0;
  }
}

/**
 * Prune old inactive market crash events
 */
function pruneMarketCrashEvents(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM market_crash_events 
      WHERE deactivated_at < ? 
      AND status = 'inactive'
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning market crash events:', error);
    return 0;
  }
}

/**
 * Prune old stock splits
 */
function pruneStockSplits(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM stock_splits 
      WHERE split_date < ?
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning stock splits:', error);
    return 0;
  }
}

/**
 * Prune old completed/cancelled pending orders
 */
function prunePendingOrders(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    const result = db.db.prepare(`
      DELETE FROM pending_orders 
      WHERE created_at < ? 
      AND status IN ('executed', 'cancelled', 'failed')
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning pending orders:', error);
    return 0;
  }
}

/**
 * Prune old company financials (keep one record per year)
 */
function pruneCompanyFinancials(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  const cutoffYear = new Date(cutoffDate).getFullYear();
  
  try {
    const result = db.db.prepare(`
      DELETE FROM company_financials 
      WHERE year < ?
    `).run(cutoffYear);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning company financials:', error);
    return 0;
  }
}

/**
 * Prune old index fund constituents (keep current and historical snapshots)
 * This keeps quarterly snapshots for analysis while removing excessive detail
 */
function pruneIndexFundConstituents(currentDate, retentionDays) {
  const cutoffDate = getCutoffDate(currentDate, retentionDays);
  
  try {
    // Keep only quarterly snapshots (Jan, Apr, Jul, Oct) for old data
    const result = db.db.prepare(`
      DELETE FROM index_fund_constituents 
      WHERE effective_date < ?
      AND CAST(strftime('%m', effective_date) AS INTEGER) NOT IN (1, 4, 7, 10)
    `).run(cutoffDate);
    
    return result.changes;
  } catch (error) {
    console.error('Error pruning index fund constituents:', error);
    return 0;
  }
}

/**
 * Get pruning statistics
 */
function getPruningStats(currentDate) {
  const config = getRetentionConfig();
  const stats = {};
  
  const tables = [
    { name: 'transactions', dateColumn: 'date', configKey: 'transactions' },
    { name: 'emails', dateColumn: 'date', configKey: 'emails', extra: 'AND is_read = 1' },
    { name: 'dividends', dateColumn: 'date', configKey: 'dividends' },
    { name: 'taxes', dateColumn: 'date', configKey: 'taxes' },
    { name: 'fees', dateColumn: 'date', configKey: 'fees' },
    { name: 'loan_history', dateColumn: 'date', configKey: 'loanHistory' },
    { name: 'corporate_events', dateColumn: 'event_date', configKey: 'corporateEvents', extra: 'AND status = \'applied\'' },
    { name: 'index_fund_rebalancing_events', dateColumn: 'rebalancing_date', configKey: 'rebalancingEvents' },
    { name: 'market_crash_events', dateColumn: 'deactivated_at', configKey: 'marketCrashEvents', extra: 'AND status = \'inactive\'' },
    { name: 'stock_splits', dateColumn: 'split_date', configKey: 'stockSplits' },
    { name: 'pending_orders', dateColumn: 'created_at', configKey: 'pendingOrders', extra: 'AND status IN (\'executed\', \'cancelled\', \'failed\')' }
  ];
  
  tables.forEach(({ name, dateColumn, configKey, extra }) => {
    try {
      const cutoffDate = getCutoffDate(currentDate, config[configKey]);
      const extraClause = extra || '';
      
      const total = db.db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
      const pruneable = db.db.prepare(`
        SELECT COUNT(*) as count FROM ${name} 
        WHERE ${dateColumn} < ? ${extraClause}
      `).get(cutoffDate);
      
      stats[name] = {
        total: total.count,
        pruneable: pruneable.count,
        retentionDays: config[configKey],
        cutoffDate
      };
    } catch (error) {
      stats[name] = { error: error.message };
    }
  });
  
  return stats;
}

/**
 * Main pruning function - prunes all old data according to retention config
 */
function pruneOldData(currentDate) {
  const config = getRetentionConfig();
  const results = {
    timestamp: currentDate.toISOString(),
    config,
    pruned: {}
  };
  
  console.log('Starting data pruning operation...');
  console.log('Current date:', currentDate.toISOString());
  
  // Prune each data type
  results.pruned.transactions = pruneTransactions(currentDate, config.transactions);
  results.pruned.emails = pruneEmails(currentDate, config.emails);
  results.pruned.dividends = pruneDividends(currentDate, config.dividends);
  results.pruned.taxes = pruneTaxes(currentDate, config.taxes);
  results.pruned.fees = pruneFees(currentDate, config.fees);
  results.pruned.loanHistory = pruneLoanHistory(currentDate, config.loanHistory);
  results.pruned.corporateEvents = pruneCorporateEvents(currentDate, config.corporateEvents);
  results.pruned.rebalancingEvents = pruneRebalancingEvents(currentDate, config.rebalancingEvents);
  results.pruned.marketCrashEvents = pruneMarketCrashEvents(currentDate, config.marketCrashEvents);
  results.pruned.stockSplits = pruneStockSplits(currentDate, config.stockSplits);
  results.pruned.pendingOrders = prunePendingOrders(currentDate, config.pendingOrders);
  results.pruned.companyFinancials = pruneCompanyFinancials(currentDate, config.companyFinancials);
  results.pruned.indexFundConstituents = pruneIndexFundConstituents(currentDate, config.rebalancingEvents);
  
  const totalPruned = Object.values(results.pruned).reduce((sum, count) => sum + count, 0);
  
  console.log(`Data pruning complete. Removed ${totalPruned} records.`);
  console.log('Pruned by category:', results.pruned);
  
  // Update last pruning timestamp
  updateLastPruningTime(currentDate);
  
  return results;
}

/**
 * Update last pruning timestamp
 */
function updateLastPruningTime(currentDate) {
  try {
    db.db.prepare(`
      INSERT INTO data_retention_config (id, last_pruning_date, updated_at)
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        last_pruning_date = excluded.last_pruning_date,
        updated_at = CURRENT_TIMESTAMP
    `).run(currentDate.toISOString());
  } catch (error) {
    console.error('Error updating last pruning time:', error);
  }
}

/**
 * Get last pruning time
 */
function getLastPruningTime() {
  try {
    const result = db.db.prepare(`
      SELECT last_pruning_date FROM data_retention_config WHERE id = 1
    `).get();
    
    return result ? result.last_pruning_date : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if pruning should run (run monthly)
 */
function shouldRunPruning(currentDate) {
  const lastPruning = getLastPruningTime();
  
  if (!lastPruning) {
    return true; // Never run before
  }
  
  const lastPruningDate = new Date(lastPruning);
  const daysSinceLastPruning = (currentDate - lastPruningDate) / (1000 * 60 * 60 * 24);
  
  // Run pruning once per month (30 days)
  return daysSinceLastPruning >= 30;
}

module.exports = {
  DEFAULT_RETENTION_PERIODS,
  getRetentionConfig,
  saveRetentionConfig,
  pruneOldData,
  getPruningStats,
  getLastPruningTime,
  shouldRunPruning,
  
  // Export individual pruning functions for testing
  pruneTransactions,
  pruneEmails,
  pruneDividends,
  pruneTaxes,
  pruneFees,
  pruneLoanHistory,
  pruneCorporateEvents,
  pruneRebalancingEvents,
  pruneMarketCrashEvents,
  pruneStockSplits,
  prunePendingOrders,
  pruneCompanyFinancials,
  pruneIndexFundConstituents
};
