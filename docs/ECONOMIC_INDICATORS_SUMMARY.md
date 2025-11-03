# Economic Indicators & Federal Reserve Policy

## Overview

StockFake now incorporates realistic economic indicators and Federal Reserve monetary policy to prevent excessive stock market growth after 2025. This ensures that future stock prices remain grounded in economic reality, influenced by interest rates, quantitative easing, GDP growth, unemployment, and inflation.

## Problem Statement

Before this implementation, stock prices generated for years beyond 2024 (where historical data ends) could grow without economic constraints, leading to unrealistic portfolio valuations. The market would continue growing at high rates indefinitely without consideration of:
- Federal Reserve interest rate policy
- Quantitative easing or tightening
- Economic recessions and business cycles
- GDP growth constraints
- Inflation impacts

## Solution

The new system models economic conditions and their impact on stock market returns using:

1. **Historical Economic Data (1970-2024)**
   - Federal Funds Rate (Fed's benchmark interest rate)
   - Quantitative Easing periods and magnitudes
   - GDP growth rates
   - Unemployment rates

2. **Dynamic Economic Generation (2025+)**
   - Fed policy responds to inflation (Taylor Rule-inspired)
   - Business cycles with periodic recessions (~12% annual probability)
   - Mean-reverting economic indicators
   - Coordinated QE/QT based on interest rate levels

3. **Market Impact Calculation**
   - Higher interest rates → slower stock growth
   - Quantitative easing → market boost
   - Strong GDP growth → better corporate earnings
   - Low unemployment → economic strength
   - Extreme inflation → market headwinds

## Implementation Details

### Economic Indicators Module

**File**: `data/economic-indicators.js`

The module provides:
- Historical data (1970-2024) for Fed funds rate, QE, GDP, and unemployment
- Dynamic generation algorithms for years beyond 2024
- Market impact calculation function
- Configurable parameters for economic modeling

### Stock Price Integration

**File**: `data/stocks.js`

Modified `getAnnualGrowthRate()` function to:
1. Calculate base market return from business cycles
2. Add sector-specific performance variations
3. **NEW**: Apply economic impact adjustment for years > 2024
4. **NEW**: Gradually reduce maximum return cap over time
5. Cap annual returns at reasonable bounds

### Key Formula

For years after 2024, the annual stock return is adjusted by:

```
Market Impact = 
  - 1.0% per 1% Fed Funds Rate above neutral (3.5%)
  + 3.0% per $1T of Quantitative Easing
  + 1.0% per 1% GDP growth above trend (2.0%)
  + 0.8% per 1% unemployment below natural rate (4.5%)
  - 0.5% per 1% inflation deviation from target (>3%)
```

Total market impact is capped at -15% to +10%.

## Testing Results

### Long-term Growth Simulation (2024-2050)

**Without Economic Constraints** (hypothetical):
- Annualized return: ~15-20%
- Final value (26 years): $5M+ from $100K
- Unrealistic exponential growth

**With Economic Constraints** (implemented):
- Annualized return: ~7%
- Final value (26 years): $572K from $100K
- Realistic long-term equity returns

### Sample Economic Scenarios

**2025** (Base Case):
- Fed Funds Rate: 4.85%
- QE/QT: -$477B (tightening)
- GDP Growth: 2.6%
- Unemployment: 3.8%
- Inflation: 2.1%
- **Market Impact**: -1.6% adjustment to growth

**2030** (Long-term):
- Fed Funds Rate: 4.02%
- QE/QT: -$476B
- GDP Growth: 2.9%
- Unemployment: 4.0%
- Inflation: 4.1%
- **Market Impact**: -1.2% adjustment to growth

## Configuration

The economic model can be tuned via `getConfiguration()` and `updateConfiguration()`:

```javascript
const economicIndicators = require('./data/economic-indicators');

// Get current configuration
const config = economicIndicators.getConfiguration();

// Modify parameters
economicIndicators.updateConfiguration({
  baseFedFundsRate: 3.0,        // Target neutral rate
  inflationTargetRate: 2.5,      // Fed's inflation target
  recessionProbability: 0.10,    // Annual recession chance
  fedResponseStrength: 0.6       // How aggressively Fed responds
});
```

## API Usage

### Get Economic Indicators for a Year

```javascript
const economicIndicators = require('./data/economic-indicators');
const dynamicRates = require('./helpers/dynamicRatesGenerator');

// For year 2028
const inflationRate = dynamicRates.generateInflationRate(2028);
const economics = economicIndicators.getEconomicIndicators(2028, inflationRate);

console.log(economics);
// {
//   year: 2028,
//   fedFundsRate: 4.35,
//   quantitativeEasing: -581,
//   gdpGrowth: 1.1,
//   unemploymentRate: 4.8,
//   inflationRate: 2.9
// }
```

### Calculate Market Impact

```javascript
const impact = economicIndicators.calculateMarketImpact(economics);
console.log(`Market impact: ${(impact * 100).toFixed(1)}%`);
// Market impact: -3.7%
```

### Get Historical Data

```javascript
const historical = economicIndicators.getHistoricalData();
console.log(historical.fedFundsRate[2008]); // 1.92
console.log(historical.gdpGrowth[2009]);     // -2.5
```

## Economic Cycles Modeled

### Business Cycles
- Average 8-year cycle between recessions
- 12% annual probability of recession
- Recession duration: ~1.5 years average

### Federal Reserve Policy
- Responds to inflation deviations from 2% target
- Gradual rate adjustments (30% per year toward target)
- Coordinates QE with rate levels

### Sector Rotation
- 5-year sector performance cycles
- Technology outperforms early in cycles
- Energy and materials perform better late cycle
- Utilities remain defensive throughout

## Testing

Run the economic indicators test suite:

```bash
node test-economic-indicators.js
```

This validates:
- Historical data loading (1970-2024)
- Dynamic generation (2025+)
- Market impact calculations
- Stock growth rate constraints
- Long-term portfolio simulations

## Impact on Gameplay

### Before 2025
Stock prices continue to use historical data and existing generation logic. No changes to gameplay.

### After 2025
Players will experience:
1. **More Realistic Returns**: Average 7% annualized instead of 15%+
2. **Economic Cycles**: Periodic recessions and bear markets
3. **Fed Policy Impact**: Rate hikes slow growth, QE boosts it
4. **Inflation Concerns**: High inflation leads to market headwinds
5. **Strategic Timing**: Economic indicators matter for entry/exit

### Strategy Implications

**Recommended Strategies**:
- Buy during recessions when Fed cuts rates
- Reduce exposure when Fed aggressively raises rates
- Favor defensive sectors (utilities, consumer staples) during late cycle
- Growth stocks perform better with low rates and QE

**Economic Indicators to Watch**:
- Rising Fed funds rate → market headwinds
- Quantitative easing → market tailwinds  
- High unemployment → potential recession
- GDP growth above 3% → expansion phase
- Inflation above 4% → Fed likely to tighten

## Data Sources

Historical economic data sourced from:
- **Federal Reserve Economic Data (FRED)**: Fed funds rate, unemployment
- **Bureau of Economic Analysis (BEA)**: GDP growth rates
- **Federal Reserve**: Quantitative easing programs and asset purchases
- **Bureau of Labor Statistics (BLS)**: Inflation (CPI) data

## Future Enhancements

Potential additions:
1. **API Endpoints**: Expose economic indicators via REST API
2. **News Events**: Economic announcements (FOMC meetings, jobs reports)
3. **Yield Curve**: Treasury yields affecting stock valuations
4. **Earnings Sensitivity**: Corporate earnings linked to GDP
5. **Foreign Policy**: International trade impacts
6. **Fiscal Policy**: Government spending and taxation effects

## Technical Notes

### Deterministic Generation
All future economic data uses seeded random number generation, ensuring:
- Same game date always produces same economic conditions
- Reproducible gameplay across sessions
- Consistent testing and debugging

### Performance
- Economic indicators calculated on-demand
- No database storage required for future data
- Minimal performance impact (<1ms per calculation)

### Backward Compatibility
- Historical stock prices (pre-2025) unchanged
- Existing save games unaffected
- All current tests pass without modification

## Conclusion

The economic indicators system ensures that StockFake remains realistic and challenging even as players progress beyond historical data. By modeling Federal Reserve policy, business cycles, and macroeconomic conditions, the game provides an authentic long-term investment simulation that reflects real-world market dynamics.

**Annualized Returns Summary**:
- 1970-2024 (Historical): ~10% average
- 2025-2050 (Constrained): ~7% average
- Prevents unrealistic exponential growth
- Encourages strategic economic timing

The result is a more engaging, educational, and realistic financial simulation.
