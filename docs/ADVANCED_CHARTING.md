# Advanced Charting with Technical Indicators

This document describes the advanced charting and technical analysis features added to StockFake.

## Overview

StockFake now includes professional-grade technical analysis tools integrated into the existing Charts page (`/graphs`). These tools allow users to analyze stock price movements using various technical indicators and overlay market events.

## Features

### Chart Types
- **Line Charts**: Standard price line charts
- **Area Charts**: Filled area under the price line
- **OHLC Data**: Open, High, Low, Close data generated from price history

### Technical Indicators

#### Moving Averages
- **SMA (Simple Moving Average)**: 20, 50, and 200-period averages
- **EMA (Exponential Moving Average)**: 12 and 26-period averages  
- **WMA (Weighted Moving Average)**: Available via API

#### Oscillators
- **RSI (Relative Strength Index)**: 14-period momentum oscillator (0-100 scale)
  - Values > 70 indicate overbought conditions
  - Values < 30 indicate oversold conditions
- **MACD (Moving Average Convergence Divergence)**: Trend-following momentum indicator
  - MACD line (12-26 EMA difference)
  - Signal line (9-period EMA of MACD)
  - Histogram (MACD - Signal)
- **Stochastic Oscillator**: Available via API

#### Bands & Envelopes
- **Bollinger Bands**: Volatility bands (20-period SMA ± 2 standard deviations)
  - Upper band
  - Middle band (SMA)
  - Lower band

#### Volume & Volatility
- **ATR (Average True Range)**: 14-period volatility measure
- **OBV (On-Balance Volume)**: Cumulative volume indicator
- **VWAP (Volume Weighted Average Price)**: Intraday average price weighted by volume

### Market Events
- Visual markers for significant market events
- Crash events (market-wide)
- Corporate events (stock-specific):
  - IPOs
  - Mergers and acquisitions
  - Bankruptcies
  - Stock splits
- Color-coded by impact:
  - Red: Negative impact
  - Green: Positive impact
  - Yellow: Neutral

### Auto-Refresh
- Live chart updates every 10 seconds when enabled
- Reflects real-time game progression
- Can be toggled on/off

## Using the Charts

### Accessing Technical Indicators

1. Navigate to **Charts** from the main menu
2. Click on **Individual Stocks** tab
3. Select a stock from the dropdown
4. Click **Toggle Indicators** to show indicator controls
5. Check the boxes for desired indicators:
   - **Moving Averages**: Display as overlays on the main chart
   - **Oscillators**: Display in separate panels below the main chart
   - **Market Events**: Show event markers on the chart

### Chart Controls

- **Time Period**: Select from 7 days to all-time history
- **Stock Selection**: Choose from 170+ available stocks
- **Update Charts**: Manually refresh the chart
- **Auto-Refresh**: Enable/disable automatic updates
- **Toggle Indicators**: Show/hide indicator controls

### Indicator Panels

When oscillators (RSI, MACD) are enabled:
- Separate panels appear below the main price chart
- Each panel has reference lines (e.g., RSI 30/70 levels)
- Panels can be closed individually using the ✕ button

## API Endpoints

### OHLC Data
```
GET /api/stocks/:symbol/ohlc?days=30
```
Returns Open, High, Low, Close, and Volume data for the specified stock.

**Response:**
```json
[
  {
    "date": "2020-01-01T00:00:00.000Z",
    "open": 100.50,
    "high": 102.00,
    "low": 99.75,
    "close": 101.25,
    "volume": 1234567
  }
]
```

### Technical Indicators
```
GET /api/stocks/:symbol/indicators?days=90&indicators=sma,rsi,macd
```
Returns calculated technical indicators for the specified stock.

**Query Parameters:**
- `days`: Number of days of historical data (default: 90)
- `indicators`: Comma-separated list of indicators (optional, returns all if omitted)

**Available Indicators:**
- `sma`: Returns sma20, sma50, sma200
- `ema`: Returns ema12, ema26
- `rsi`: Returns 14-period RSI
- `macd`: Returns macd, macdSignal, macdHistogram
- `bollinger`: Returns bollingerUpper, bollingerMiddle, bollingerLower
- `stochastic`: Returns stochasticK, stochasticD
- `atr`: Returns 14-period ATR
- `obv`: Returns On-Balance Volume
- `vwap`: Returns Volume Weighted Average Price

**Response:**
```json
{
  "dates": ["2020-01-01", "2020-01-02", ...],
  "sma20": [null, null, ..., 100.5, 101.2],
  "rsi": [null, ..., 65.4, 58.2],
  "macd": [...],
  "macdSignal": [...],
  "macdHistogram": [...]
}
```

### Market Events
```
GET /api/market/events?days=365&symbol=IBM
```
Returns market events within the specified time period.

**Query Parameters:**
- `days`: Number of days to look back (default: 365)
- `symbol`: Stock symbol for corporate events (optional)

**Response:**
```json
[
  {
    "date": "1987-10-19",
    "type": "crash",
    "title": "Black Monday",
    "description": "Stock market crash",
    "impact": "negative",
    "severity": "major"
  }
]
```

## Technical Implementation

### Backend Modules

#### `helpers/technicalIndicators.js`
Core calculation module for all technical indicators. Implements:
- Moving average calculations (SMA, EMA, WMA)
- Oscillator calculations (RSI, MACD, Stochastic)
- Volatility indicators (ATR, Bollinger Bands)
- Volume indicators (OBV, VWAP)
- OHLC data generation from price history

#### API Endpoints (in `server.js`)
- `/api/stocks/:symbol/ohlc` - OHLC data generation
- `/api/stocks/:symbol/indicators` - Technical indicator calculations
- `/api/market/events` - Market event retrieval

### Frontend Integration

Enhanced `public/views/graphs.ejs` with:
- Indicator control panel
- Multiple chart series overlay
- Oscillator panels
- Event marker annotations
- Auto-refresh functionality

## Educational Value

These indicators help users:
- **Identify Trends**: Using moving averages to see price direction
- **Spot Reversals**: Using RSI and Stochastic to find overbought/oversold conditions
- **Confirm Signals**: Using MACD to validate trend changes
- **Measure Volatility**: Using Bollinger Bands and ATR
- **Understand Context**: Using market event markers to see historical impacts

## Future Enhancements

Possible additions (not yet implemented):
- Fibonacci retracement tools
- Pattern recognition algorithms
- Drawing tools (trend lines, support/resistance)
- Additional chart types (Heikin-Ashi, Point & Figure)
- Alert system for indicator triggers
- Save/load user annotations

## Testing

Unit tests are available in `tests/unit/technicalIndicators.test.js`:
```bash
node tests/unit/technicalIndicators.test.js
```

Tests verify:
- Correct calculation of all indicators
- Proper array lengths and null handling
- Value ranges (e.g., RSI 0-100)
- OHLC data generation

## Performance Considerations

- Indicators are calculated on-demand via API calls
- OHLC data is generated from existing price data (no storage overhead)
- Caching is handled by existing stock price cache system
- Sampling intervals reduce data points for longer time periods

## Browser Compatibility

The charts use Chart.js 4.4.0, which supports:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for different screen sizes
- Touch support for mobile devices (via existing responsive design)

## Retro Terminal Aesthetic

All new UI elements maintain the StockFake retro terminal theme:
- Green monospace text on black background
- Terminal-style borders and controls
- Consistent color scheme across all indicators
