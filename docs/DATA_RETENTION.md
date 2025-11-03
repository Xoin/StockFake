# Data Retention and Purging

## Overview

The StockFake application includes an automatic data retention and purging system to optimize memory and storage usage over time. As the game progresses through decades of historical market data, various database tables accumulate historical records that can be safely pruned while preserving business-critical data.

## Features

### Automatic Data Pruning

The system automatically removes old historical data based on configurable retention periods:

- **Transactions**: 5 years (default)
- **Emails**: 2 years (default, unread emails are always preserved)
- **Dividends**: 5 years (default)
- **Taxes**: 7 years (default, matching IRS requirements)
- **Fees**: 5 years (default)
- **Loan History**: 7 years (default)
- **Corporate Events**: 10 years (default, only applied events)
- **Index Fund Rebalancing Events**: 3 years (default)
- **Market Crash Events**: 10 years (default, inactive events only)
- **Stock Splits**: 10 years (default)
- **Pending Orders**: 30 days (default, completed/cancelled orders only)
- **Company Financials**: 10 years (default)

### Protected Data

The following data is **never** pruned to ensure game integrity:

- Current portfolio holdings
- Active loans
- Game state and configuration
- User account information
- Active margin positions
- Active pending orders
- Critical transaction types (e.g., initial_balance, game_reset)
- Unread emails
- Pending corporate events
- Active market crash events

### Automatic Execution

Data pruning runs automatically:
- **Check Frequency**: Every 5 minutes (real-time)
- **Execution Frequency**: Once per month (game-time)
- **Can be disabled**: Set `auto_pruning_enabled` to false in configuration

## Configuration

### Default Configuration

```javascript
{
  transactions: 365 * 5,      // 5 years
  emails: 365 * 2,            // 2 years
  dividends: 365 * 5,         // 5 years
  taxes: 365 * 7,             // 7 years (IRS requirement)
  fees: 365 * 5,              // 5 years
  loanHistory: 365 * 7,       // 7 years
  corporateEvents: 365 * 10,  // 10 years
  rebalancingEvents: 365 * 3, // 3 years
  marketCrashEvents: 365 * 10,// 10 years
  stockSplits: 365 * 10,      // 10 years
  pendingOrders: 30,          // 30 days
  companyFinancials: 365 * 10 // 10 years
}
```

### Modifying Retention Periods

You can customize retention periods via the API:

```javascript
// Get current configuration
GET /api/retention/config

// Update configuration
POST /api/retention/config
{
  "retentionPeriods": {
    "transactions": 1095,  // 3 years instead of 5
    "emails": 365,         // 1 year instead of 2
    // ... other periods
  },
  "autoPruningEnabled": true
}
```

## API Endpoints

### Get Retention Configuration

```
GET /api/retention/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "transactions": 1825,
    "emails": 730,
    ...
  },
  "lastPruningDate": "2020-01-01T00:00:00.000Z",
  "autoPruningEnabled": true
}
```

### Update Retention Configuration

```
POST /api/retention/config
```

**Request Body:**
```json
{
  "retentionPeriods": {
    "transactions": 1095,
    "emails": 365
  },
  "autoPruningEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Retention configuration updated",
  "config": { ... }
}
```

### Get Pruning Statistics

```
GET /api/retention/stats
```

Shows how many records are eligible for pruning in each table.

**Response:**
```json
{
  "success": true,
  "currentGameTime": "2020-01-01T00:00:00.000Z",
  "stats": {
    "transactions": {
      "total": 1826,
      "pruneable": 730,
      "retentionDays": 1825,
      "cutoffDate": "2015-01-02T00:00:00.000Z"
    },
    ...
  }
}
```

### Manually Trigger Pruning

```
POST /api/retention/prune
```

Immediately runs the pruning operation (regardless of schedule).

**Response:**
```json
{
  "success": true,
  "message": "Data pruning completed",
  "results": {
    "timestamp": "2020-01-01T00:00:00.000Z",
    "config": { ... },
    "pruned": {
      "transactions": 730,
      "emails": 0,
      ...
    }
  }
}
```

## Database Schema

### data_retention_config Table

```sql
CREATE TABLE data_retention_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  retention_periods TEXT NOT NULL DEFAULT '{}',
  last_pruning_date TEXT,
  auto_pruning_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Module Functions

### Core Functions

- `getRetentionConfig()` - Get current retention configuration
- `saveRetentionConfig(config)` - Save retention configuration
- `pruneOldData(currentDate)` - Execute full pruning operation
- `getPruningStats(currentDate)` - Get statistics on pruneable data
- `shouldRunPruning(currentDate)` - Check if pruning should run
- `getLastPruningTime()` - Get timestamp of last pruning

### Individual Pruning Functions

Each data type has its own pruning function:
- `pruneTransactions(currentDate, retentionDays)`
- `pruneEmails(currentDate, retentionDays)`
- `pruneDividends(currentDate, retentionDays)`
- `pruneTaxes(currentDate, retentionDays)`
- `pruneFees(currentDate, retentionDays)`
- `pruneLoanHistory(currentDate, retentionDays)`
- `pruneCorporateEvents(currentDate, retentionDays)`
- `pruneRebalancingEvents(currentDate, retentionDays)`
- `pruneMarketCrashEvents(currentDate, retentionDays)`
- `pruneStockSplits(currentDate, retentionDays)`
- `prunePendingOrders(currentDate, retentionDays)`
- `pruneCompanyFinancials(currentDate, retentionDays)`
- `pruneIndexFundConstituents(currentDate, retentionDays)`

## Testing

Comprehensive unit tests are available in `tests/unit/data-retention.test.js`:

```bash
node tests/unit/data-retention.test.js
```

Tests cover:
- Configuration management
- Transaction pruning
- Email pruning (with unread preservation)
- Dividend pruning
- Pruning statistics
- Full pruning operation
- Pruning schedule
- Data integrity (business-critical data preservation)

## Performance Considerations

### Memory Impact

- Pruning reduces database size by removing old records
- Typical reduction: 20-50% after several years of game time
- Memory usage stabilizes after initial pruning cycles

### Storage Impact

- SQLite database file size decreases
- Use `VACUUM` command periodically to reclaim disk space:
  ```javascript
  db.pragma('vacuum');
  ```

### Query Performance

- Fewer records in tables improves query performance
- Indices remain efficient with smaller datasets
- Transaction history queries are faster

## Best Practices

1. **Monitor Pruning**: Check logs for pruning operations
2. **Adjust Retention**: Modify periods based on your needs
3. **Manual Pruning**: Run manual pruning during off-peak times if needed
4. **Backup First**: Always backup database before major configuration changes
5. **Test Changes**: Test retention period changes in development first

## Example Usage

### Programmatic Usage

```javascript
const dataRetention = require('./helpers/dataRetention');

// Check if pruning should run
if (dataRetention.shouldRunPruning(new Date())) {
  // Run pruning
  const results = dataRetention.pruneOldData(new Date());
  console.log('Pruned records:', results.pruned);
}

// Get statistics
const stats = dataRetention.getPruningStats(new Date());
console.log('Pruneable records:', stats);

// Update configuration
const newConfig = {
  transactions: 365 * 3,  // 3 years
  emails: 365 * 1         // 1 year
};
dataRetention.saveRetentionConfig(newConfig);
```

### Disable Auto-Pruning

```javascript
// Via API
POST /api/retention/config
{
  "autoPruningEnabled": false
}

// Via Database
UPDATE data_retention_config 
SET auto_pruning_enabled = 0 
WHERE id = 1;
```

## Troubleshooting

### Pruning Not Running

1. Check `auto_pruning_enabled` flag
2. Verify last pruning date is > 30 days ago (game time)
3. Check server logs for errors

### Too Much Data Pruned

1. Increase retention periods in configuration
2. Restore from backup if needed
3. Verify business-critical data types are excluded

### Not Enough Data Pruned

1. Decrease retention periods
2. Run manual pruning operation
3. Check if data falls within retention windows

## Security Considerations

- API endpoints should be protected in production
- Retention configuration changes should be logged
- Backup database before modifying retention periods
- Monitor for unauthorized pruning operations

## Future Enhancements

Potential improvements:
- Granular retention by symbol or category
- Compression of old data instead of deletion
- Export/archive functionality for old data
- Analytics on pruning operations
- UI for managing retention settings
