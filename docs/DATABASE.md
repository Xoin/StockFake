# Database Architecture

## Overview

StockFake uses SQLite as its database engine with the better-sqlite3 Node.js library. The database stores all game state, user account information, portfolio holdings, transactions, and historical records. SQLite was chosen for its simplicity, portability, and zero-configuration setup.

## Database File

- **Location**: `stockfake.db` in the project root directory
- **Engine**: SQLite 3
- **Mode**: Write-Ahead Logging (WAL) for better concurrency
- **Library**: better-sqlite3 (synchronous API)

## Schema Overview

The database consists of 25+ tables organized into logical groups:

### Core Game State
- `game_state` - Game time, pause state, multipliers
- `user_account` - Cash balance, credit score

### Portfolio Management
- `portfolio` - Stock holdings
- `index_fund_holdings` - Index fund shares
- `short_positions` - Short sale positions
- `purchase_history` - Cost basis tracking for taxes
- `shareholder_influence` - Voting power tracking

### Margin Trading
- `margin_account` - Margin balance and status
- `margin_calls` - Active margin call tracking

### Financial Tracking
- `transactions` - Complete trading history
- `dividends` - Dividend payments
- `taxes` - Tax payment records
- `fees` - All fees charged
- `loans` - Active and historical loans
- `loan_history` - Loan activities and payments

### Market Data
- `last_trade_time` - Trading cooldown enforcement
- `risk_controls` - Position limits and leverage controls

### Index Fund System
- `index_fund_constituents` - Historical constituent weights
- `index_fund_rebalancing_events` - Rebalancing history
- `index_fund_rebalancing_config` - Per-fund strategies

### Market Events
- `market_crash_events` - Active and historical crashes
- `market_state` - Current market conditions (volatility, liquidity, sentiment)
- `corporate_events` - Mergers, bankruptcies, IPOs
- `company_status` - Company availability tracking
- `company_financials` - Dynamic financial data

## Table Details

### game_state

Stores the current state of the game simulation.

```sql
CREATE TABLE game_state (
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
```

**Fields:**
- `id`: Always 1 (singleton table)
- `game_time`: Current in-game datetime (ISO 8601 format)
- `is_paused`: 0 = running, 1 = paused
- `time_multiplier`: Seconds of game time per real second (60, 3600, or 86400)
- `last_dividend_quarter`: Last processed dividend quarter (YYYY-QX)
- `last_monthly_fee_check`: Last month fees were charged
- `last_inflation_check`: Last CPI inflation check date
- `cumulative_inflation`: Cumulative CPI multiplier since 1970

### user_account

Player's financial account information.

```sql
CREATE TABLE user_account (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cash REAL NOT NULL DEFAULT 10000,
  credit_score INTEGER NOT NULL DEFAULT 750,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**
- `id`: Always 1 (singleton table)
- `cash`: Current cash balance (can be negative)
- `credit_score`: Credit rating (300-850 range)

### portfolio

Stock holdings by symbol.

```sql
CREATE TABLE portfolio (
  symbol TEXT PRIMARY KEY,
  shares INTEGER NOT NULL DEFAULT 0
)
```

**Usage:**
- One row per owned stock symbol
- Shares automatically removed when balance reaches 0
- Updated on buy/sell trades

### index_fund_holdings

Index fund share ownership.

```sql
CREATE TABLE index_fund_holdings (
  symbol TEXT PRIMARY KEY,
  shares REAL NOT NULL DEFAULT 0
)
```

**Note:** Shares can be fractional for index funds.

### short_positions

Active short sale positions.

```sql
CREATE TABLE short_positions (
  symbol TEXT PRIMARY KEY,
  shares INTEGER NOT NULL DEFAULT 0,
  borrow_price REAL NOT NULL,
  borrow_date TEXT NOT NULL,
  last_fee_date TEXT
)
```

**Fields:**
- `borrow_price`: Price when shares were borrowed
- `borrow_date`: Date position was opened
- `last_fee_date`: Last borrow fee charge date

### purchase_history

Cost basis tracking for tax calculations (FIFO method).

```sql
CREATE TABLE purchase_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  date TEXT NOT NULL,
  shares INTEGER NOT NULL,
  price_per_share REAL NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'stock'
)
```

**Usage:**
- Each purchase creates a new record
- Oldest purchases (lowest id) are sold first (FIFO)
- Deleted as shares are sold
- `asset_type`: 'stock' or 'index_fund'

### transactions

Complete audit trail of all financial activities.

```sql
CREATE TABLE transactions (
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
```

**Transaction Types:**
- `buy`, `sell` - Stock trades
- `short`, `cover` - Short selling
- `index_buy`, `index_sell` - Index fund trades
- `dividend` - Dividend payment
- `loan_taken`, `loan_payment` - Loan activities
- `margin_interest` - Margin interest charges
- `fee` - Various fees

### dividends

Quarterly dividend payment records.

```sql
CREATE TABLE dividends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  quarter TEXT NOT NULL,
  gross_amount REAL NOT NULL,
  tax REAL NOT NULL,
  net_amount REAL NOT NULL,
  details TEXT
)
```

**Fields:**
- `quarter`: Format "YYYY-Q1" through "YYYY-Q4"
- `details`: JSON object with per-stock breakdown

### loans

Active and historical loan records.

```sql
CREATE TABLE loans (
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
  status TEXT NOT NULL DEFAULT 'active'
)
```

**Status Values:**
- `active` - Currently active loan
- `paid_off` - Successfully repaid
- `defaulted` - Failed to repay

### margin_account

Margin trading account status.

```sql
CREATE TABLE margin_account (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  margin_balance REAL NOT NULL DEFAULT 0,
  interest_rate REAL NOT NULL DEFAULT 0.08,
  last_interest_date TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 0
)
```

**Fields:**
- `margin_balance`: Current margin debt
- `interest_rate`: Annual rate (typically 8%)
- `is_enabled`: 0 = disabled, 1 = enabled

### margin_calls

Active margin call tracking.

```sql
CREATE TABLE margin_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_issued TEXT NOT NULL,
  amount_needed REAL NOT NULL,
  deadline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
)
```

**Status Values:**
- `active` - Needs to be met
- `met` - Successfully resolved
- `liquidated` - Forced liquidation occurred

### index_fund_constituents

Historical record of index fund constituent weights.

```sql
CREATE TABLE index_fund_constituents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fund_symbol TEXT NOT NULL,
  stock_symbol TEXT NOT NULL,
  weight REAL NOT NULL,
  market_cap REAL,
  date TEXT NOT NULL
)
```

**Usage:**
- Tracks constituent weights over time
- Used for historical performance calculation
- Updated during rebalancing events

### index_fund_rebalancing_events

Complete history of index fund rebalancing.

```sql
CREATE TABLE index_fund_rebalancing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fund_symbol TEXT NOT NULL,
  date TEXT NOT NULL,
  reason TEXT NOT NULL,
  changes_count INTEGER NOT NULL,
  details TEXT
)
```

**Reason Values:**
- `periodic` - Scheduled rebalancing
- `threshold` - Drift threshold triggered
- `manual` - API-triggered rebalancing

### market_crash_events

Active and historical market crash events.

```sql
CREATE TABLE market_crash_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  magnitude REAL NOT NULL,
  event_type TEXT NOT NULL,
  config TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
)
```

**Fields:**
- `config`: JSON with full event configuration
- `is_active`: 0 = completed, 1 = ongoing

### corporate_events

Historical and scheduled corporate actions.

```sql
CREATE TABLE corporate_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  event_type TEXT NOT NULL,
  date TEXT NOT NULL,
  details TEXT,
  processed INTEGER NOT NULL DEFAULT 0
)
```

**Event Types:**
- `bankruptcy` - Company goes bankrupt
- `merger` - Acquired by another company
- `going_private` - Delisting from public markets
- `ipo` - Initial public offering

### company_status

Tracks company availability and status.

```sql
CREATE TABLE company_status (
  symbol TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  status_date TEXT,
  details TEXT
)
```

**Status Values:**
- `active` - Available for trading
- `bankrupt` - No longer tradeable
- `acquired` - Merged into another company
- `private` - No longer publicly traded

## Database Operations

### Initialization

```javascript
const { initializeDatabase } = require('./database');
initializeDatabase();
```

Creates all tables if they don't exist. Safe to call multiple times.

### Common Queries

**Get game time:**
```javascript
const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
```

**Update cash balance:**
```javascript
db.prepare('UPDATE user_account SET cash = ? WHERE id = 1').run(newBalance);
```

**Add transaction:**
```javascript
db.prepare(`
  INSERT INTO transactions (date, type, symbol, shares, price_per_share, total)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(date, type, symbol, shares, price, total);
```

**Get portfolio:**
```javascript
const portfolio = db.prepare('SELECT * FROM portfolio WHERE shares > 0').all();
```

## Transactions and ACID

SQLite provides full ACID compliance:

```javascript
const transaction = db.transaction((symbol, shares, price) => {
  // Multiple operations execute atomically
  db.prepare('UPDATE user_account SET cash = cash - ? WHERE id = 1').run(cost);
  db.prepare('INSERT OR REPLACE INTO portfolio (symbol, shares) VALUES (?, ?)').run(symbol, newShares);
  db.prepare('INSERT INTO transactions (...) VALUES (...)').run(...);
});

transaction(symbol, shares, price);
```

## Backup and Recovery

**Manual Backup:**
```bash
sqlite3 stockfake.db ".backup stockfake-backup.db"
```

**Restore:**
```bash
cp stockfake-backup.db stockfake.db
```

## Performance Considerations

- **Indexes**: Created on frequently queried columns (symbol, date)
- **WAL Mode**: Enables concurrent reads during writes
- **Prepared Statements**: All queries use prepared statements for performance and security
- **Transactions**: Batch operations are wrapped in transactions for speed

## Database File Size

Typical database sizes:
- New game: ~100 KB
- After 1 year (game time): ~500 KB
- After 10 years: ~2-5 MB
- After 50+ years: ~10-20 MB

The database grows primarily with transaction and dividend records.

## Schema Migrations

Schema changes are handled through version checks and ALTER TABLE statements. The `initializeDatabase()` function is idempotent and safe to run on existing databases.

## See Also

- [GAME_STATE.md](GAME_STATE.md) - Game state management
- [USER_ACCOUNT.md](USER_ACCOUNT.md) - Account operations
- [INDEX_FUNDS.md](INDEX_FUNDS.md) - Index fund system
- [CRASH_SIMULATION.md](CRASH_SIMULATION.md) - Market crash system
