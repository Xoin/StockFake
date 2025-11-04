# Centralized Pause Handler Documentation

## Overview

The centralized pause handler (`helpers/pauseHandler.js`) provides a single source of truth for game pause state management in StockFake. This module ensures that all game state processing functions consistently check pause status before executing.

## Purpose

- **Prevent unintended state changes**: Trades, ticks, and other game state updates do not occur while the game is paused
- **Consistency**: All game state processing routes through a single pause check, eliminating duplicate pause logic
- **Maintainability**: Future developers only need to check/modify pause logic in one place

## API Reference

### `shouldProcessGameState()`

Returns whether game state processing should occur.

**Returns:** `boolean` - `true` if game state should be processed, `false` if paused

**Example:**
```javascript
const pauseHandler = require('./helpers/pauseHandler');

function checkDividends() {
  if (!pauseHandler.shouldProcessGameState()) {
    return; // Exit early if paused
  }
  // Process dividends...
}
```

### `getIsPaused()`

Get the current pause state.

**Returns:** `boolean` - `true` if game is paused, `false` if running

### `setIsPaused(paused)`

Set the pause state.

**Parameters:**
- `paused` (boolean): `true` to pause, `false` to unpause

**Example:**
```javascript
pauseHandler.setIsPaused(true);  // Pause the game
pauseHandler.setIsPaused(false); // Unpause the game
```

### `executeIfNotPaused(fn, thisArg)`

Execute a function only if the game is not paused.

**Parameters:**
- `fn` (Function): Function to execute if game is not paused
- `thisArg` (optional): `this` context for the function

**Returns:** Return value of `fn` if executed, `undefined` if paused

**Example:**
```javascript
const result = pauseHandler.executeIfNotPaused(() => {
  return calculateMarketValue();
});
```

### `wrapWithPauseCheck(fn)`

Wrap a function to only execute when game is not paused.

**Parameters:**
- `fn` (Function): Function to wrap

**Returns:** Function that checks pause state before executing

**Example:**
```javascript
const processOrders = pauseHandler.wrapWithPauseCheck((orders) => {
  // Process orders logic
});

// Call it - will only execute if not paused
processOrders(pendingOrders);
```

## Implementation in server.js

All game state processing functions in `server.js` have been updated to check the centralized pause handler:

### Functions Updated

1. **checkAndPayDividends()** - Quarterly dividend payments
2. **checkIndexFundRebalancing()** - Index fund rebalancing
3. **checkStockSplits()** - Stock split processing
4. **checkCorporateEvents()** - Mergers, bankruptcies, IPOs
5. **checkAndChargeMonthlyFee()** - Monthly account fees
6. **trackInflation()** - Annual inflation tracking
7. **assessWealthTax()** - Annual wealth tax
8. **updateShortPositions()** - Short position borrowing fees
9. **checkBondInterestPayments()** - Bond interest payments
10. **checkBondMaturities()** - Bond maturity processing
11. **processMarginInterest()** - Margin account interest
12. **processMarginCalls()** - Margin call checking
13. **processLoans()** - Loan interest and payments
14. **processNegativeBalance()** - Negative balance penalties
15. **Market crash updates** - Crash simulation and dynamic events

### Pattern Used

```javascript
function gameStateProcessor() {
  // Only process if game is not paused
  if (!pauseHandler.shouldProcessGameState()) {
    return;
  }
  
  // Process game state...
}
```

## Synchronization with server.js

The pause handler is synchronized with the server's `isPaused` variable:

```javascript
// At server startup
const pauseHandler = require('./helpers/pauseHandler');
pauseHandler.setIsPaused(isPaused);

// When pause state changes
app.post('/api/time/pause', (req, res) => {
  isPaused = !isPaused;
  pauseHandler.setIsPaused(isPaused); // Update centralized handler
  saveGameState();
  res.json({ isPaused });
});
```

## Volatility Independence from Game Speed

**Important Note:** The issue description mentioned removing volatility dependence on game speed. After code analysis, volatility calculations in `data/stocks.js` are already **independent of game speed** (`timeMultiplier`).

### How Volatility Works

- Volatility is calculated per day using a seeded random function
- Each day gets its own deterministic volatility value (±1.5%)
- The volatility does NOT scale with `timeMultiplier`
- Fast-forwarding time simply skips to future days, each with its own pre-calculated volatility

### Example from stocks.js (lines 381-382):

```javascript
const randomValue = seededRandom(symbol, Math.floor(currentTime.getTime() / (1000 * 60 * 60 * 24)));
const volatility = (randomValue - 0.5) * 0.03; // ±1.5% - NOT affected by timeMultiplier
```

The volatility is based on the day number, not the game speed. This means:
- At 1 second = 1 hour: You see hourly volatility
- At 1 second = 1 day: You see daily volatility  
- At 1 second = 1 month: You skip days and see monthly-aggregated results

The underlying volatility per day remains constant regardless of speed.

## Testing

Run pause handler tests:

```bash
node tests/unit/pause-handler.test.js
```

All tests should pass, verifying:
- Initial paused state
- shouldProcessGameState behavior
- Pause state toggling
- executeIfNotPaused functionality
- wrapWithPauseCheck functionality
- Type coercion

## Future Enhancements

Consider these improvements:

1. **Pause Events**: Emit events when pause state changes
2. **Pause Reasons**: Track why game was paused (user action, market halt, etc.)
3. **Conditional Processing**: Allow certain critical functions to run even when paused
4. **Pause Statistics**: Track how long game has been paused

## Conclusion

The centralized pause handler provides a robust, maintainable solution for managing pause state across the entire StockFake application. By routing all pause checks through a single module, we ensure consistent behavior and simplify future development.
