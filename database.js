const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'stockfake.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
function initializeDatabase() {
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

  // Create user_account table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_account (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      cash REAL NOT NULL DEFAULT 10000,
      credit_score INTEGER NOT NULL DEFAULT 750,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create portfolio table
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio (
      symbol TEXT PRIMARY KEY,
      shares INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create index_fund_holdings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS index_fund_holdings (
      symbol TEXT PRIMARY KEY,
      shares REAL NOT NULL DEFAULT 0
    )
  `);

  // Create short_positions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS short_positions (
      symbol TEXT PRIMARY KEY,
      shares INTEGER NOT NULL DEFAULT 0,
      borrow_price REAL NOT NULL,
      borrow_date TEXT NOT NULL,
      last_fee_date TEXT
    )
  `);

  // Create purchase_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      date TEXT NOT NULL,
      shares INTEGER NOT NULL,
      price_per_share REAL NOT NULL,
      asset_type TEXT NOT NULL DEFAULT 'stock'
    )
  `);

  // Create transactions table
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

  // Create dividends table
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

  // Create taxes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT
    )
  `);

  // Create fees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT
    )
  `);

  // Create shareholder_influence table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shareholder_influence (
      symbol TEXT PRIMARY KEY,
      shares INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create loans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY,
      company_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      principal REAL NOT NULL,
      balance REAL NOT NULL,
      interest_rate REAL NOT NULL,
      start_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      last_payment_date TEXT,
      last_interest_accrual TEXT,
      missed_payments INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      marked_as_missed INTEGER NOT NULL DEFAULT 0,
      term_days INTEGER NOT NULL
    )
  `);

  // Create loan_history table
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

  // Create margin_account table
  db.exec(`
    CREATE TABLE IF NOT EXISTS margin_account (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      margin_balance REAL NOT NULL DEFAULT 0,
      margin_interest_rate REAL NOT NULL DEFAULT 0.08,
      last_margin_interest_date TEXT,
      has_margin_enabled INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create margin_calls table
  db.exec(`
    CREATE TABLE IF NOT EXISTS margin_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      amount_needed REAL NOT NULL,
      current_ratio REAL NOT NULL,
      required_ratio REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      met_date TEXT,
      liquidation_date TEXT
    )
  `);

  // Create risk_controls table
  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_controls (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      max_leverage REAL NOT NULL DEFAULT 2.0,
      max_position_size REAL NOT NULL DEFAULT 0.30,
      maintenance_margin_ratio REAL NOT NULL DEFAULT 0.30,
      concentration_warning_threshold REAL NOT NULL DEFAULT 0.20
    )
  `);

  // Create last_trade_time table
  db.exec(`
    CREATE TABLE IF NOT EXISTS last_trade_time (
      symbol TEXT PRIMARY KEY,
      last_trade_time TEXT NOT NULL
    )
  `);

  // Create pending_orders table for orders placed when market is closed
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

  // Insert default game state if not exists
  const gameStateCount = db.prepare('SELECT COUNT(*) as count FROM game_state').get();
  if (gameStateCount.count === 0) {
    db.prepare(`
      INSERT INTO game_state (id, game_time, is_paused, time_multiplier)
      VALUES (1, ?, 0, 3600)
    `).run(new Date('1970-01-01T09:30:00').toISOString());
  }

  // Insert default user account if not exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM user_account').get();
  if (userCount.count === 0) {
    db.prepare(`
      INSERT INTO user_account (id, cash, credit_score)
      VALUES (1, 10000, 750)
    `).run();
  }

  // Insert default margin account if not exists
  const marginCount = db.prepare('SELECT COUNT(*) as count FROM margin_account').get();
  if (marginCount.count === 0) {
    db.prepare(`
      INSERT INTO margin_account (id, margin_balance, margin_interest_rate, has_margin_enabled)
      VALUES (1, 0, 0.08, 0)
    `).run();
  }

  // Insert default risk controls if not exists
  const riskCount = db.prepare('SELECT COUNT(*) as count FROM risk_controls').get();
  if (riskCount.count === 0) {
    db.prepare(`
      INSERT INTO risk_controls (id, max_leverage, max_position_size, maintenance_margin_ratio, concentration_warning_threshold)
      VALUES (1, 2.0, 0.30, 0.30, 0.20)
    `).run();
  }
}

// Initialize database tables on module load
initializeDatabase();

// Game state functions
const getGameState = db.prepare('SELECT * FROM game_state WHERE id = 1');
const updateGameState = db.prepare(`
  UPDATE game_state 
  SET game_time = ?, is_paused = ?, time_multiplier = ?, 
      last_dividend_quarter = ?, last_monthly_fee_check = ?, last_inflation_check = ?, 
      cumulative_inflation = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`);

// User account functions
const getUserAccount = db.prepare('SELECT * FROM user_account WHERE id = 1');
const updateUserAccount = db.prepare(`
  UPDATE user_account 
  SET cash = ?, credit_score = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`);

// Portfolio functions
const getPortfolio = db.prepare('SELECT * FROM portfolio');
const getPortfolioItem = db.prepare('SELECT * FROM portfolio WHERE symbol = ?');
const upsertPortfolio = db.prepare(`
  INSERT INTO portfolio (symbol, shares) VALUES (?, ?)
  ON CONFLICT(symbol) DO UPDATE SET shares = excluded.shares
`);
const deletePortfolio = db.prepare('DELETE FROM portfolio WHERE symbol = ?');

// Index fund holdings functions
const getIndexFundHoldings = db.prepare('SELECT * FROM index_fund_holdings');
const getIndexFundHolding = db.prepare('SELECT * FROM index_fund_holdings WHERE symbol = ?');
const upsertIndexFundHolding = db.prepare(`
  INSERT INTO index_fund_holdings (symbol, shares) VALUES (?, ?)
  ON CONFLICT(symbol) DO UPDATE SET shares = excluded.shares
`);
const deleteIndexFundHolding = db.prepare('DELETE FROM index_fund_holdings WHERE symbol = ?');

// Short positions functions
const getShortPositions = db.prepare('SELECT * FROM short_positions');
const getShortPosition = db.prepare('SELECT * FROM short_positions WHERE symbol = ?');
const upsertShortPosition = db.prepare(`
  INSERT INTO short_positions (symbol, shares, borrow_price, borrow_date, last_fee_date)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(symbol) DO UPDATE SET 
    shares = excluded.shares,
    borrow_price = excluded.borrow_price,
    borrow_date = excluded.borrow_date,
    last_fee_date = excluded.last_fee_date
`);
const deleteShortPosition = db.prepare('DELETE FROM short_positions WHERE symbol = ?');

// Purchase history functions
const getPurchaseHistory = db.prepare('SELECT * FROM purchase_history WHERE symbol = ? AND asset_type = ? ORDER BY date ASC');
const insertPurchaseHistory = db.prepare(`
  INSERT INTO purchase_history (symbol, date, shares, price_per_share, asset_type)
  VALUES (?, ?, ?, ?, ?)
`);
const deletePurchaseHistoryItem = db.prepare('DELETE FROM purchase_history WHERE id = ?');

// Transaction functions
const getTransactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC LIMIT ?');
const insertTransaction = db.prepare(`
  INSERT INTO transactions (date, type, symbol, shares, price_per_share, trading_fee, tax, total, data)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Dividend functions
const getDividends = db.prepare('SELECT * FROM dividends ORDER BY date DESC LIMIT ?');
const insertDividend = db.prepare(`
  INSERT INTO dividends (date, quarter, gross_amount, tax, net_amount, details)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Tax functions
const getTaxes = db.prepare('SELECT * FROM taxes ORDER BY date DESC LIMIT ?');
const getAllTaxes = db.prepare('SELECT * FROM taxes ORDER BY date DESC');
const insertTax = db.prepare(`
  INSERT INTO taxes (date, type, amount, description)
  VALUES (?, ?, ?, ?)
`);

// Fee functions
const getFees = db.prepare('SELECT * FROM fees ORDER BY date DESC LIMIT ?');
const insertFee = db.prepare(`
  INSERT INTO fees (date, type, amount, description)
  VALUES (?, ?, ?, ?)
`);

// Shareholder influence functions
const getShareholderInfluence = db.prepare('SELECT * FROM shareholder_influence');
const upsertShareholderInfluence = db.prepare(`
  INSERT INTO shareholder_influence (symbol, shares) VALUES (?, ?)
  ON CONFLICT(symbol) DO UPDATE SET shares = excluded.shares
`);
const deleteShareholderInfluence = db.prepare('DELETE FROM shareholder_influence WHERE symbol = ?');

// Loan functions
const getLoans = db.prepare('SELECT * FROM loans');
const getLoan = db.prepare('SELECT * FROM loans WHERE id = ?');
const insertLoan = db.prepare(`
  INSERT INTO loans (id, company_id, company_name, principal, balance, interest_rate, start_date, due_date, 
                     last_payment_date, last_interest_accrual, missed_payments, status, marked_as_missed, term_days)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateLoan = db.prepare(`
  UPDATE loans SET balance = ?, last_payment_date = ?, last_interest_accrual = ?, 
                   missed_payments = ?, status = ?, marked_as_missed = ?
  WHERE id = ?
`);

// Loan history functions
const getLoanHistory = db.prepare('SELECT * FROM loan_history ORDER BY date DESC LIMIT ?');
const insertLoanHistory = db.prepare(`
  INSERT INTO loan_history (date, type, loan_id, company_id, data)
  VALUES (?, ?, ?, ?, ?)
`);

// Margin account functions
const getMarginAccount = db.prepare('SELECT * FROM margin_account WHERE id = 1');
const updateMarginAccount = db.prepare(`
  UPDATE margin_account 
  SET margin_balance = ?, margin_interest_rate = ?, last_margin_interest_date = ?, has_margin_enabled = ?
  WHERE id = 1
`);

// Margin call functions
const getMarginCalls = db.prepare('SELECT * FROM margin_calls ORDER BY issue_date DESC LIMIT ?');
const insertMarginCall = db.prepare(`
  INSERT INTO margin_calls (issue_date, due_date, amount_needed, current_ratio, required_ratio, status, met_date, liquidation_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateMarginCall = db.prepare(`
  UPDATE margin_calls SET status = ?, met_date = ?, liquidation_date = ?
  WHERE id = ?
`);
const getActiveMarginCall = db.prepare(`SELECT * FROM margin_calls WHERE status = 'active' ORDER BY issue_date DESC LIMIT 1`);

// Risk controls functions
const getRiskControls = db.prepare('SELECT * FROM risk_controls WHERE id = 1');

// Last trade time functions
const getLastTradeTime = db.prepare('SELECT * FROM last_trade_time WHERE symbol = ?');
const upsertLastTradeTime = db.prepare(`
  INSERT INTO last_trade_time (symbol, last_trade_time) VALUES (?, ?)
  ON CONFLICT(symbol) DO UPDATE SET last_trade_time = excluded.last_trade_time
`);

// Pending orders functions
const getPendingOrders = db.prepare('SELECT * FROM pending_orders WHERE status = ? ORDER BY created_at ASC');
const getAllPendingOrders = db.prepare('SELECT * FROM pending_orders ORDER BY created_at DESC');
const getPendingOrder = db.prepare('SELECT * FROM pending_orders WHERE id = ?');
const insertPendingOrder = db.prepare(`
  INSERT INTO pending_orders (symbol, action, shares, order_type, created_at, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const updatePendingOrderStatus = db.prepare(`
  UPDATE pending_orders 
  SET status = ?, executed_at = ?, execution_price = ?, error = ?
  WHERE id = ?
`);
const deletePendingOrder = db.prepare('DELETE FROM pending_orders WHERE id = ?');

module.exports = {
  db,
  initializeDatabase,
  
  // Game state
  getGameState,
  updateGameState,
  
  // User account
  getUserAccount,
  updateUserAccount,
  
  // Portfolio
  getPortfolio,
  getPortfolioItem,
  upsertPortfolio,
  deletePortfolio,
  
  // Index fund holdings
  getIndexFundHoldings,
  getIndexFundHolding,
  upsertIndexFundHolding,
  deleteIndexFundHolding,
  
  // Short positions
  getShortPositions,
  getShortPosition,
  upsertShortPosition,
  deleteShortPosition,
  
  // Purchase history
  getPurchaseHistory,
  insertPurchaseHistory,
  deletePurchaseHistoryItem,
  
  // Transactions
  getTransactions,
  insertTransaction,
  
  // Dividends
  getDividends,
  insertDividend,
  
  // Taxes
  getTaxes,
  getAllTaxes,
  insertTax,
  
  // Fees
  getFees,
  insertFee,
  
  // Shareholder influence
  getShareholderInfluence,
  upsertShareholderInfluence,
  deleteShareholderInfluence,
  
  // Loans
  getLoans,
  getLoan,
  insertLoan,
  updateLoan,
  
  // Loan history
  getLoanHistory,
  insertLoanHistory,
  
  // Margin account
  getMarginAccount,
  updateMarginAccount,
  
  // Margin calls
  getMarginCalls,
  insertMarginCall,
  updateMarginCall,
  getActiveMarginCall,
  
  // Risk controls
  getRiskControls,
  
  // Last trade time
  getLastTradeTime,
  upsertLastTradeTime,
  
  // Pending orders
  getPendingOrders,
  getAllPendingOrders,
  getPendingOrder,
  insertPendingOrder,
  updatePendingOrderStatus,
  deletePendingOrder
};
