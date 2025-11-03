# StockFake API Documentation

## Overview

StockFake provides a comprehensive REST API for managing the stock trading simulation. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL**: `http://localhost:3000`

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

## API Endpoints

### Time & Market Status

#### GET /api/time
Get current game time, market status, and trade halt information.

**Response:**
```json
{
  "time": "1987-10-19T14:30:00.000Z",
  "isPaused": false,
  "timeMultiplier": 3600,
  "isMarketOpen": true,
  "tradeHalt": null
}
```

**Fields:**
- `time`: Current in-game datetime (ISO 8601)
- `isPaused`: Whether time progression is paused
- `timeMultiplier`: Game seconds per real second (60, 3600, or 86400)
- `isMarketOpen`: Whether NYSE is currently open for trading
- `tradeHalt`: Active trade halt details or null

#### POST /api/time/pause
Toggle pause state.

**Response:**
```json
{
  "success": true,
  "isPaused": true
}
```

#### POST /api/time/speed
Set time progression speed.

**Request Body:**
```json
{
  "multiplier": 86400
}
```

**Valid multipliers:**
- `60` - Slow (1s = 1min)
- `3600` - Normal (1s = 1hr)
- `86400` - Fast (1s = 1day)

**Response:**
```json
{
  "success": true,
  "multiplier": 86400
}
```

---

### Stock Information

#### GET /api/stocks
List all currently available stocks with prices and availability.

**Query Parameters:**
- None

**Response:**
```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 150.25,
      "sector": "Technology",
      "availableShares": 1000000,
      "publicFloatPercent": 99.5,
      "marketCap": 2500000000000
    }
  ]
}
```

#### GET /api/stocks/:symbol
Get detailed information for a specific stock.

**Response:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "price": 150.25,
  "sector": "Technology",
  "yearFounded": 1976,
  "yearPublic": 1980,
  "availableShares": 1000000,
  "marketCap": 2500000000000
}
```

#### GET /api/stocks/:symbol/history
Get historical price data for charting.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "symbol": "AAPL",
  "history": [
    { "date": "2020-01-01", "price": 75.10 },
    { "date": "2020-01-02", "price": 75.50 }
  ]
}
```

#### POST /api/trade
Execute a stock trade (buy, sell, short, cover).

**Request Body:**
```json
{
  "action": "buy",
  "symbol": "AAPL",
  "shares": 100
}
```

**Actions:**
- `buy` - Purchase shares
- `sell` - Sell owned shares
- `short` - Short sell (borrow and sell)
- `cover` - Buy shares to cover short position

**Response:**
```json
{
  "success": true,
  "transaction": {
    "action": "buy",
    "symbol": "AAPL",
    "shares": 100,
    "price": 150.25,
    "total": 15025.00,
    "fee": 0.00,
    "newCash": 4975.00
  }
}
```

**Error Conditions:**
- Market closed
- Insufficient funds
- Insufficient shares (for sell)
- Trading cooldown active (5 min between trades for same symbol)
- Position limits exceeded

---

### Index Funds

#### GET /api/indexfunds
List all available index funds with current prices.

**Response:**
```json
{
  "funds": [
    {
      "symbol": "SPY",
      "name": "S&P 500 Index Fund",
      "price": 450.75,
      "expenseRatio": 0.0015,
      "constituents": 500,
      "inceptionYear": 1957
    }
  ]
}
```

#### GET /api/indexfunds/:symbol
Get detailed fund information including current constituents.

**Response:**
```json
{
  "symbol": "SPY",
  "name": "S&P 500 Index Fund",
  "price": 450.75,
  "expenseRatio": 0.0015,
  "constituents": [
    { "symbol": "AAPL", "weight": 0.07, "marketCap": 2500000000000 },
    { "symbol": "MSFT", "weight": 0.06, "marketCap": 2100000000000 }
  ]
}
```

#### GET /api/indexfunds/:symbol/history
Get historical fund prices.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "symbol": "SPY",
  "history": [
    { "date": "2020-01-01", "price": 325.50 },
    { "date": "2020-01-02", "price": 327.25 }
  ]
}
```

#### POST /api/indexfunds/trade
Buy or sell index fund shares.

**Request Body:**
```json
{
  "action": "buy",
  "symbol": "SPY",
  "shares": 10.5
}
```

**Note:** Index fund shares can be fractional.

**Response:**
```json
{
  "success": true,
  "transaction": {
    "action": "buy",
    "symbol": "SPY",
    "shares": 10.5,
    "price": 450.75,
    "total": 4732.88,
    "newCash": 5267.12
  }
}
```

#### GET /api/indexfunds/:symbol/rebalancing
Get rebalancing history for a specific fund.

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "date": "2020-01-01",
      "reason": "periodic",
      "changes": 15,
      "details": { ... }
    }
  ]
}
```

#### GET /api/indexfunds/:symbol/weights
Get current constituent weights and market-cap data.

**Response:**
```json
{
  "constituents": [
    {
      "symbol": "AAPL",
      "weight": 0.07,
      "marketCap": 2500000000000,
      "shares": 15000000
    }
  ]
}
```

#### GET /api/indexfunds/:symbol/config
Get rebalancing configuration.

**Response:**
```json
{
  "strategy": "market_cap_weighted",
  "frequency": "quarterly",
  "thresholdPercent": 5.0
}
```

#### POST /api/indexfunds/:symbol/config
Update rebalancing configuration.

**Request Body:**
```json
{
  "frequency": "monthly",
  "thresholdPercent": 3.0
}
```

**Response:**
```json
{
  "success": true,
  "config": { ... }
}
```

#### POST /api/indexfunds/:symbol/rebalance
Manually trigger rebalancing for a fund.

**Response:**
```json
{
  "success": true,
  "changes": 12,
  "date": "2020-01-15"
}
```

#### GET /api/rebalancing/events
Get all rebalancing events across all funds.

**Query Parameters:**
- `limit` (optional): Maximum events to return (default: 50)

**Response:**
```json
{
  "events": [
    {
      "fund": "SPY",
      "date": "2020-01-01",
      "reason": "periodic",
      "changes": 15
    }
  ]
}
```

---

### Companies

#### GET /api/companies
List all available companies.

**Response:**
```json
{
  "companies": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "sector": "Technology",
      "founded": 1976,
      "public": 1980
    }
  ]
}
```

#### GET /api/companies/:symbol
Get detailed company profile and financials.

**Response:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "founded": 1976,
  "yearPublic": 1980,
  "headquarters": "Cupertino, CA",
  "products": ["iPhone", "iPad", "Mac", "Apple Watch"],
  "intellectualProperty": ["Touch ID", "Face ID", "A-series chips"],
  "financials": {
    "revenue": 365000000000,
    "netIncome": 95000000000,
    "totalAssets": 350000000000,
    "employees": 164000,
    "patents": 15000
  },
  "dividendYield": 0.0055
}
```

---

### Account & Portfolio

#### GET /api/account
Get complete account summary.

**Response:**
```json
{
  "cash": 50000.00,
  "creditScore": 750,
  "portfolio": [
    { "symbol": "AAPL", "shares": 100, "value": 15025.00 }
  ],
  "indexFunds": [
    { "symbol": "SPY", "shares": 10.5, "value": 4732.88 }
  ],
  "shortPositions": [
    { "symbol": "TSLA", "shares": 50, "borrowPrice": 200.00 }
  ],
  "marginAccount": {
    "balance": 0.00,
    "interestRate": 0.08,
    "isEnabled": false
  },
  "totalValue": 69757.88,
  "activeLoans": [
    {
      "id": 1,
      "company": "Prime National Bank",
      "balance": 5000.00,
      "rate": 0.03,
      "dueDate": "2021-01-01"
    }
  ],
  "transactions": [],
  "dividends": [],
  "taxes": [],
  "fees": [],
  "riskMetrics": {
    "leverage": 1.0,
    "concentrationRisk": 0.21,
    "marginCallStatus": null
  }
}
```

---

### Loans

#### GET /api/loans/companies
Get available lenders based on current credit score.

**Response:**
```json
{
  "companies": [
    {
      "id": "prime_national",
      "name": "Prime National Bank",
      "trustworthiness": 10,
      "baseRate": 0.03,
      "yourRate": 0.03,
      "minAmount": 1000,
      "maxAmount": 100000,
      "terms": [90, 180, 365, 730, 1825, 3650]
    }
  ]
}
```

#### GET /api/loans/active
Get all active loans.

**Response:**
```json
{
  "loans": [
    {
      "id": 1,
      "company": "Prime National Bank",
      "principal": 10000.00,
      "balance": 9500.00,
      "rate": 0.03,
      "startDate": "2020-01-01",
      "dueDate": "2021-01-01",
      "missedPayments": 0,
      "status": "active"
    }
  ]
}
```

#### POST /api/loans/take
Apply for and receive a loan.

**Request Body:**
```json
{
  "companyId": "prime_national",
  "amount": 10000,
  "termDays": 365
}
```

**Response:**
```json
{
  "success": true,
  "loan": {
    "id": 1,
    "amount": 10000.00,
    "rate": 0.03,
    "dueDate": "2021-01-01",
    "originationFee": 0.00,
    "netAmount": 10000.00
  }
}
```

**Error Conditions:**
- Credit score too low for lender
- Amount outside lender's range
- Already have maximum loans (10)

#### POST /api/loans/pay
Make a payment on a loan.

**Request Body:**
```json
{
  "loanId": 1,
  "amount": 1000.00
}
```

**Response:**
```json
{
  "success": true,
  "remainingBalance": 8500.00,
  "paidOff": false
}
```

---

### Margin Trading

#### POST /api/margin/toggle
Enable or disable margin trading.

**Response:**
```json
{
  "success": true,
  "enabled": true
}
```

#### POST /api/margin/pay
Pay down margin debt.

**Request Body:**
```json
{
  "amount": 5000.00
}
```

**Response:**
```json
{
  "success": true,
  "remainingBalance": 5000.00
}
```

#### POST /api/margin/calculate
Calculate margin requirements for a potential trade.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "shares": 100,
  "price": 150.00
}
```

**Response:**
```json
{
  "totalCost": 15000.00,
  "marginRequired": 7500.00,
  "borrowAmount": 7500.00,
  "canTrade": true
}
```

---

### Taxes & Reporting

#### GET /api/taxes
Get tax summary and breakdown.

**Query Parameters:**
- `year` (optional): Tax year (YYYY)

**Response:**
```json
{
  "year": 2020,
  "shortTermGains": 5000.00,
  "longTermGains": 10000.00,
  "dividends": 2000.00,
  "totalTax": 4600.00,
  "breakdown": [
    { "type": "short_term", "gain": 5000.00, "tax": 1500.00 },
    { "type": "long_term", "gain": 10000.00, "tax": 1500.00 },
    { "type": "dividend", "amount": 2000.00, "tax": 300.00 }
  ]
}
```

---

### News & Communications

#### GET /api/news
Get historical news events up to current game time.

**Query Parameters:**
- `limit` (optional): Max events to return (default: 50)

**Response:**
```json
{
  "news": [
    {
      "date": "1987-10-19",
      "headline": "Black Monday: Stock Market Crashes 22.6%",
      "content": "The Dow Jones Industrial Average fell 508 points..."
    }
  ]
}
```

#### GET /api/emails
Get email notifications and updates.

**Response:**
```json
{
  "emails": [
    {
      "id": 1,
      "date": "2020-01-01",
      "from": "dividends@stockfake.com",
      "subject": "Q1 2020 Dividend Payment",
      "body": "You received $250 in dividends..."
    }
  ]
}
```

---

### Market Crash Simulation

#### GET /api/crash/scenarios
List all available crash scenarios.

**Response:**
```json
{
  "scenarios": [
    {
      "id": "black_monday_1987",
      "name": "Black Monday 1987",
      "type": "historical",
      "magnitude": 0.2278,
      "duration": 1
    },
    {
      "id": "tech_bubble",
      "name": "Tech Bubble Burst",
      "type": "hypothetical",
      "magnitude": 0.78,
      "duration": 730
    }
  ]
}
```

#### GET /api/crash/scenarios/:id
Get detailed scenario configuration.

**Response:**
```json
{
  "id": "black_monday_1987",
  "name": "Black Monday 1987",
  "eventType": "market_crash",
  "magnitude": 0.2278,
  "duration": 1,
  "volatilityMultiplier": 10.0,
  "liquidityReduction": 0.9,
  "sectorImpacts": {
    "Financial": 0.30,
    "Technology": 0.25
  }
}
```

#### POST /api/crash/trigger
Trigger a crash event.

**Request Body:**
```json
{
  "scenarioId": "black_monday_1987"
}
```

Or with custom configuration:

```json
{
  "customConfig": {
    "name": "Custom Crash",
    "magnitude": 0.15,
    "duration": 30,
    "volatilityMultiplier": 3.0
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": 1,
  "name": "Black Monday 1987",
  "startDate": "1987-10-19"
}
```

#### GET /api/crash/active
Get currently active crash events.

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "name": "Black Monday 1987",
      "startDate": "1987-10-19",
      "endDate": "1987-10-19",
      "magnitude": 0.2278,
      "isActive": true
    }
  ]
}
```

#### POST /api/crash/deactivate/:eventId
Manually deactivate a crash event.

**Response:**
```json
{
  "success": true,
  "eventId": 1
}
```

#### GET /api/crash/analytics
Get crash analytics and market state.

**Response:**
```json
{
  "activeEvents": 1,
  "totalEvents": 15,
  "marketState": {
    "volatility": 10.0,
    "liquidity": 0.1,
    "sentiment": -0.95
  }
}
```

#### GET /api/crash/market-state
Get current market state.

**Response:**
```json
{
  "volatility": 1.0,
  "liquidity": 1.0,
  "sentiment": 0.0,
  "sectorSentiment": {
    "Technology": 0.0,
    "Financial": 0.0
  }
}
```

#### GET /api/crash/history
Get crash event history.

**Query Parameters:**
- `limit` (optional): Max events to return (default: 50)

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "name": "Black Monday 1987",
      "startDate": "1987-10-19",
      "endDate": "1987-10-19",
      "magnitude": 0.2278,
      "recovered": true
    }
  ]
}
```

#### POST /api/crash/custom
Create custom crash scenario template.

**Request Body:**
```json
{
  "name": "My Custom Crash",
  "magnitude": 0.20,
  "duration": 60,
  "volatilityMultiplier": 5.0,
  "liquidityReduction": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "scenarioId": "custom_crash_1"
}
```

---

### Dynamic Event Generation

#### GET /api/crash/dynamic/config
Get dynamic event generation configuration.

**Response:**
```json
{
  "enabled": true,
  "probability": 0.12,
  "severityDistribution": {
    "minor": 0.5,
    "moderate": 0.3,
    "severe": 0.15,
    "catastrophic": 0.05
  }
}
```

#### POST /api/crash/dynamic/config
Update dynamic event generation configuration.

**Request Body:**
```json
{
  "enabled": true,
  "probability": 0.15,
  "severityDistribution": {
    "minor": 0.4,
    "moderate": 0.3,
    "severe": 0.2,
    "catastrophic": 0.1
  }
}
```

**Response:**
```json
{
  "success": true,
  "config": { ... }
}
```

#### GET /api/crash/dynamic/events
Get all dynamically generated events.

**Response:**
```json
{
  "events": [
    {
      "id": 100,
      "name": "Market Correction 2025",
      "date": "2025-03-15",
      "magnitude": 0.12,
      "dynamic": true
    }
  ]
}
```

#### POST /api/crash/dynamic/generate
Manually trigger dynamic event generation.

**Response:**
```json
{
  "success": true,
  "generated": 3,
  "events": [ ... ]
}
```

---

### Corporate Events

#### GET /api/corporate-events
List all corporate events.

**Query Parameters:**
- `symbol` (optional): Filter by company symbol
- `type` (optional): Filter by event type

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "symbol": "ENRN",
      "type": "bankruptcy",
      "date": "2001-12-02",
      "processed": true,
      "details": "Enron files for bankruptcy"
    }
  ]
}
```

**Event Types:**
- `bankruptcy` - Company bankruptcy
- `merger` - Acquisition by another company
- `going_private` - Delisting from public markets
- `ipo` - Initial public offering

#### GET /api/corporate-events/pending
List pending events that haven't occurred yet.

**Response:**
```json
{
  "events": [
    {
      "id": 15,
      "symbol": "FTXC",
      "type": "bankruptcy",
      "date": "2022-11-11",
      "processed": false
    }
  ]
}
```

#### GET /api/companies/:symbol/status
Check company status.

**Response:**
```json
{
  "symbol": "ENRN",
  "status": "bankrupt",
  "statusDate": "2001-12-02",
  "details": "Filed for bankruptcy"
}
```

**Status Values:**
- `active` - Available for trading
- `bankrupt` - No longer tradeable
- `acquired` - Merged into another company
- `private` - No longer publicly traded

#### GET /api/companies/:symbol/financials
Get company financial data over time.

**Response:**
```json
{
  "symbol": "AAPL",
  "financials": [
    {
      "year": 2020,
      "revenue": 274515000000,
      "netIncome": 57411000000,
      "totalAssets": 323888000000,
      "employees": 147000,
      "patents": 12500
    }
  ]
}
```

---

### Economic Indicators

#### GET /api/economic/indicators/:year
Get economic data for a specific year.

**Response:**
```json
{
  "year": 2020,
  "fedFundsRate": 0.09,
  "qeActive": true,
  "qeSize": 120000000000,
  "gdpGrowth": -3.4,
  "unemployment": 8.1,
  "inflation": 1.4
}
```

#### GET /api/economic/historical
Get all historical economic data (1970-2024).

**Response:**
```json
{
  "data": [
    {
      "year": 1970,
      "fedFundsRate": 7.18,
      "gdpGrowth": 0.2,
      "unemployment": 4.9
    }
  ]
}
```

#### GET /api/economic/impact/:year
Calculate market impact from economic conditions.

**Response:**
```json
{
  "year": 2020,
  "fedImpact": 0.05,
  "qeImpact": 0.08,
  "gdpImpact": -0.034,
  "totalImpact": 0.096,
  "annualizedReturn": 0.07
}
```

#### GET /api/economic/config
Get economic modeling configuration.

**Response:**
```json
{
  "baseReturn": 0.07,
  "recessionProbability": 0.12,
  "maxGrowthRate": 0.04,
  "inflationTarget": 0.02
}
```

#### POST /api/economic/config
Update economic modeling parameters.

**Request Body:**
```json
{
  "recessionProbability": 0.15,
  "inflationTarget": 0.025
}
```

**Response:**
```json
{
  "success": true,
  "config": { ... }
}
```

---

## Rate Limits

Currently no rate limits are enforced. This may change in future versions for multi-user deployments.

## Authentication

The API currently does not require authentication as it's a single-player game. Future versions may add authentication for multi-user support.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production deployments.

## WebSocket Support

Currently not implemented. All updates use polling. Future versions may add WebSocket support for real-time updates.

## See Also

- [DATABASE.md](DATABASE.md) - Database schema
- [GAME_STATE.md](GAME_STATE.md) - Game state management
- [CRASH_SIMULATION.md](CRASH_SIMULATION.md) - Market crash system
- [CORPORATE_EVENTS_SUMMARY.md](CORPORATE_EVENTS_SUMMARY.md) - Corporate events
- [ECONOMIC_INDICATORS_SUMMARY.md](ECONOMIC_INDICATORS_SUMMARY.md) - Economic indicators
