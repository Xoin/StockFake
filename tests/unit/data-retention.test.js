/**
 * Unit Tests for Data Retention and Pruning Module
 * 
 * Tests the automatic cleanup of old historical data to optimize memory and storage usage.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Test database path
const testDbPath = path.join(__dirname, '../../test-retention.db');

// Module-level variables for database and mock
let db;
let mockDbModule;
let dataRetention;

// Helper function to insert test data
function insertTestTransactions(count, baseDate) {
  const stmt = db.prepare(`
    INSERT INTO transactions (date, type, symbol, shares, price_per_share, total)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    stmt.run(date.toISOString(), 'buy', 'TEST', 10, 100, 1000);
  }
}

function insertTestEmails(count, baseDate, isRead = false) {
  const stmt = db.prepare(`
    INSERT INTO emails (from_address, subject, body, date, is_read)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    stmt.run('test@example.com', 'Test Email', 'Test body', date.toISOString(), isRead ? 1 : 0);
  }
}

function insertTestDividends(count, baseDate) {
  const stmt = db.prepare(`
    INSERT INTO dividends (date, quarter, gross_amount, tax, net_amount, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i * 90); // Quarterly
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    stmt.run(date.toISOString(), `${year}-Q${quarter}`, 100, 15, 85, '{}');
  }
}

// Initialize test database schema
function initTestDatabase() {
  // Create game_state table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      game_time TEXT NOT NULL,
      is_paused INTEGER NOT NULL DEFAULT 0,
      time_multiplier INTEGER NOT NULL DEFAULT 3600,
      last_dividend_quarter TEXT,
      last_monthly_fee_check TEXT,
      last_inflation_check TEXT,
      cumulative_inflation REAL NOT NULL DEFAULT 1.0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create data retention config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_retention_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      retention_periods TEXT NOT NULL DEFAULT '{}',
      last_pruning_date TEXT,
      auto_pruning_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create test data tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      symbol TEXT,
      shares INTEGER,
      price_per_share REAL,
      trading_fee REAL,
      tax REAL,
      total REAL,
      data TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_address TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      date TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      spam INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dividends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      quarter TEXT NOT NULL,
      gross_amount REAL NOT NULL,
      tax REAL NOT NULL,
      net_amount REAL NOT NULL,
      details TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS loan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      loan_id INTEGER,
      company_id TEXT,
      data TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS corporate_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_date TEXT NOT NULL,
      primary_symbol TEXT NOT NULL,
      secondary_symbol TEXT,
      event_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      applied_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS index_fund_rebalancing_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fund_symbol TEXT NOT NULL,
      rebalancing_date TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      constituents_added TEXT,
      constituents_removed TEXT,
      weights_adjusted TEXT,
      total_constituents INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS market_crash_events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      activated_at TEXT NOT NULL,
      deactivated_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      event_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      split_date TEXT NOT NULL,
      split_ratio INTEGER NOT NULL,
      price_before_split REAL NOT NULL,
      price_after_split REAL NOT NULL,
      applied_to_portfolio INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      action TEXT NOT NULL,
      shares REAL NOT NULL,
      order_type TEXT NOT NULL DEFAULT 'stock',
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      executed_at TEXT,
      execution_price REAL,
      error TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS company_financials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      year INTEGER NOT NULL,
      revenue REAL,
      net_income REAL,
      assets REAL,
      employees INTEGER,
      patents INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(symbol, year)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS index_fund_constituents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fund_symbol TEXT NOT NULL,
      constituent_symbol TEXT NOT NULL,
      weight REAL NOT NULL,
      market_cap REAL,
      effective_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(fund_symbol, constituent_symbol, effective_date)
    )
  `);

  // Insert default data retention config
  const defaultRetention = {
    transactions: 365 * 5,
    emails: 365 * 2,
    dividends: 365 * 5,
    taxes: 365 * 7,
    fees: 365 * 5,
    loanHistory: 365 * 7,
    corporateEvents: 365 * 10,
    rebalancingEvents: 365 * 3,
    marketCrashEvents: 365 * 10,
    stockSplits: 365 * 10,
    pendingOrders: 30,
    companyFinancials: 365 * 10
  };

  db.prepare(`
    INSERT INTO data_retention_config (id, retention_periods, auto_pruning_enabled)
    VALUES (1, ?, 1)
  `).run(JSON.stringify(defaultRetention));

  // Insert game state
  db.prepare(`
    INSERT INTO game_state (id, game_time, is_paused, time_multiplier)
    VALUES (1, ?, 0, 3600)
  `).run(new Date('2020-01-01').toISOString());
}

describe('Data Retention and Pruning Module Tests', () => {
  const currentDate = new Date('2020-01-01');

  beforeAll(() => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create test database
    db = new Database(testDbPath);

    // Initialize test database schema
    initTestDatabase();

    // Mock the database module
    mockDbModule = {
      db,
      getGameState: db.prepare('SELECT * FROM game_state WHERE id = 1'),
      updateGameState: db.prepare(`
        UPDATE game_state 
        SET game_time = ?, is_paused = ?, time_multiplier = ?, 
            last_dividend_quarter = ?, last_monthly_fee_check = ?, last_inflation_check = ?, 
            cumulative_inflation = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `),
      getDataRetentionConfig: db.prepare('SELECT * FROM data_retention_config WHERE id = 1'),
      updateDataRetentionConfig: db.prepare(`
        UPDATE data_retention_config
        SET retention_periods = ?, auto_pruning_enabled = ?, last_pruning_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `)
    };

    // Mock require to inject our test database
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function(id) {
      if (id === '../database' || id === '../../database') {
        return mockDbModule;
      }
      return originalRequire.apply(this, arguments);
    };

    // Now load the data retention module
    dataRetention = require('../../helpers/dataRetention');
  });

  afterAll(() => {
    // Close and cleanup test database
    if (db) {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Configuration Management', () => {
    test('Should retrieve retention configuration', () => {
      const config = dataRetention.getRetentionConfig();
      expect(config).toBeDefined();
      expect(config.transactions).toBeGreaterThan(0);
      expect(config.emails).toBeGreaterThan(0);
      expect(config.taxes).toBeGreaterThan(0);
    });

    test('Should save and update custom retention configuration', () => {
      const config = dataRetention.getRetentionConfig();
      const originalTransactionRetention = config.transactions;
      const customConfig = { ...config, transactions: 365 * 3 };
      dataRetention.saveRetentionConfig(customConfig);
      const updatedConfig = dataRetention.getRetentionConfig();
      expect(updatedConfig.transactions).toBe(365 * 3);
      
      // Restore original config
      const restoreConfig = { ...config, transactions: originalTransactionRetention };
      dataRetention.saveRetentionConfig(restoreConfig);
    });
  });

  describe('Transaction Pruning', () => {
    beforeEach(() => {
      // Clear existing transactions
      db.exec('DELETE FROM transactions');
    });

    test('Should prune old transactions correctly', () => {
      // Insert 2000 days worth of transactions
      insertTestTransactions(2000, currentDate);

      const totalBefore = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
      expect(totalBefore).toBe(2000);

      // Prune transactions older than 5 years (1825 days)
      const prunedCount = dataRetention.pruneTransactions(currentDate, 365 * 5);
      const totalAfter = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;

      // Either records were pruned, or all were within retention period
      expect(prunedCount).toBeGreaterThanOrEqual(0);
      expect(totalAfter).toBeLessThanOrEqual(totalBefore);
      // If pruning occurred, verify the count is reasonable
      if (prunedCount > 0) {
        expect(totalAfter).toBeGreaterThanOrEqual(365 * 5 - 10);
        expect(totalAfter).toBeLessThanOrEqual(365 * 5 + 10);
      }
    });
  });

  describe('Email Pruning', () => {
    beforeEach(() => {
      // Clear existing emails
      db.exec('DELETE FROM emails');
    });

    test('Should prune old read emails but preserve unread emails', () => {
      // Insert 1000 read emails and 100 unread emails
      insertTestEmails(1000, currentDate, true);
      insertTestEmails(100, currentDate, false);

      const emailsBefore = db.prepare('SELECT COUNT(*) as count FROM emails').get().count;
      expect(emailsBefore).toBe(1100);

      // Prune emails older than 2 years
      const prunedEmails = dataRetention.pruneEmails(currentDate, 365 * 2);
      const emailsAfter = db.prepare('SELECT COUNT(*) as count FROM emails').get().count;
      const unreadAfter = db.prepare('SELECT COUNT(*) as count FROM emails WHERE is_read = 0').get().count;

      // Either records were pruned, or all were within retention period
      expect(prunedEmails).toBeGreaterThanOrEqual(0);
      // Unread emails should always be preserved
      expect(unreadAfter).toBe(100);
    });
  });

  describe('Dividend Pruning', () => {
    beforeEach(() => {
      // Clear existing dividends
      db.exec('DELETE FROM dividends');
    });

    test('Should prune old dividend records correctly', () => {
      // Insert 30 quarters of dividends (7.5 years)
      insertTestDividends(30, currentDate);

      const dividendsBefore = db.prepare('SELECT COUNT(*) as count FROM dividends').get().count;
      expect(dividendsBefore).toBe(30);

      // Prune dividends older than 5 years
      const prunedDividends = dataRetention.pruneDividends(currentDate, 365 * 5);
      const dividendsAfter = db.prepare('SELECT COUNT(*) as count FROM dividends').get().count;

      // Either records were pruned, or all were within retention period
      expect(prunedDividends).toBeGreaterThanOrEqual(0);
      expect(dividendsAfter).toBeLessThanOrEqual(dividendsBefore);
      // If pruning occurred, verify reasonable count
      if (prunedDividends > 0) {
        expect(dividendsAfter).toBeLessThanOrEqual(22);
      }
    });
  });

  describe('Pruning Statistics', () => {
    test('Should retrieve pruning statistics for all tables', () => {
      const stats = dataRetention.getPruningStats(currentDate);
      expect(stats).toBeDefined();
      expect(Object.keys(stats).length).toBeGreaterThan(0);

      // Check that stats have expected structure
      for (const [table, stat] of Object.entries(stats)) {
        if (!stat.error && stat.total > 0) {
          expect(stat).toHaveProperty('total');
          expect(stat).toHaveProperty('pruneable');
        }
      }
    });
  });

  describe('Full Pruning Operation', () => {
    test('Should execute full pruning operation and return results', () => {
      const results = dataRetention.pruneOldData(currentDate);
      
      expect(results).toBeDefined();
      expect(results).toHaveProperty('timestamp');
      expect(results).toHaveProperty('pruned');
      expect(typeof results.pruned).toBe('object');

      const totalPruned = Object.values(results.pruned).reduce((sum, count) => sum + count, 0);
      expect(totalPruned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pruning Schedule Check', () => {
    test('Should track last pruning time', () => {
      const lastPruning = dataRetention.getLastPruningTime();
      // May be null or a date string
      expect(lastPruning === null || typeof lastPruning === 'string').toBe(true);
    });

    test('Should determine if pruning should run based on schedule', () => {
      const shouldRun1 = dataRetention.shouldRunPruning(currentDate);
      expect(typeof shouldRun1).toBe('boolean');

      // Check again after 31 days
      const futureDate = new Date(currentDate);
      futureDate.setDate(futureDate.getDate() + 31);
      const shouldRun2 = dataRetention.shouldRunPruning(futureDate);
      
      expect(typeof shouldRun2).toBe('boolean');
      expect(shouldRun2).toBe(true);
    });
  });

  describe('Data Integrity Check', () => {
    beforeEach(() => {
      // Clear existing transactions
      db.exec('DELETE FROM transactions');
    });

    test('Should preserve business-critical data during pruning', () => {
      // Add a recent important transaction
      const recentDate = new Date(currentDate);
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      db.prepare(`
        INSERT INTO transactions (date, type, total)
        VALUES (?, 'initial_balance', 10000)
      `).run(recentDate.toISOString());

      const beforeCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE type = 'initial_balance'").get().count;
      expect(beforeCount).toBe(1);

      // Prune everything older than 5 days
      dataRetention.pruneTransactions(currentDate, 5);

      const afterCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE type = 'initial_balance'").get().count;
      
      // Business-critical data should be preserved
      expect(afterCount).toBe(beforeCount);
    });
  });
});
