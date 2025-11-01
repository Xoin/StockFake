# Market Crash Simulation System

## Overview

The Market Crash Simulation system provides a comprehensive framework for simulating dynamic market crashes and extreme market events. This system allows for injecting sudden, severe shocks into the market environment with configurable parameters for magnitude, duration, cascading effects, and recovery patterns.

## Features

### Event Modeling
- **Multiple Event Types**: Market crashes, sector crashes, corrections, flash crashes, bear markets, liquidity crises, and contagion events
- **Severity Levels**: Minor (<10%), Moderate (10-20%), Severe (20-40%), and Catastrophic (>40%) impacts
- **Configurable Parameters**: Magnitude, duration, volatility multipliers, liquidity reduction, and sentiment shifts
- **Sector-Specific Impacts**: Different impact levels for Technology, Financial, Industrials, Consumer, Energy, Healthcare, and other sectors

### Historical Scenarios
1. **Black Monday 1987**: 22.78% single-day drop, extreme volatility
2. **Dot-Com Bubble Burst (2000-2002)**: Technology sector collapse (-78%)
3. **Financial Crisis of 2008**: Global financial crisis with 57% decline
4. **COVID-19 Pandemic Crash (2020)**: Rapid 34% drop with quick V-shaped recovery
5. **Flash Crash 2010**: Algorithmic trading-induced crash with immediate recovery

### Hypothetical Scenarios
1. **Tech Bubble Burst**: Simulated collapse of overvalued technology sector
2. **Banking Crisis**: Systemic banking failure scenario
3. **Energy Crisis**: Oil/energy supply shock simulation
4. **Geopolitical Shock**: Major geopolitical crisis impact

### Impact Mechanisms

#### Price Impact
- Base market-wide impact percentage
- Sector-specific adjustments
- Cascading effects over time
- Recovery pattern application
- Volatility-based random fluctuations

#### Market State Effects
- **Volatility**: Multiplies base volatility (2.5x to 10x during crashes)
- **Liquidity**: Reduces available liquidity (30% to 90% reduction)
- **Sentiment**: Shifts investor sentiment (-1.0 extreme fear to +1.0 extreme greed)
- **Sector Sentiment**: Sector-specific sentiment adjustments

#### Cascading Effects
Events can define multiple cascading effect stages with delays:
```javascript
cascadingEffects: [
  { delay: 0, multiplier: 1.0 },      // Immediate impact
  { delay: 7, multiplier: 0.4 },      // Week 1: 40% of initial impact
  { delay: 30, multiplier: 0.2 },     // Month 1: 20% of initial impact
  { delay: 90, multiplier: -0.1 }     // Month 3: 10% recovery
]
```

#### Recovery Patterns
- **V-Shaped**: Quick recovery (e.g., COVID-19)
- **Gradual**: Linear recovery over time
- **Slow**: Logarithmic recovery (e.g., 2008 crisis)
- **Prolonged**: Extended decline then slow recovery (e.g., dot-com)
- **Immediate**: Very fast recovery (e.g., flash crash)

## API Reference

### Get All Scenarios
```
GET /api/crash/scenarios
```

Returns all available crash scenarios (historical and hypothetical).

**Response:**
```json
{
  "total": 9,
  "historical": 5,
  "hypothetical": 4,
  "scenarios": [
    {
      "id": "black_monday_1987",
      "name": "Black Monday 1987",
      "type": "market_crash",
      "severity": "catastrophic",
      "description": "The largest single-day percentage decline...",
      "trigger": "historical"
    }
  ]
}
```

### Get Scenario Details
```
GET /api/crash/scenarios/:id
```

Returns complete details for a specific scenario.

**Response:**
```json
{
  "id": "covid_crash_2020",
  "name": "COVID-19 Pandemic Crash",
  "type": "market_crash",
  "severity": "severe",
  "startDate": "2020-02-20T09:30:00.000Z",
  "endDate": "2020-03-23T16:00:00.000Z",
  "impact": {
    "market": -0.34,
    "volatilityMultiplier": 6.0,
    "liquidityReduction": 0.5,
    "sentimentShift": -0.85,
    "sectors": {
      "Technology": -0.25,
      "Financial": -0.40,
      "Energy": -0.55
    }
  },
  "cascadingEffects": [...],
  "recoveryPattern": {
    "type": "v-shaped",
    "durationDays": 150,
    "volatilityDecay": 0.92
  }
}
```

### Trigger Crash Event
```
POST /api/crash/trigger
```

Activates a crash event in the simulation.

**Request Body:**
```json
{
  "scenarioId": "financial_crisis_2008"
}
```

Or with custom configuration:
```json
{
  "customConfig": {
    "name": "Custom Market Event",
    "type": "market_crash",
    "severity": "severe",
    "marketImpact": -0.30,
    "volatilityMultiplier": 4.0,
    "liquidityReduction": 0.6,
    "sentimentShift": -0.7,
    "sectors": {
      "Technology": -0.35,
      "Financial": -0.45
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "financial_crisis_2008",
    "name": "Financial Crisis of 2008",
    "status": "active",
    "activatedAt": "2008-09-15T09:30:00.000Z"
  },
  "message": "Crash event 'Financial Crisis of 2008' activated"
}
```

### Get Active Events
```
GET /api/crash/active
```

Returns currently active crash events.

**Response:**
```json
{
  "count": 1,
  "events": [
    {
      "id": "financial_crisis_2008",
      "name": "Financial Crisis of 2008",
      "type": "market_crash",
      "severity": "catastrophic",
      "status": "active",
      "daysSinceStart": 14,
      "currentPhase": "impact"
    }
  ]
}
```

### Deactivate Event
```
POST /api/crash/deactivate/:eventId
```

Manually deactivates an active crash event.

**Response:**
```json
{
  "success": true,
  "message": "Event 'Financial Crisis of 2008' deactivated"
}
```

### Get Market State
```
GET /api/crash/market-state
```

Returns current market state affected by crashes.

**Response:**
```json
{
  "baseVolatility": 1.0,
  "currentVolatility": 4.5,
  "liquidityLevel": 0.3,
  "sentimentScore": -0.9,
  "sectorSentiment": {
    "Financial": -0.83,
    "Technology": -0.42,
    "Energy": -0.60
  }
}
```

### Get Analytics
```
GET /api/crash/analytics
```

Returns comprehensive analytics about crash events and market state.

**Response:**
```json
{
  "activeEventsCount": 1,
  "activeEvents": [...],
  "marketState": {...},
  "historicalEventsCount": 5,
  "recentEvents": [...]
}
```

### Get Event History
```
GET /api/crash/history?limit=50
```

Returns history of triggered crash events.

**Response:**
```json
{
  "count": 5,
  "events": [
    {
      "eventId": "covid_crash_2020",
      "name": "COVID-19 Pandemic Crash",
      "activatedAt": "2020-02-20T09:30:00.000Z",
      "type": "market_crash",
      "severity": "severe"
    }
  ]
}
```

### Create Custom Scenario
```
POST /api/crash/custom
```

Creates a custom crash scenario template.

**Request Body:**
```json
{
  "name": "My Custom Crash",
  "type": "sector_crash",
  "severity": "moderate",
  "marketImpact": -0.15,
  "volatilityMultiplier": 3.0,
  "sectors": {
    "Technology": -0.25,
    "Financial": -0.10
  }
}
```

**Response:**
```json
{
  "success": true,
  "scenario": {...},
  "message": "Custom crash scenario created. Use /api/crash/trigger to activate it."
}
```

## Usage Examples

### Example 1: Trigger Historical Crash
```javascript
// Trigger the 2008 financial crisis
fetch('/api/crash/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scenarioId: 'financial_crisis_2008'
  })
});
```

### Example 2: Create and Trigger Custom Event
```javascript
// Create custom tech bubble scenario
const customScenario = {
  name: 'AI Bubble Burst',
  type: 'sector_crash',
  severity: 'severe',
  marketImpact: -0.20,
  volatilityMultiplier: 3.5,
  liquidityReduction: 0.4,
  sentimentShift: -0.7,
  sectors: {
    'Technology': -0.55,
    'Financial': -0.15,
    'Industrials': -0.10
  },
  cascadingEffects: [
    { delay: 0, multiplier: 1.0 },
    { delay: 7, multiplier: 0.4 },
    { delay: 30, multiplier: 0.2 }
  ],
  recoveryPattern: {
    type: 'gradual',
    durationDays: 365,
    volatilityDecay: 0.96
  }
};

// Trigger the custom event
fetch('/api/crash/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customConfig: customScenario })
});
```

### Example 3: Monitor Market State
```javascript
// Check market state during crash
fetch('/api/crash/market-state')
  .then(res => res.json())
  .then(state => {
    console.log(`Volatility: ${state.currentVolatility}x`);
    console.log(`Liquidity: ${(state.liquidityLevel * 100)}%`);
    console.log(`Sentiment: ${state.sentimentScore}`);
  });
```

### Example 4: Get Analytics
```javascript
// Get comprehensive analytics
fetch('/api/crash/analytics')
  .then(res => res.json())
  .then(analytics => {
    console.log(`Active events: ${analytics.activeEventsCount}`);
    console.log(`Historical events: ${analytics.historicalEventsCount}`);
    console.log(`Market volatility: ${analytics.marketState.currentVolatility}x`);
  });
```

## Integration with Stock Prices

The crash simulation automatically integrates with the stock price engine. When calculating stock prices, the system:

1. Calculates the base price from historical data
2. Applies market-wide crash impact
3. Applies sector-specific impact
4. Applies cascading effect multiplier
5. Applies recovery pattern adjustment
6. Adds volatility-based random fluctuation

This ensures that stock prices accurately reflect the crash conditions without requiring manual intervention.

## Testing

Run the comprehensive integration tests:

```bash
node test-crash-simulation.js
```

This test suite validates:
- Market state initialization
- Scenario loading
- Event triggering and deactivation
- Price impact calculations
- Cascading effects
- Liquidity impact
- Analytics and reporting
- Custom scenario creation

## Database Schema

### market_crash_events
Stores active and historical crash events:
- `id`: Unique event identifier
- `name`: Event name
- `type`: Event type (market_crash, sector_crash, etc.)
- `severity`: Severity level
- `activated_at`: Activation timestamp
- `deactivated_at`: Deactivation timestamp (nullable)
- `status`: Current status (active, deactivated, completed)
- `event_data`: Full event configuration (JSON)

### market_state
Stores current market state:
- `base_volatility`: Baseline volatility (default 1.0)
- `current_volatility`: Current volatility multiplier
- `liquidity_level`: Current liquidity level (0.0 to 1.0)
- `sentiment_score`: Market sentiment (-1.0 to 1.0)
- `sector_sentiment`: Sector-specific sentiment (JSON)

## Configuration

### Event Types
- `MARKET_CRASH`: Broad market crash
- `SECTOR_CRASH`: Sector-specific crash
- `CORRECTION`: Market correction (10-20% drop)
- `FLASH_CRASH`: Rapid, temporary crash
- `BEAR_MARKET`: Prolonged decline (20%+)
- `LIQUIDITY_CRISIS`: Liquidity-driven event
- `CONTAGION`: Cross-market contagion

### Trigger Types
- `MANUAL`: Manually triggered via API
- `SCHEDULED`: Time-based trigger
- `CONDITION`: Condition-based trigger
- `HISTORICAL`: Historical replay

### Severity Levels
- `MINOR`: < 10% impact
- `MODERATE`: 10-20% impact
- `SEVERE`: 20-40% impact
- `CATASTROPHIC`: > 40% impact

## Architecture

The crash simulation system consists of three main components:

### 1. Event Data Module (`data/market-crash-events.js`)
- Defines crash scenarios (historical and hypothetical)
- Provides scenario templates
- Manages scenario metadata

### 2. Simulation Engine (`helpers/marketCrashSimulation.js`)
- Manages active events
- Calculates price impacts
- Updates market state
- Handles cascading effects and recovery

### 3. API Layer (`server.js`)
- Exposes REST API endpoints
- Manages event lifecycle
- Persists events to database
- Provides analytics

## Best Practices

1. **Test Before Production**: Always test crash scenarios in a development environment first
2. **Monitor Active Events**: Regularly check active events to ensure they're behaving as expected
3. **Use Analytics**: Leverage the analytics endpoint to understand market state
4. **Gradual Impact**: For realistic simulations, use scenarios with cascading effects
5. **Recovery Patterns**: Choose appropriate recovery patterns based on the scenario type
6. **Sector Targeting**: Use sector-specific impacts for more realistic simulations
7. **Historical Accuracy**: When replaying historical events, use the provided scenarios

## Troubleshooting

### Crash Not Affecting Prices
- Ensure the event is active (check `/api/crash/active`)
- Verify the game time is within the event's duration
- Check that stocks have the correct sector assignment

### Extreme Volatility
- Check the volatilityMultiplier in the event configuration
- Review active events - multiple events compound volatility
- Consider deactivating events if too extreme

### Recovery Too Slow/Fast
- Adjust the recoveryPattern.durationDays
- Change the recoveryPattern.type (v-shaped, gradual, slow, etc.)
- Modify cascading effect multipliers

## Future Enhancements

Potential future additions to the crash simulation system:
- Conditional triggers based on market metrics
- Scheduled/automated crash scenarios
- Multi-stage crash events
- Contagion modeling between sectors
- Central bank intervention simulation
- Circuit breaker simulation
- More granular sector breakdowns
- Company-specific resilience factors
