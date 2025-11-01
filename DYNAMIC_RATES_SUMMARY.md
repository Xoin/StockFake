# Dynamic Rates System - Implementation Summary

## Overview
This document describes the dynamic rates generation system that extends tax rates, dividend rates, and inflation data beyond 2024, following the same pattern as the dynamic event generator.

## Implementation Date
November 1, 2025

## Problem Statement
The original implementation had hardcoded data for inflation, dividends, and tax rates that only went up to 2024. The game needed to work dynamically beyond 2024 without requiring manual updates.

## Solution
Created a `dynamicRatesGenerator.js` module that generates deterministic, realistic rates for any future year using seeded random number generation.

## Components

### 1. Dynamic Rates Generator (`helpers/dynamicRatesGenerator.js`)

#### Inflation Rate Generation
- **Base Rate**: 2.5% (Federal Reserve target)
- **Method**: Mean-reverting random walk with volatility
- **Range**: -2% to 15% (prevents unrealistic values)
- **Features**:
  - Gradually reverts from 2024's rate (2.9%) to the 2.5% target
  - Uses Box-Muller transform for normal distribution
  - Deterministic based on year seed

#### Dividend Rate Generation
- **Base Growth**: 3% annual compound growth
- **Volatility**: ±10% random variation per year
- **Features**:
  - Each stock maintains its relative dividend characteristics
  - Grows over time but with realistic year-to-year variation
  - Deterministic per symbol and year

#### Tax Rate Generation
- **Capital Gains**:
  - Short-term: 30% base (range: 20-40%)
  - Long-term: 15% base (range: 10-25%)
  - Dividend: 15% base (range: 10-25%)
  - Change probability: 5% per year
  
- **Wealth Tax**:
  - Rate: 1.0% base (range: 0.5-2.0%)
  - Threshold: $50,000 base, adjusted for inflation
  - Change probability: 3% per year
  - Threshold grows ~2.5% annually with inflation

### 2. Constants Module Updates (`helpers/constants.js`)

Added new exported functions:
- `getInflationRate(year)` - Get inflation rate for any year
- `getAllInflationRates(upToYear)` - Get all rates through a year
- `getDividendRate(symbol, year)` - Get dividend rate for symbol/year
- `getAllDividendRates(year)` - Get all dividend rates for a year
- `getTaxRates(year)` - Get complete tax structure for a year

### 3. Server Integration (`server.js`)

Updated the following functions to use dynamic rates:

#### Dividend Processing
- `checkAndPayDividends()` - Uses year-specific dividend rates
- Applies year-specific dividend tax rates

#### Capital Gains Tax
- All stock sales - Uses year-specific short/long-term rates
- Index fund sales - Uses year-specific rates
- Short position covering - Uses year-specific rates

#### Wealth Tax
- `assessWealthTax()` - Uses dynamic wealth tax rate and threshold
- Threshold adjusts with inflation automatically

#### API Endpoints
- `/api/account` - Returns current inflation rate
- `/api/taxes` - Returns tax rates for requested year

### 4. Bank Page Updates (`public/views/bank.ejs`)

Modified update behavior:
- Updates every 2 seconds
- **Stops updating** when BOTH:
  - Market is closed AND
  - Game is paused
- Continues updating if either condition is false

## Testing

Created comprehensive test suite (`test-dynamic-rates.js`) with 11 tests:

1. ✓ Configuration retrieval
2. ✓ Future inflation rate generation
3. ✓ Historical inflation rate accuracy
4. ✓ Bulk inflation rate retrieval
5. ✓ Future dividend rate generation
6. ✓ Historical dividend rate accuracy
7. ✓ Bulk dividend rate retrieval
8. ✓ Future tax rate generation (including wealth tax)
9. ✓ Deterministic generation verification
10. ✓ Configuration updates
11. ✓ Long-term dividend growth

## Key Features

### Deterministic Generation
- Uses seeded random number generators
- Same year always produces same rates
- Enables consistent gameplay across sessions

### Realistic Behavior
- Inflation mean-reverts to target
- Tax rates change rarely (5% probability)
- Dividends grow with variation
- Wealth tax threshold adjusts for inflation

### Backward Compatibility
- All historical data (1970-2024) remains unchanged
- Only generates dynamic data for years after 2024
- Seamless transition at 2024/2025 boundary

## Example Outputs

### 2025 Tax Rates
```
Short-term Capital Gains: 30%
Long-term Capital Gains: 15%
Dividend Tax: 15%
Wealth Tax: 1.00%
Wealth Tax Threshold: $51,250
```

### 2030 Tax Rates
```
Short-term Capital Gains: 30%
Long-term Capital Gains: 15%
Dividend Tax: 15%
Wealth Tax: 1.00%
Wealth Tax Threshold: $57,985
```

### Dividend Growth (AAPL)
```
2024: $0.25
2025: $0.24
2030: $0.29
2040: $0.43
```

## Configuration Options

The system can be tuned via `DYNAMIC_RATES_CONFIG`:
- `baseInflationRate` - Target inflation rate
- `baseShortTermTaxRate` - Base short-term capital gains rate
- `baseLongTermTaxRate` - Base long-term capital gains rate
- `baseDividendTaxRate` - Base dividend tax rate
- `baseWealthTaxRate` - Base wealth tax rate
- `baseWealthTaxThreshold` - Base wealth tax threshold
- `inflationVolatility` - Inflation variation magnitude
- `taxVolatility` - Tax rate variation magnitude
- `dividendGrowthRate` - Average annual dividend growth
- `dividendVolatility` - Dividend variation magnitude
- `wealthTaxVolatility` - Wealth tax rate variation

## Benefits

1. **No Manual Updates**: Game works indefinitely into the future
2. **Realistic Economics**: Rates follow plausible economic patterns
3. **Consistent**: Same rates every playthrough
4. **Testable**: All behaviors are predictable and verifiable
5. **Configurable**: Easy to adjust economic parameters
6. **Maintainable**: Follows existing pattern from crash events

## Files Modified
- `helpers/dynamicRatesGenerator.js` (new)
- `helpers/constants.js`
- `server.js`
- `public/views/bank.ejs`
- `test-dynamic-rates.js` (new)

## Related Systems
- Similar to `helpers/dynamicEventGenerator.js`
- Integrates with existing tax/dividend/inflation tracking
- Compatible with all trading mechanisms

## Future Enhancements
Potential improvements:
- Economic cycle modeling (booms/recessions)
- Tax policy events tied to market crashes
- Progressive wealth tax brackets
- Regional tax variations
- Corporate tax rates affecting dividends
