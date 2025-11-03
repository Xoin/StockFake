# Game State Management

## Overview

The game state system manages the simulation's time progression, market hours, and game state persistence. It provides the foundation for all time-based mechanics including trading hours, dividend payments, interest accrual, and historical event timing.

## Core Concepts

### Game Time

StockFake uses **accelerated time** to let players experience decades of market history in hours or minutes:

- **Start Date**: January 1, 1970 at 9:30 AM EST
- **Progression**: Configurable time multiplier (1s real = Xs game time)
- **Persistence**: Game time is saved to database every 5 seconds

### Time Multipliers

Three speed settings control how fast game time progresses:

| Speed | Multiplier | Real Time → Game Time |
|-------|------------|----------------------|
| Slow | 60 | 1 second = 1 minute |
| Normal | 3,600 | 1 second = 1 hour |
| Fast | 86,400 | 1 second = 1 day |

**Examples:**
- **Slow (60x)**: 1 real minute = 1 game hour
- **Normal (3600x)**: 1 real minute = 2.5 game days
- **Fast (86400x)**: 1 real minute = 60 game days (2 months)

### Market Hours

StockFake simulates NYSE trading hours:

- **Open**: 9:30 AM EST, Monday-Friday
- **Close**: 4:00 PM EST, Monday-Friday
- **Closed**: Weekends and outside trading hours

Trading actions (buy, sell, short, cover) are only allowed during market hours.

## Module API

### Initialization

```javascript
const gameState = require('./helpers/gameState');
gameState.startTimeSimulation();
```

Starts the time progression loop and automatic state saving.

### Time Access

```javascript
// Get current game time
const currentTime = gameState.getGameTime();
// Returns: Date object

// Set game time (for testing or time travel)
gameState.setGameTime(new Date('1987-10-19'));
```

### Pause Control

```javascript
// Check if paused
const paused = gameState.getIsPaused();
// Returns: boolean

// Pause/unpause the game
gameState.setIsPaused(true);  // Pause
gameState.setIsPaused(false); // Resume
```

When paused, game time stops advancing but the game remains responsive.

### Speed Control

```javascript
// Get current multiplier
const speed = gameState.getTimeMultiplier();
// Returns: 60, 3600, or 86400

// Set new multiplier
gameState.setTimeMultiplier(86400); // Fast mode
```

### Market Hours Check

```javascript
// Check if market is currently open
const isOpen = gameState.isMarketOpen(gameState.getGameTime());
// Returns: boolean

// Example usage in trading
if (!gameState.isMarketOpen(gameState.getGameTime())) {
  return { success: false, error: 'Market is closed' };
}
```

### Dividend Tracking

```javascript
// Get last processed dividend quarter
const lastQuarter = gameState.getLastDividendQuarter();
// Returns: "1970-Q1", "1970-Q2", etc. or null

// Update after processing dividends
gameState.setLastDividendQuarter('1970-Q2');
```

Dividends are paid quarterly (Q1-Q4). The system tracks which quarter was last processed to avoid duplicate payments.

### Fee Tracking

```javascript
// Get last monthly fee check
const lastCheck = gameState.getLastMonthlyFeeCheck();
// Returns: "1970-01", "1970-02", etc. or null

// Update after charging monthly fees
gameState.setLastMonthlyFeeCheck('1970-01');
```

Monthly account maintenance fees are tracked to charge exactly once per month.

### Inflation Tracking

```javascript
// Get last inflation check date
const lastInflation = gameState.getLastInflationCheck();
// Returns: ISO date string or null

// Update after processing inflation
gameState.setLastInflationCheck(gameState.getGameTime().toISOString());

// Get cumulative inflation multiplier
const inflation = gameState.getCumulativeInflation();
// Returns: 1.0 (1970) to ~7.5 (2024)

// Set cumulative inflation
gameState.setCumulativeInflation(7.5);
```

CPI-based inflation is tracked to show real purchasing power changes over time.

## Implementation Details

### State Persistence

Game state is persisted to the `game_state` table in SQLite:

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

This is a **singleton table** (always id = 1) containing exactly one row.

### Time Loop

Time advances every second when not paused:

```javascript
setInterval(() => {
  if (!isPaused) {
    gameTime = new Date(gameTime.getTime() + (timeMultiplier * 1000));
  }
}, 1000);
```

### Auto-Save

Game state is automatically saved every 5 seconds:

```javascript
setInterval(saveGameState, 5000);
```

This ensures minimal data loss if the server crashes.

### Market Hours Algorithm

```javascript
function isMarketOpen(date) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Closed on weekends
  if (day === 0 || day === 6) return false;
  
  // Check if between 9:30 AM and 4:00 PM
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const openMinutes = 9 * 60 + 30;  // 570 minutes
  const closeMinutes = 16 * 60;      // 960 minutes
  
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
```

## Usage Examples

### Example 1: Time-Based Event Processing

```javascript
const { getGameTime, getLastDividendQuarter, setLastDividendQuarter } = require('./helpers/gameState');

function processDividends() {
  const currentTime = getGameTime();
  const quarter = getQuarter(currentTime);
  
  if (quarter !== getLastDividendQuarter()) {
    // Pay dividends for the new quarter
    payDividends(quarter);
    setLastDividendQuarter(quarter);
  }
}
```

### Example 2: Trading Validation

```javascript
app.post('/api/trade', (req, res) => {
  const currentTime = gameState.getGameTime();
  
  if (!gameState.isMarketOpen(currentTime)) {
    return res.status(400).json({
      success: false,
      error: 'Market is closed. Trading hours are 9:30 AM - 4:00 PM EST, Monday-Friday'
    });
  }
  
  // Process trade...
});
```

### Example 3: Speed Control UI

```javascript
app.post('/api/time/speed', (req, res) => {
  const { multiplier } = req.body;
  
  // Validate multiplier
  if (![60, 3600, 86400].includes(multiplier)) {
    return res.status(400).json({ error: 'Invalid multiplier' });
  }
  
  gameState.setTimeMultiplier(multiplier);
  
  res.json({
    success: true,
    multiplier: multiplier,
    label: multiplier === 60 ? 'Slow' : multiplier === 3600 ? 'Normal' : 'Fast'
  });
});
```

### Example 4: Save Game on Shutdown

```javascript
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  gameState.saveGameState();
  db.close();
  process.exit(0);
});
```

## Integration with Other Systems

### Dividend System
Checks `last_dividend_quarter` to determine when to pay dividends.

### Fee System
Uses `last_monthly_fee_check` to charge account maintenance fees monthly.

### Interest Accrual
Loans and margin accounts check game time to calculate daily interest.

### Trading System
Validates market hours before executing trades.

### Historical Events
News, trade halts, and corporate events trigger based on game time.

### Economic Indicators
Fed rates, GDP, and unemployment data sync to game time.

## Time Travel and Testing

For testing purposes, you can manually set game time:

```javascript
// Jump to Black Monday
gameState.setGameTime(new Date('1987-10-19T09:30:00'));

// Jump to 2008 crisis
gameState.setGameTime(new Date('2008-09-15T09:30:00'));

// Jump to COVID crash
gameState.setGameTime(new Date('2020-03-16T09:30:00'));
```

**Note**: Time travel doesn't retroactively process events. Set time before starting the simulation to experience historical events.

## Performance Considerations

- **State Updates**: Minimal overhead (single in-memory variable updates)
- **Database Saves**: Only every 5 seconds, not on every tick
- **Market Hours Check**: O(1) calculation, very fast
- **Memory Usage**: ~1 KB for entire game state

## Best Practices

1. **Always check market hours** before trade execution
2. **Use getter functions** rather than accessing variables directly
3. **Save state explicitly** before critical operations
4. **Pause the game** during database maintenance
5. **Validate time multipliers** from user input

## Troubleshooting

### Time not advancing
- Check if game is paused: `getIsPaused()`
- Verify `startTimeSimulation()` was called

### State not persisting
- Check database connection
- Verify `saveGameState()` runs without errors
- Check disk space and database file permissions

### Market always closed
- Verify game time is during weekday hours
- Check time zone (NYSE uses EST/EDT)
- Ensure date is not a weekend

## See Also

- [DATABASE.md](DATABASE.md) - Database schema and persistence
- [USER_ACCOUNT.md](USER_ACCOUNT.md) - Account management
- [TESTING.md](TESTING.md) - Time-based testing strategies
