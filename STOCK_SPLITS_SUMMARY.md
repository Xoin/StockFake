# Stock Split Implementation Summary

## Overview
This implementation adds comprehensive stock splitting functionality to prevent snowballing stock prices that were reaching absurd levels (e.g., $798,546 for Texas Instruments).

## Problem Solved
- **Before**: Stock prices could reach hundreds of thousands of dollars
- **After**: Maximum stock price is $395.72 (well below the $450 threshold)
- **Impact**: 615 stock splits applied across 220 companies in historical data

## Features Implemented

### 1. Historical Stock Splits
- Integrated into data generation process (`data/generate-stock-data.js`)
- Era-based thresholds:
  - 1970-1990: $150
  - 1991-2010: $200
  - 2011-2024: $300
  - 2025+: Dynamic (starts at $450, grows 3% annually)
- Deterministic split ratios (2:1, 3:1, 4:1, 5:1, 7:1, 10:1)
- Stored in `historical-stock-data.json` splits section

### 2. Dynamic Thresholds (2025+)
- Threshold = 450 × (1.03)^(year - 2025), rounded to nearest $50
- Examples:
  - 2025: $450
  - 2030: $500
  - 2050: $950
  - 2075: $1,950
  - 2100: $4,150
- Prevents excessive splitting in far future while maintaining stock accessibility

### 3. Runtime Split Detection
- Periodic check every 30 minutes (game time)
- Only processes once per day to avoid overhead
- Automatically triggered when stocks exceed threshold
- Handles both regular holdings and short positions

### 4. Portfolio Management
- Automatic share multiplication on splits
- Purchase history adjustment (share count and cost basis)
- Short position adjustment (shares and borrow price)
- Transaction records for audit trail
- Preserves total portfolio value

### 5. User Notifications
- Email notifications sent when splits occur
- Includes split details (ratio, before/after prices)
- Educational content about stock splits
- Indicates portfolio impact

### 6. API Endpoints
- `GET /api/splits` - Recent stock splits (default 50)
- `GET /api/splits/:symbol` - Splits for specific stock
- `GET /api/splits/threshold` - Current year's threshold

## Database Schema

### stock_splits table
```sql
CREATE TABLE stock_splits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  split_date TEXT NOT NULL,
  split_ratio INTEGER NOT NULL,
  price_before_split REAL NOT NULL,
  price_after_split REAL NOT NULL,
  applied_to_portfolio INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, split_date)
)
```

### stock_split_check_state table
```sql
CREATE TABLE stock_split_check_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_check_date TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

### emails table
```sql
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  date TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  spam INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

## Code Quality

### Code Review Feedback Addressed
1. ✅ Optimized database module loading
2. ✅ Fixed share calculation in transactions
3. ✅ Improved date comparison efficiency
4. ✅ Reduced check frequency (60s → 30min)
5. ✅ Removed unnecessary shebang

### Testing
- Comprehensive test suite (`test-stock-splits.js`)
- Tests threshold calculation across all eras
- Tests split ratio determination
- Tests split detection logic
- Tests email generation
- All tests passing ✓

## Performance Considerations

### Optimization Strategies
1. **Daily checking**: Splits only checked once per 24 hours
2. **Efficient date comparison**: Uses timestamp math instead of string splitting
3. **Cached DB access**: Database module loaded once, reused via helper
4. **Reduced interval**: 30-minute checks instead of 60-second checks
5. **Batch processing**: All stocks checked in single pass

### Expected Impact
- Minimal CPU overhead during normal gameplay
- Database writes only when splits actually occur
- No impact on regular stock price calculations
- Email generation is asynchronous

## Future Enhancements

Potential improvements for future consideration:
1. Reverse splits for penny stocks
2. Stock dividend tracking (similar to splits)
3. Split history visualization in UI
4. Notifications via in-game popup
5. Historical split calendar view
6. Split announcement pre-notification (T-7 days)

## Security Considerations

All database operations use prepared statements to prevent SQL injection. Email content is sanitized and does not include user-generated input. No external API calls are made for split processing.

## Conclusion

The stock split system successfully prevents price snowballing while maintaining historical accuracy and providing a realistic trading experience. The dynamic threshold system ensures the game remains playable far into the future without requiring manual intervention.
