# Centralized Tick Handler Documentation

## Overview

The centralized tick handler (`helpers/tickHandler.js`) manages all game time advancement (ticking) logic in StockFake. This module provides a single source of truth for time progression, ensuring consistent behavior across the application.

## Purpose

- **Centralize time advancement**: All game time updates go through one module
- **Respect pause state**: Integrates with `pauseHandler` to prevent ticking when paused
- **Market transitions**: Handles market open/close events automatically
- **Pending orders**: Processes pending orders when market opens
- **Event hooks**: Provides callbacks for time-based events

## Architecture

The tick handler operates on a 1-second interval (configurable) and:
1. Checks if the game is paused (via `pauseHandler`)
2. If not paused, advances game time by `timeMultiplier` seconds
3. Handles fast-forwarding through closed market hours
4. Detects market open/close transitions
5. Triggers appropriate callbacks

## API Reference

### Initialization

#### `initialize(initialGameTime, initialTimeMultiplier, marketOpenChecker)`

Initialize the tick handler with game state.

**Parameters:**
- `initialGameTime` (Date): Starting game time
- `initialTimeMultiplier` (number): Seconds of game time per real second
- `marketOpenChecker` (Function): Function to check if market is open

**Example:**
```javascript
const tickHandler = require('./helpers/tickHandler');

tickHandler.initialize(
  new Date('1970-01-01T09:30:00'),
  3600, // 1 second = 1 hour
  isMarketOpen
);
```

### Time Management

#### `getGameTime()`

Get the current game time.

**Returns:** `Date` - Current game time

#### `setGameTime(newTime)`

Set game time (for debugging/testing).

**Parameters:**
- `newTime` (Date): New game time

#### `getTimeMultiplier()`

Get the current time multiplier.

**Returns:** `number` - Seconds of game time per real second

#### `setTimeMultiplier(multiplier)`

Set the time multiplier.

**Parameters:**
- `multiplier` (number): New time multiplier

### Event Callbacks

#### `setOnTimeAdvancedCallback(callback)`

Register callback for time advancement events.

**Parameters:**
- `callback` (Function): `(oldTime, newTime) => {}`

**Example:**
```javascript
tickHandler.setOnTimeAdvancedCallback((oldTime, newTime) => {
  console.log(`Time advanced from ${oldTime} to ${newTime}`);
  gameTime = newTime; // Keep local variable in sync
});
```

#### `setProcessPendingOrdersCallback(callback)`

Register callback for processing pending orders when market opens.

**Parameters:**
- `callback` (Function): `() => {}`

**Example:**
```javascript
tickHandler.setProcessPendingOrdersCallback(() => {
  console.log('Processing pending orders...');
  processPendingOrders();
});
```

#### `setOnMarketOpenCallback(callback)`

Register callback for market open events.

**Parameters:**
- `callback` (Function): `(gameTime) => {}`

#### `setOnMarketCloseCallback(callback)`

Register callback for market close events.

**Parameters:**
- `callback` (Function): `(gameTime) => {}`

### Tick Control

#### `start(intervalMs)`

Start the tick loop.

**Parameters:**
- `intervalMs` (number, optional): Tick interval in milliseconds (default: 1000)

**Example:**
```javascript
tickHandler.start(1000); // Tick every 1 second
```

#### `stop()`

Stop the tick loop.

#### `isRunning()`

Check if tick loop is running.

**Returns:** `boolean` - True if running

#### `tick()`

Manually trigger a single tick (for testing).

## How It Works

### Normal Time Advancement

On each tick (every 1 second by default):
1. Check pause state via `pauseHandler.shouldProcessGameState()`
2. If not paused, calculate new time: `gameTime + (timeMultiplier * 1000ms)`
3. Update game time
4. Check for market transitions
5. Trigger callbacks

### Fast-Forward Logic

When market is closed and `timeMultiplier >= 86400` (1 day or more):
- Advances time in 1-hour increments
- Stops when hitting market open hours
- Prevents skipping market open time

**Example:**
```
Current: Friday 5:00 PM (market closed)
Speed: 1 second = 1 week
Without fast-forward: Would jump to Friday 5:00 PM next week
With fast-forward: Stops at Monday 9:30 AM (market open)
```

### Market Transition Detection

Tracks market state (open/closed) between ticks:
- **Market opens**: Triggers pending order processing
- **Market closes**: Logs event (can be extended)

## Integration with server.js

### Initialization

```javascript
// Load tick handler
const tickHandler = require('./helpers/tickHandler');

// Initialize with game state
tickHandler.initialize(gameTime, timeMultiplier, isMarketOpen);

// Register callbacks
tickHandler.setProcessPendingOrdersCallback(processPendingOrders);
tickHandler.setOnTimeAdvancedCallback((oldTime, newTime) => {
  gameTime = newTime; // Keep server variable in sync
});

// Start ticking
tickHandler.start(1000);
```

### Synchronization

The tick handler maintains its own game time, but syncs with server.js:
- **On tick**: Updates via `setOnTimeAdvancedCallback`
- **On speed change**: Updates via `tickHandler.setTimeMultiplier()`
- **On debug time set**: Updates via `tickHandler.setGameTime()`

### Speed Control

```javascript
app.post('/api/time/speed', (req, res) => {
  const { multiplier } = req.body;
  if (multiplier && typeof multiplier === 'number' && multiplier > 0) {
    timeMultiplier = multiplier;
    tickHandler.setTimeMultiplier(multiplier); // Update tick handler
    saveGameState();
  }
  res.json({ timeMultiplier });
});
```

## Integration with Pause Handler

The tick handler automatically respects pause state:

```javascript
function tick() {
  // Only tick if game is not paused
  if (!pauseHandler.shouldProcessGameState()) {
    return;
  }
  // ... advance time
}
```

When game is paused:
- Time does not advance
- No market transitions occur
- No pending orders processed
- All callbacks skipped

## Time Multiplier Examples

| Multiplier | Game Time per Real Second | Use Case |
|------------|---------------------------|----------|
| 60 | 1 minute | Slow, detailed gameplay |
| 3600 | 1 hour | Default speed |
| 86400 | 1 day | Fast-forwarding |
| 604800 | 1 week | Very fast simulation |
| 2592000 | 30 days | Maximum speed |

## Testing

### Manual Tick Testing

```javascript
const tickHandler = require('./helpers/tickHandler');

// Initialize
tickHandler.initialize(new Date('1970-01-01T09:30:00'), 3600, isMarketOpen);

// Trigger single tick
const oldTime = tickHandler.getGameTime();
tickHandler.tick();
const newTime = tickHandler.getGameTime();

console.log(`Time advanced: ${oldTime} -> ${newTime}`);
```

### Pause Integration Testing

```javascript
const pauseHandler = require('./helpers/pauseHandler');
const tickHandler = require('./helpers/tickHandler');

// Pause game
pauseHandler.setIsPaused(true);

// Tick should not advance time
const timeBefore = tickHandler.getGameTime();
tickHandler.tick();
const timeAfter = tickHandler.getGameTime();

console.assert(timeBefore.getTime() === timeAfter.getTime(), 'Time should not advance when paused');
```

## Future Enhancements

1. **Variable tick rates**: Allow different intervals for different game speeds
2. **Tick scheduling**: Schedule specific actions at specific game times
3. **Time zones**: Support different market time zones
4. **Replay**: Record and replay tick history
5. **Performance metrics**: Track tick processing time

## Benefits

- **Centralization**: One place to manage time advancement
- **Consistency**: All time updates follow the same logic
- **Testability**: Easy to test time-dependent features
- **Maintainability**: Changes to tick logic only need to happen in one place
- **Extensibility**: Easy to add new time-based features via callbacks

## Conclusion

The centralized tick handler provides a robust foundation for time management in StockFake. By routing all time advancement through a single module, we ensure consistent behavior, easier testing, and simplified maintenance.
