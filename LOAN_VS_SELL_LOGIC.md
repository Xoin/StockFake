# Loan vs Sell Decision Logic

## Overview

When a player's cash balance goes negative, the game must decide whether to automatically take out a loan or sell assets to cover the shortfall. This document describes the intelligent decision-making logic implemented to make realistic financial decisions.

## The Problem

**Original Behavior (Bug):**
The game would always prefer taking loans over selling assets. This led to:
- Accumulating debt that could never be repaid
- Ignoring valuable portfolios that could easily cover shortfalls
- Poor financial decisions during market crashes
- Players getting trapped in debt spirals

## The Solution

**New Behavior (Fixed):**
The game now makes smart decisions based on multiple financial factors:
1. Portfolio value relative to the shortfall
2. Existing loan debt levels
3. Player's credit score
4. Size of the negative balance

## Decision Algorithm

The `shouldSellAssetsInsteadOfLoan()` function evaluates the following criteria in order:

### 1. No Portfolio Available
```
IF portfolio value = 0 THEN
  Decision: TAKE LOAN (no assets to sell)
```
If there are no stocks to sell, the only option is to take a loan (if available).

### 2. Already Heavily in Debt
```
IF total loan debt > 50% of portfolio value THEN
  Decision: SELL ASSETS (avoid more debt)
```
If existing loans exceed half the portfolio value, the player is over-leveraged. Taking more loans would be financially irresponsible.

**Example:**
- Portfolio value: $20,000
- Existing loans: $12,000 (60% of portfolio)
- New shortfall: $2,000
- **Decision: SELL** - Already too much debt

### 3. Large Portfolio Relative to Debt
```
IF portfolio value > 2x negative balance THEN
  Decision: SELL ASSETS (easily affordable)
```
If the portfolio is worth more than twice the shortfall, selling a small portion is the smart choice.

**Example:**
- Portfolio value: $15,000
- Negative balance: $5,000
- Ratio: 3:1 (portfolio is 3x the debt)
- **Decision: SELL** - Portfolio can easily cover it

### 4. Poor Credit Score
```
IF credit score < 600 THEN
  Decision: SELL ASSETS (credit too low for good loans)
```
With a credit score below 600, loan terms will be predatory. Better to sell assets.

**Example:**
- Credit score: 550
- Portfolio value: $10,000
- Negative balance: $3,000
- **Decision: SELL** - Avoid high-interest loans

### 5. Small Debt Relative to Portfolio
```
IF negative balance < 10% of portfolio value THEN
  Decision: SELL ASSETS (minor liquidation)
```
If the shortfall is less than 10% of portfolio value, it's a small amount to sell.

**Example:**
- Portfolio value: $50,000
- Negative balance: $3,000 (6% of portfolio)
- **Decision: SELL** - Minimal impact on portfolio

### 6. Default Case
```
ELSE
  Decision: TAKE LOAN (protect small portfolio)
```
If none of the above apply, take a loan to avoid completely wiping out a small portfolio.

**Example:**
- Portfolio value: $3,000
- Negative balance: $2,500
- **Decision: LOAN** - Selling would wipe out 83% of portfolio

## Configuration Constants

These constants in `server.js` control the decision thresholds:

```javascript
// Decision thresholds (in shouldSellAssetsInsteadOfLoan function)
const DEBT_TO_PORTFOLIO_THRESHOLD = 0.5;  // 50% - heavily in debt
const PORTFOLIO_TO_DEBT_RATIO = 2.0;      // 2x - large portfolio
const POOR_CREDIT_THRESHOLD = 600;        // Below this, avoid loans
const SMALL_DEBT_THRESHOLD = 0.1;         // 10% - minor liquidation

// Emergency action constants
const EMERGENCY_LOAN_BUFFER = 1.5;        // 50% buffer for loans
const EMERGENCY_ACTION_DAYS = 3;          // Days before action
const LIQUIDATION_BUFFER_MULTIPLIER = 1.3; // 30% buffer for fees/taxes
```

## Example Scenarios

### Scenario A: Market Crash - Large Portfolio
**Situation:**
- Cash: -$5,000 (margin call after crash)
- Portfolio: $17,000 (IBM, GE, XOM stocks)
- Existing loans: $0
- Credit score: 750

**Analysis:**
- Portfolio is 3.4x the debt ($17,000 / $5,000)
- No existing debt
- Condition #3 triggered: Portfolio > 2x debt

**Decision: SELL ASSETS**
- Sell a small portion of portfolio to cover the shortfall
- Preserve financial flexibility
- Avoid new debt

### Scenario B: New Investor - Small Portfolio
**Situation:**
- Cash: -$3,000 (unexpected expense)
- Portfolio: $500 (10 shares of IBM)
- Existing loans: $0
- Credit score: 750

**Analysis:**
- Debt is 6x portfolio size ($3,000 / $500)
- None of the "sell" conditions are met
- Default case applies

**Decision: TAKE LOAN**
- Selling would wipe out the entire portfolio
- Good credit score means reasonable loan terms
- Protect investment position

### Scenario C: Over-Leveraged - 2008 Crisis
**Situation:**
- Cash: -$2,000
- Portfolio: $25,000 (banking stocks)
- Existing loans: $15,000 (60% of portfolio)
- Credit score: 680

**Analysis:**
- Existing debt is 60% of portfolio
- Condition #2 triggered: Debt > 50% of portfolio

**Decision: SELL ASSETS**
- Already heavily in debt
- Cannot afford more loans
- Must reduce leverage

### Scenario D: Poor Credit - Need Cash
**Situation:**
- Cash: -$2,000
- Portfolio: $8,000
- Existing loans: $1,000
- Credit score: 550

**Analysis:**
- Credit score below 600
- Condition #4 triggered: Poor credit

**Decision: SELL ASSETS**
- Credit too low for reasonable loan terms
- Would face predatory interest rates (>20% APR)
- Better to liquidate some assets

## Implementation Details

### Location in Code
- Function: `shouldSellAssetsInsteadOfLoan(negativeAmount)`
- File: `server.js`
- Lines: ~1595-1654

### Integration Points
Called by `processNegativeBalance()` when:
- Cash balance is negative
- At least 3 days have passed with negative balance
- Every 3 days thereafter while negative

### Logging
The function logs its decision for transparency:
```
Decision: SELL - Portfolio ($15000.00) can easily cover debt ($5000.00)
Decision: LOAN - Portfolio too small to liquidate ($2000.00 vs debt $1800.00)
```

## Testing

The decision logic is validated by:

1. **Unit Tests** (`tests/unit/loan-vs-sell-logic.test.js`)
   - 6 test cases covering all decision paths
   - Validates correct decisions for different scenarios

2. **Integration Tests** (`tests/integration/server-loan-logic.test.js`)
   - Verifies implementation in server.js
   - Checks all conditions are present and correctly coded

3. **Simulation Tests** (`tests/simulation/loan-decision-scenarios.test.js`)
   - Tests with historical market data
   - Validates realistic behavior during actual market events

## Benefits of This Approach

✓ **Realistic Financial Management** - Makes decisions similar to a financial advisor
✓ **Prevents Debt Spirals** - Avoids accumulating unmanageable debt
✓ **Context-Aware** - Considers multiple factors, not just one
✓ **Protects Players** - Prevents bad financial decisions
✓ **Flexible** - Can be adjusted by changing threshold constants
✓ **Transparent** - Logs explain why each decision was made

## Future Enhancements

Potential improvements:
- Consider current market volatility in decision
- Factor in upcoming dividend payments
- Account for tax implications of selling
- Consider portfolio diversification
- Analyze loan interest rates vs expected returns
- Implement graduated selling (sell smallest positions first)
