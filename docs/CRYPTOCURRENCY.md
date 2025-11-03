# Cryptocurrency Trading

StockFake now supports cryptocurrency trading, allowing you to trade Bitcoin, Ethereum, and other major cryptocurrencies from their respective launch dates onward.

## Overview

The cryptocurrency feature introduces digital asset trading with:
- **24/7 Trading**: Unlike stocks, crypto markets never close
- **High Volatility**: Prices can swing ±20% or more in a single day
- **Historical Accuracy**: Real price anchors from Bitcoin's creation in 2009 to present
- **Blockchain Events**: Major events like Bitcoin halvings, the Ethereum Merge, and market crashes
- **Staking Rewards**: Earn passive income on proof-of-stake cryptocurrencies

## Supported Cryptocurrencies

### Major Cryptocurrencies

| Symbol | Name | Launch Date | Max Supply | Staking |
|--------|------|-------------|------------|---------|
| BTC | Bitcoin | 2009-01-03 | 21,000,000 | No |
| ETH | Ethereum | 2015-07-30 | Unlimited | Yes (4% APR) |
| LTC | Litecoin | 2011-10-07 | 84,000,000 | No |
| XRP | Ripple | 2012-06-02 | 100,000,000,000 | No |
| BCH | Bitcoin Cash | 2017-08-01 | 21,000,000 | No |
| ADA | Cardano | 2017-10-01 | 45,000,000,000 | Yes (5% APR) |
| DOGE | Dogecoin | 2013-12-06 | Unlimited | No |
| DOT | Polkadot | 2020-08-18 | Unlimited | Yes (10% APR) |
| MATIC | Polygon | 2019-04-26 | 10,000,000,000 | Yes (8% APR) |
| SOL | Solana | 2020-03-16 | Unlimited | Yes (7% APR) |

### Availability

Cryptocurrencies are only available after their launch date:
- **Bitcoin (BTC)**: Available from 2009 onwards
- **Ethereum (ETH)**: Available from 2015 onwards
- Other cryptocurrencies become available at their respective launch dates

## Features

### 1. 24/7 Trading

Unlike traditional stocks that trade only during NYSE hours (9:30 AM - 4:00 PM EST), cryptocurrency markets are **always open**. You can buy and sell crypto at any time, day or night, weekdays or weekends.

### 2. Trading Fees

All cryptocurrency trades have a **0.1% trading fee** (configurable per cryptocurrency):
- Buying 1 BTC at $50,000 = $50 fee
- Selling 10 ETH at $3,000 each = $30 fee

### 3. High Volatility

Cryptocurrencies have significantly higher volatility than stocks:
- **Bitcoin**: 5% base daily volatility
- **Ethereum**: 6% base daily volatility
- **Altcoins**: 7-12% base daily volatility
- **Meme coins (DOGE)**: 12% base daily volatility

Prices can change dramatically in short periods, especially during:
- Blockchain events (halvings, upgrades)
- Market crashes (crypto winters)
- Major exchange incidents (Mt. Gox, FTX)

### 4. Blockchain Events

The simulation includes major historical blockchain events:

#### Bitcoin Halvings
Bitcoin's block reward halves approximately every 4 years:
- **2012-11-28**: First halving (50 → 25 BTC)
- **2016-07-09**: Second halving (25 → 12.5 BTC)
- **2020-05-11**: Third halving (12.5 → 6.25 BTC)
- **2024-04-19**: Fourth halving (6.25 → 3.125 BTC)

Halvings typically have a positive impact on price due to reduced supply.

#### Ethereum Events
- **2022-09-15**: The Merge (transition to Proof of Stake)
- **2020-12-01**: Beacon Chain launch (staking begins)

#### Forks
- **2017-08-01**: Bitcoin Cash fork from Bitcoin

#### Exchange Incidents
- **2014-02-24**: Mt. Gox hack (850,000 BTC stolen)
- **2022-11-08**: FTX exchange collapse

#### Regulatory Events
- **2021-09-24**: China bans all cryptocurrency transactions

### 5. Crypto Market Crashes

The simulation models major cryptocurrency crashes:

#### 2018 Crypto Winter
- **Period**: January 2018 - December 2018
- **Severity**: Severe (prices drop to ~30% of peak)
- **Impact**: BTC, ETH, LTC, XRP, BCH, ADA

After the massive bull run of 2017, the crypto market experienced a prolonged bear market with prices declining 70-90% from their peaks.

#### 2022 Luna/Terra Collapse
- **Period**: May 9-13, 2022
- **Severity**: Severe (40% drop in days)
- **Impact**: BTC, ETH, ADA, DOT, MATIC, SOL

The algorithmic stablecoin UST de-pegged from the US dollar, causing a catastrophic collapse of the Terra ecosystem and triggering a broader market crash.

#### 2022 Crypto Winter
- **Period**: June 2022 - January 2023
- **Severity**: Moderate (50% decline)
- **Impact**: Most major cryptocurrencies

Following the Terra collapse and culminating in the FTX implosion, crypto markets entered another prolonged bear market.

### 6. Staking Rewards

Some cryptocurrencies support staking, where you can earn passive income by holding coins:

| Crypto | Annual Rate | Start Date | Notes |
|--------|-------------|------------|-------|
| ETH | 4% APR | 2020-12-01 | After Beacon Chain launch |
| ADA | 5% APR | 2020-07-29 | Shelley mainnet |
| DOT | 10% APR | 2020-08-18 | Launch |
| MATIC | 8% APR | 2020-05-30 | After mainnet launch |
| SOL | 7% APR | 2020-03-16 | Launch |

**How to Claim Staking Rewards:**
1. Navigate to the Crypto page
2. Click "Claim Staking Rewards" button
3. Rewards are automatically calculated based on time held and added to your holdings

Rewards compound - they're added to your holdings and generate future rewards.

### 7. Capital Gains Tax

When selling cryptocurrency, you pay **20% capital gains tax** on profits:
- Buy 1 BTC at $30,000
- Sell 1 BTC at $50,000
- Gain: $20,000
- Tax: $4,000 (20% of gain)
- Net proceeds: $16,000

Losses are not tax-deductible in the simulation.

## Trading Guide

### Buying Cryptocurrency

1. Navigate to **₿ Crypto** from the portal or navigation menu
2. Select a cryptocurrency from the available list
3. Enter the quantity you want to purchase
4. Review the total cost (including 0.1% trading fee)
5. Click **BUY**

**Requirements:**
- Sufficient cash balance
- Cryptocurrency must be available (after its launch date)

### Selling Cryptocurrency

1. Navigate to **₿ Crypto** page
2. Select the cryptocurrency you want to sell
3. Enter the quantity to sell
4. Review proceeds (minus trading fee and capital gains tax)
5. Click **SELL**

**Requirements:**
- You must own the cryptocurrency you're selling
- Quantity must be ≤ your holdings

### Viewing Holdings

Your crypto holdings are displayed on:
- **Crypto page**: Detailed list with current prices and values
- **Bank Account page**: Included in total portfolio value

Each holding shows:
- Symbol and name
- Quantity owned
- Current price
- Total value
- Whether staking is available

## API Endpoints

### Get All Cryptocurrencies
```
GET /api/crypto
```
Returns all available cryptocurrencies at the current game time with current prices.

### Get Specific Cryptocurrency
```
GET /api/crypto/:symbol
```
Returns details for a specific cryptocurrency (BTC, ETH, etc.).

### Get Holdings
```
GET /api/crypto/holdings/all
```
Returns all user cryptocurrency holdings with current values.

### Buy Cryptocurrency
```
POST /api/crypto/buy
Body: { "symbol": "BTC", "quantity": 0.5 }
```

### Sell Cryptocurrency
```
POST /api/crypto/sell
Body: { "symbol": "ETH", "quantity": 2 }
```

### Process Staking Rewards
```
POST /api/crypto/process-staking
```
Calculates and distributes staking rewards for all eligible holdings.

### Get Blockchain Events
```
GET /api/crypto/events
```
Returns recent blockchain events and active market crashes.

## Database Schema

### crypto_holdings
Stores user cryptocurrency holdings:
- `symbol`: Cryptocurrency symbol (BTC, ETH, etc.)
- `quantity`: Amount owned (supports fractional amounts)
- `last_staking_reward_date`: Date of last staking reward claim
- `created_at`, `updated_at`: Timestamps

### crypto_transactions
Records all cryptocurrency trades:
- `symbol`: Cryptocurrency traded
- `transaction_type`: 'buy' or 'sell'
- `quantity`: Amount traded
- `price_per_unit`: Price at time of trade
- `trading_fee`: Fee charged
- `total`: Total cost/proceeds
- `transaction_date`: When the trade occurred

### staking_rewards
Tracks staking income:
- `symbol`: Cryptocurrency that generated rewards
- `quantity`: Amount of rewards received
- `reward_date`: When rewards were claimed
- `price_at_reward`: Price when claimed
- `total_value`: Dollar value of rewards

## Educational Value

The cryptocurrency feature teaches:

1. **Alternative Asset Classes**: Understanding digital assets vs traditional securities
2. **Extreme Volatility**: Managing high-risk, high-reward investments
3. **Technology Disruption**: How blockchain technology impacts finance
4. **Regulatory Uncertainty**: Government reactions to decentralized currencies
5. **Market Cycles**: Boom and bust cycles in emerging markets
6. **DeFi Concepts**: Staking, proof-of-stake, and passive income
7. **Risk Management**: Balancing volatile assets in a portfolio

## Historical Milestones

Playing through different time periods, you'll experience:

- **2009**: Bitcoin launches at fractions of a cent
- **2011**: First major Bitcoin price spike to $31
- **2013**: Bitcoin crosses $1,000 for the first time
- **2014**: Mt. Gox collapse shakes the market
- **2015**: Ethereum launches
- **2017**: Massive bull run, Bitcoin reaches $20k
- **2018**: Crypto winter begins
- **2020**: DeFi summer and COVID recovery
- **2021**: Bitcoin hits $69k, Ethereum over $4,800
- **2022**: Luna/Terra collapse and crypto winter
- **2024**: Bitcoin ETFs approved, new all-time highs

## Tips for Trading Crypto

1. **Start Small**: Cryptocurrencies are extremely volatile - don't invest more than you can afford to lose
2. **Dollar-Cost Average**: Buy gradually rather than all at once
3. **Understand Timing**: Crypto launched in 2009 - don't expect to trade it in 1970!
4. **Watch Events**: Major events (halvings, forks) often impact prices
5. **Diversify**: Don't put all funds in one cryptocurrency
6. **Claim Staking Rewards**: Remember to periodically claim rewards on stakeable coins
7. **Consider Taxes**: 20% capital gains tax applies to profits
8. **24/7 Market**: Unlike stocks, you can trade anytime - but volatility never sleeps!

## Implementation Details

The cryptocurrency system is built with:

- **Data File**: `/data/cryptocurrencies.js` - Cryptocurrency definitions, events, and crashes
- **Manager**: `/helpers/cryptoManager.js` - Price calculation, staking, and trading logic
- **Database**: Dedicated tables for holdings, transactions, and staking rewards
- **API**: RESTful endpoints in `server.js` for all crypto operations
- **UI**: `/public/views/crypto.ejs` - Terminal-themed trading interface

Prices are interpolated between historical anchor points using logarithmic interpolation, with volatility factors and event impacts applied dynamically.
