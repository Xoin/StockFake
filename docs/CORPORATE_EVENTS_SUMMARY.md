# Corporate Events Implementation Summary

## Overview
This implementation adds support for historical and dynamic corporate events including:
- **Mergers & Acquisitions**: Companies being acquired by others
- **Bankruptcies**: Companies going bankrupt, causing total loss for shareholders
- **IPOs**: New companies going public and becoming available for trading
- **Going Private**: Public companies being taken private via leveraged buyouts

## Database Schema

### Tables Added

#### `corporate_events`
Tracks all corporate events in the game.
- `id`: Primary key
- `event_type`: Type of event (merger, acquisition, bankruptcy, ipo, going_private)
- `event_date`: When the event occurs
- `primary_symbol`: The main company involved
- `secondary_symbol`: The acquiring company (for mergers/acquisitions)
- `event_data`: JSON data with event details
- `status`: pending or applied
- `applied_at`: When the event was processed

#### `company_status`
Tracks the current status of companies.
- `symbol`: Company stock symbol
- `status`: active, bankrupt, acquired, private, delisted
- `status_date`: When status changed
- `reason`: Reason for status change
- `related_event_id`: Link to corporate event

#### `company_financials`
Stores dynamically generated financial data.
- `symbol`: Company symbol
- `year`: Fiscal year
- `revenue`, `net_income`, `assets`: Financial metrics (in millions)
- `employees`: Number of employees
- `patents`: Number of patents held

## Historical Events Included

### Bankruptcies (8 events)
1. **Penn Central Transportation (1970)** - Largest bankruptcy of its time
2. **Braniff International Airways (1982)** - Airline bankruptcy
3. **Enron Corporation (2001)** - Major accounting fraud scandal
4. **WorldCom (2002)** - $11B accounting fraud
5. **Lehman Brothers (2008)** - Triggered global financial crisis
6. **General Motors (2009)** - Largest industrial bankruptcy
7. **Hertz Global Holdings (2020)** - COVID-19 pandemic impact
8. **FTX Trading (2022)** - Cryptocurrency exchange collapse

### Acquisitions (4 events)
1. **NeXT by Apple (1995)** - Brought Steve Jobs back to Apple
2. **Pixar by Disney (2006)** - $7.4B stock-for-stock deal
3. **LinkedIn by Microsoft (2016)** - $26.2B cash acquisition
4. **Whole Foods by Amazon (2017)** - $13.7B cash acquisition

### Going Private (1 event)
1. **Dell Inc. (2013)** - $24.9B leveraged buyout

## Event Processing Logic

### Bankruptcy Events
When a company goes bankrupt:
- **Long positions**: Stock becomes worthless, removed from portfolio
- **Short positions**: Automatically covered at $0, profit realized
- **Notifications**: Email sent to user about the bankruptcy
- **Company status**: Updated to "bankrupt"
- **Transaction record**: Created showing the loss

### Merger/Acquisition Events
When a merger occurs:

**Cash Acquisitions:**
- User receives cash based on `cashPerShare` × shares held
- Position is liquidated automatically
- Transaction recorded with cash proceeds

**Stock-for-Stock Exchanges:**
- Shares converted to acquiring company's stock
- Exchange ratio applied (e.g., 2.3:1 for Pixar→Disney)
- New shares added to portfolio
- Old stock removed

**Short Positions:**
- Automatically covered at acquisition price
- Profit/loss calculated and applied

### Going Private Events
- Similar to cash acquisition
- Shareholders receive buyout price per share
- Stock removed from trading
- Company status updated to "private"

### IPO Events
- Company becomes available for trading
- Status updated to "active"
- Notification email sent about new investment opportunity

## API Endpoints

### GET /api/corporate-events
Returns list of all corporate events.
```javascript
{
  "events": [
    {
      "id": 1,
      "event_type": "bankruptcy",
      "event_date": "2001-12-02T00:00:00.000Z",
      "primary_symbol": "ENRNQ",
      "status": "applied",
      "event_data": {
        "companyName": "Enron Corporation",
        "description": "Enron files for bankruptcy...",
        "impact": "Complete loss for shareholders",
        "stockPriceImpact": -1.0
      }
    }
  ]
}
```

### GET /api/corporate-events/pending
Returns events that haven't been processed yet.

### GET /api/companies/:symbol/status
Check if a company is available for trading.
```javascript
{
  "symbol": "ENRNQ",
  "status": "bankrupt",
  "available": false,
  "statusDate": "2001-12-02T00:00:00.000Z",
  "reason": "Filed for bankruptcy",
  "message": "Company is bankrupt: Filed for bankruptcy"
}
```

### GET /api/companies/:symbol/financials
Get financial data for a company.
```javascript
{
  "symbol": "TEST",
  "financials": [
    {
      "year": 2020,
      "revenue": 1212,
      "net_income": 133,
      "assets": 1818,
      "employees": 485,
      "patents": 12
    }
  ]
}
```

## Integration with Game Loop

### Initialization
On server startup:
```javascript
corporateEvents.initializeCorporateEvents();
```
This loads all historical events into the database.

### Periodic Checking
Every 10 seconds, the game checks for events:
```javascript
setInterval(() => {
  if (!isPaused) {
    corporateEvents.processCorporateEvents(gameTime);
  }
}, 10000);
```

### Event Application
When an event's date is reached:
1. Event is retrieved from database
2. User's portfolio is checked for positions
3. Event-specific logic is applied:
   - Cash/stock transfers
   - Portfolio updates
   - Transaction records
4. Email notification is generated
5. Company status is updated
6. Event marked as "applied"

## Email Notifications

All corporate events generate email notifications with category `'corporate_action'`:
- **Subject**: Clearly identifies the event type and company
- **Body**: Details the event and impact on user's portfolio
- **Includes**: Transaction amounts, exchange ratios, or loss amounts

Example bankruptcy email:
```
URGENT: Bankruptcy Notice

Enron Corporation (ENRNQ) has filed for bankruptcy.

Enron files for bankruptcy following accounting fraud scandal.

YOUR POSITION:
You held 100 shares of ENRNQ

Unfortunately, your shares are now worthless. This represents 
a complete loss of your investment.

Your position has been removed from your portfolio.
```

## Dynamic Financial Data Generation

The system can generate realistic financial data for companies:
```javascript
const financials = corporateEvents.generateFinancialData(
  'SYMBOL',
  startYear,
  endYear,
  sector
);
```

Features:
- Sector-specific growth rates and multipliers
- Year-over-year variation
- Realistic ratios (revenue, net income, assets)
- Deterministic seeding for consistency

## Stock List Filtering

The `/api/stocks` endpoint automatically filters out unavailable companies:
```javascript
const stocks = stockData.filter(stock => 
  corporateEvents.isCompanyAvailable(stock.symbol, gameTime)
);
```

Companies with status other than "active" are hidden from trading.

## Testing

### Unit Tests
`test-corporate-events.js` - Tests basic functionality:
- Event initialization
- Financial data generation
- Company availability checks
- Event querying

### Integration Tests
`test-corporate-events-integration.js` - Tests full event processing:
- Bankruptcy with user positions
- Cash acquisitions with payouts
- Email generation
- Transaction recording
- Company status updates

Run tests:
```bash
node test-corporate-events.js
node test-corporate-events-integration.js
```

## Future Enhancements

### Dynamic IPO Generation
The system includes IPO candidates that can go public in future years:
- Stripe Inc. (2025+)
- SpaceX (2026+)
- Epic Games (2025+)
- Discord Inc. (2025+)
- Databricks Inc. (2025+)

Each has a probability of IPO per year after minimum year.

### Dynamic Event Generation
Future enhancement could add:
- Procedural merger generation based on market conditions
- Random bankruptcy events for struggling companies
- Spin-off events
- Stock split integration with corporate actions

## Code Organization

### Files Modified
- `database.js` - Added tables and query functions
- `server.js` - Added initialization, periodic checks, and API endpoints

### Files Created
- `data/corporate-events.js` - Historical event data
- `helpers/corporateEvents.js` - Event processing logic
- `test-corporate-events.js` - Unit tests
- `test-corporate-events-integration.js` - Integration tests

## Impact on Gameplay

### Risk Management
- Players holding positions in companies face risk of bankruptcy
- Short sellers can profit from bankruptcies
- Merger events can provide unexpected windfalls or losses

### Strategic Considerations
- Historical knowledge can be used to avoid bankruptcies
- Timing acquisitions can maximize returns
- Going private events provide forced exits

### Educational Value
- Teaches about corporate life cycles
- Demonstrates real-world business events
- Shows impact of corporate actions on shareholders

## Performance Considerations

- Events checked every 10 seconds (lightweight query)
- Only pending events up to current time are queried
- Event processing is O(n) where n = number of pending events
- Typical: 0-2 events per check, very efficient
- Historical data: 13 events total from 1970-2022

## Compatibility

- Fully compatible with existing features:
  - Stock splits
  - Market crashes
  - Index fund rebalancing
  - Dividend payments
  - Tax calculations

- Works seamlessly with:
  - Time travel (fast forward/rewind)
  - Portfolio management
  - Transaction history
  - Email system
