# StockFake 📈

A comprehensive stock trading simulation game that uses real historical stock data from 1970 to present day. Experience the evolution of financial markets, from the oil crisis of the 1970s to the dot-com bubble and the 2008 financial crisis, all while building your investment portfolio.

![Portal Screenshot](https://github.com/user-attachments/assets/e5031345-ed90-4ee3-af22-cd771308f9c7)

## 🎮 Overview

StockFake is a single-player financial simulation that lets you trade stocks using authentic historical market data. The game starts on January 1, 1970, and progresses in accelerated time with accurate NYSE trading hours. Make investment decisions, manage your portfolio, take out loans, and navigate through decades of market history.

## ✨ Key Features

### 📊 Realistic Market Simulation
- **Historical Accuracy**: Real stock price data for 200+ companies from 1970-present
- **Dynamic Stock Availability**: Companies become tradeable as they go public (Apple in 1980, Microsoft in 1986, Amazon in 1997, Google in 2004)
- **NYSE Trading Hours**: Markets open 9:30 AM - 4:00 PM EST, Monday-Friday
- **Historical Trade Halts**: Trading suspensions during major events (Black Monday 1987, 9/11, 2008 Crisis, COVID-19)
- **Price Fluctuations**: Realistic ±2% variations between data points
- **Market Crash Simulation**: Dynamic crash events with configurable magnitude, duration, and cascading effects
- **Corporate Events**: Historical mergers, acquisitions, bankruptcies, and going private events (Enron, Lehman Brothers, Dell, etc.)

### 💼 Advanced Trading Features
- **Multiple Order Types**: Buy, sell, short sell, and cover positions
- **Margin Trading**: Leverage up to 2:1 with dynamic margin requirements (70% pre-1974, 50% post-1974)
- **Risk Controls**: Position concentration limits (max 30% in single stock), margin calls, and automatic liquidation
- **Share Availability**: Limited shares based on real public float data
- **Index Funds**: 8 major index funds including S&P 500, NASDAQ-100, Dow Jones, and sector funds

### 💰 Financial Management
- **Loan System**: 10 different lenders from highly trustworthy to extremely shady
- **Dynamic Interest Rates**: 3% to 35% based on credit score and lender
- **Credit Score System**: 300-850 range that adjusts based on payment behavior
- **Loan Terms**: 90 days to 10 years with origination fees and late payment penalties
- **Margin Interest**: Daily compound interest on margin debt

### 🏛️ Economic Indicators & Federal Reserve Policy
- **Historical Data (1970-2024)**: Real Federal Funds Rate, QE programs, GDP growth, unemployment
- **Dynamic Generation (2025+)**: Realistic economic modeling prevents excessive future growth
- **Market Impact**: Interest rates, QE/QT, GDP, and inflation affect stock returns
- **Business Cycles**: Periodic recessions (~12% annual probability) and expansions
- **Fed Policy Response**: Rate adjustments based on inflation targeting
- **Long-term Realism**: Constrained returns (~7% annualized) prevent unrealistic valuations

See [ECONOMIC_INDICATORS_SUMMARY.md](ECONOMIC_INDICATORS_SUMMARY.md) for detailed documentation.

### 📈 Portfolio Management
- **Dividend Tracking**: Quarterly dividend payments with automatic tax calculation
- **Tax Center**: Comprehensive tax reporting for capital gains, dividends, and short sales
- **Transaction History**: Complete audit trail of all trades and financial activities
- **Shareholder Influence**: Track your voting power in companies
- **Inflation Tracking**: CPI-based inflation rates showing real purchasing power

### 📰 Immersive Experience
- **Historical News**: Major events limited to significant historical milestones
- **Email System**: Notifications for dividends, margin calls, loan updates, and trading opportunities
- **Company Information**: Detailed profiles with products, intellectual property, financials, and employee counts
- **Era-Appropriate Fees**: Trading commissions that decreased over time (from $9.99 in 1970s to $0 after 2019)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/Xoin/StockFake.git
cd StockFake

# Install dependencies
npm install

# Start the server
npm start

# Run tests (optional)
npm test
```

The application will be available at `http://localhost:3000`

### First Steps
1. Start with $10,000 cash and a credit score of 750
2. Explore the trading platform to see available stocks
3. Use time controls to speed up or slow down the simulation
4. Buy your first stocks during market hours
5. Monitor your portfolio in the Bank Account section

## 🎯 Game Controls

### Time Management
- **⏯ Pause/Resume**: Stop or continue time progression
- **🐌 Slow (1s = 1min)**: Detailed gameplay for careful decision making
- **⚡ Normal (1s = 1hr)**: Standard pace for moderate progression  
- **🚀 Fast (1s = 1day)**: Rapid advancement through time

### Trading Rules
- Markets are only open 9:30 AM - 4:00 PM EST, Monday-Friday
- 5-minute cooldown between trades for the same stock
- Trading halted during historical market crises
- Share purchases limited by available public float

## 📸 Screenshots

### Portal - Main Hub
Start your journey here with access to all features
![Portal](https://github.com/user-attachments/assets/e5031345-ed90-4ee3-af22-cd771308f9c7)

### Trading Platform - Buy & Sell Stocks
View real-time stock prices with share availability and historical data
![Trading Platform](https://github.com/user-attachments/assets/bc594d3d-6228-411f-a523-87ad6ca01f89)

### Bank Account - Portfolio Management
Track your cash, stocks, transactions, dividends, and fees
![Bank Account](https://github.com/user-attachments/assets/12c3412b-4e52-40b5-ab46-cee7c796434c)

### Loans - Credit Management
Apply for loans from various lenders with different terms and trustworthiness
![Loans](https://github.com/user-attachments/assets/b10d049b-6bc2-48e9-97ee-a90edca2c012)

### News - Historical Events
Follow major historical events as they unfold
![News](https://github.com/user-attachments/assets/849178b1-32eb-4340-95be-45b8b6f9b721)

### Email - Notifications
Receive important updates about dividends, loans, and market opportunities
![Email](https://github.com/user-attachments/assets/73b14b01-54d1-460c-97c1-871de8040804)

### Market Graphs - Price Charts
Visualize stock performance and market trends
![Market Graphs](https://github.com/user-attachments/assets/97403253-5fe9-4372-95e9-ea44e9d19c69)

### Tax Center - Annual Tax Reports
Review capital gains, dividends, and tax obligations by year
![Tax Center](https://github.com/user-attachments/assets/519215f3-66e4-446f-9713-304cdf054b92)

### Company Information - Research
Deep dive into company profiles with financials and product history
![Company Info](https://github.com/user-attachments/assets/279263b8-b6f3-4096-8d27-8be53113a3ae)

## 🏦 Features In Detail

### Stock Trading
- **200+ Companies**: From IBM and IBM in 1970 to modern tech giants
- **Multiple Sectors**: Technology, Energy, Finance, Healthcare, Retail, Consumer Goods, Industrials, and more
- **Historical Availability**: Stocks appear as companies go public or gain relevance
- **Share Limits**: Realistic trading based on public float and market capitalization

### Index Funds
- **S&P 500 Index Fund**: Track the 500 largest US companies
- **NASDAQ-100 Index Fund**: Tech-focused top 100 non-financial stocks
- **Dow Jones Industrial Average**: 30 blue-chip companies
- **Russell 2000 Small Cap**: Small-cap stock exposure
- **Sector Funds**: Energy, Technology, Financial Services, Healthcare
- **Expense Ratios**: 0.15% - 0.40% annually, deducted on sale
- **Dynamic Rebalancing**: Automatic rebalancing based on market-cap changes
  - **Periodic Rebalancing**: Quarterly, monthly, semi-annual, or annual schedules
  - **Threshold-Based Rebalancing**: Triggered when constituent weights drift beyond configured thresholds
  - **Market-Cap Weighted**: Constituents weighted by estimated market capitalization
  - **Historical Tracking**: Complete history of all rebalancing events and weight changes
  - **Configurable Strategies**: Customize rebalancing frequency and drift thresholds per fund

### Margin Trading
- **Leverage**: Buy stocks with borrowed money (up to 2:1)
- **Historical Regulations**: Margin requirements reflect actual regulatory changes (Regulation T in 1974)
- **Margin Calls**: Automatic when maintenance margin falls below 30%
- **Grace Period**: 5 days to meet margin call before forced liquidation
- **Daily Interest**: Compounding margin interest at 8% annual rate

### Loan System
10 loan companies with varying trustworthiness:
1. **Prime National Bank** (10/10 trust): 3% APR, strict requirements
2. **Federal Credit Services** (9/10 trust): 4.5% APR, excellent rates
3. **Trust Bank of America** (8/10 trust): 6% APR, reliable
4. **National Credit Union** (7/10 trust): 7.2% APR, member-focused
5. **Community Savings** (6/10 trust): 9% APR, local bank
6. **Regional Bank Personal Loans** (6/10 trust): 8.8% APR, traditional
7. **Quick Approval Finance** (4/10 trust): 12% APR, fast processing
8. **Easy Money Lending** (3/10 trust): 18% APR, minimal requirements
9. **Cash Now Services** (2/10 trust): 24% APR, predatory terms
10. **Fast Cash Loans** (1/10 trust): 28-35% APR, extremely high risk

**Smart Emergency Decision Making**:
- Intelligently decides whether to take loans or sell assets when cash goes negative
- Considers portfolio value, existing debt, credit score, and shortfall size
- Prevents debt spirals by prioritizing asset sales when appropriate
- Protects small portfolios from complete liquidation
- See [LOAN_VS_SELL_LOGIC.md](LOAN_VS_SELL_LOGIC.md) for details

### Credit Score System
- **Range**: 300 (Poor) to 850 (Excellent)
- **Starting Score**: 750 (Very Good)
- **Positive Actions**: On-time loan payments, paying off loans
- **Negative Actions**: Late payments (30+ days), missed payments, defaults
- **Impact**: Affects loan availability and interest rates

### Tax System
- **Short-term Capital Gains**: 30% tax on holdings < 1 year
- **Long-term Capital Gains**: 15% tax on holdings ≥ 1 year
- **Dividend Tax**: 15% on all dividend income
- **FIFO Method**: First-in, first-out for cost basis calculation
- **Annual Reports**: Comprehensive tax breakdown by year

### Fee Structure (Historical Evolution)
- **1970s**: $9.99 + 0.1% per trade
- **1975+**: $7.99 (after May Day deregulation)
- **1990+**: $4.99 (discount brokers emerge)
- **2000+**: $2.99 (online trading boom)
- **2013+**: $0.99 (low-cost brokers)
- **2019+**: $0.00 (commission-free era)

### Market Crash Simulation 💥
- **Historical Scenarios**: Black Monday 1987, Dot-Com Crash 2000, Financial Crisis 2008, COVID-19 Crash 2020, Flash Crash 2010
- **Hypothetical Scenarios**: Tech bubble burst, banking crisis, energy crisis, geopolitical shock
- **Dynamic Event Generation**: Automatic crash events for dates beyond historical data (post-2024)
- **Configurable Probabilities**: Adjust crash frequency, severity distribution, and sector targeting
- **Dynamic Impact**: Market-wide and sector-specific price impacts with configurable severity
- **Cascading Effects**: Multi-stage impact propagation over time with recovery patterns
- **Market State Changes**: Volatility multipliers (2.5x-10x), liquidity reduction (30%-90%), sentiment shifts
- **Custom Events**: Create custom crash scenarios with configurable parameters
- **Analytics**: Real-time market state monitoring and event history tracking
- **API Integration**: Full REST API for triggering, managing, and analyzing crash events

See [CRASH_SIMULATION.md](CRASH_SIMULATION.md) for detailed documentation.

### Corporate Events & Company Lifecycle 🏢
- **Historical Events**: 13+ major corporate events from 1970-2022
- **Bankruptcies**: Penn Central (1970), Enron (2001), Lehman Brothers (2008), GM (2009), FTX (2022)
- **Mergers & Acquisitions**: NeXT→Apple (1995), Pixar→Disney (2006), LinkedIn→Microsoft (2016), Whole Foods→Amazon (2017)
- **Going Private**: Dell (2013) leveraged buyout
- **Automatic Processing**: Events trigger automatically at historical dates
- **Portfolio Impact**: Positions automatically liquidated or converted based on event type
- **Cash Payouts**: Receive cash for acquisitions and going private events
- **Stock Exchanges**: Automatic conversion to acquiring company stock in stock-for-stock mergers
- **Email Notifications**: Detailed notifications about corporate actions affecting your holdings
- **Company Status Tracking**: Monitor which companies are active, bankrupt, acquired, or private
- **Dynamic Financials**: Procedurally generated financial data for new companies

See [CORPORATE_EVENTS_SUMMARY.md](CORPORATE_EVENTS_SUMMARY.md) for detailed documentation.

## 📚 API Documentation

### Time & Market Status
- `GET /api/time` - Current game time, market status, and trade halt information
- `POST /api/time/pause` - Toggle pause state
- `POST /api/time/speed` - Set time multiplier (60-86400)

### Stock Information
- `GET /api/stocks` - List all available stocks with prices and availability
- `GET /api/stocks/:symbol` - Detailed stock information
- `GET /api/stocks/:symbol/history` - Historical price data for charts
- `POST /api/trade` - Execute trades (buy, sell, short, cover)

### Index Funds
- `GET /api/indexfunds` - Available index funds with current prices
- `GET /api/indexfunds/:symbol` - Detailed fund information and constituents
- `GET /api/indexfunds/:symbol/history` - Historical fund prices
- `POST /api/indexfunds/trade` - Buy or sell index fund shares
- `GET /api/indexfunds/:symbol/rebalancing` - Get rebalancing history for a specific fund
- `GET /api/indexfunds/:symbol/weights` - Get current constituent weights and market-cap data
- `GET /api/indexfunds/:symbol/config` - Get rebalancing configuration (strategy, frequency, thresholds)
- `POST /api/indexfunds/:symbol/config` - Update rebalancing configuration
- `POST /api/indexfunds/:symbol/rebalance` - Manually trigger rebalancing for a fund
- `GET /api/rebalancing/events` - Get all rebalancing events across all funds

### Companies
- `GET /api/companies` - List all available companies
- `GET /api/companies/:symbol` - Detailed company profile and financials

### Account & Portfolio
- `GET /api/account` - Complete account summary including:
  - Cash balance and credit score
  - Stock portfolio and index fund holdings
  - Short positions and margin account
  - Transactions, dividends, taxes, and fees
  - Loan history and active loans
  - Risk metrics and margin call status

### Loans
- `GET /api/loans/companies` - Available lenders based on credit score
- `GET /api/loans/active` - Current active loans
- `POST /api/loans/take` - Apply for and receive a loan
- `POST /api/loans/pay` - Make loan payment

### Margin Trading
- `POST /api/margin/toggle` - Enable or disable margin trading
- `POST /api/margin/pay` - Pay down margin debt
- `POST /api/margin/calculate` - Calculate margin requirements for potential trade

### Taxes & Reporting
- `GET /api/taxes` - Tax summary and breakdown (query: ?year=YYYY)

### News & Communications
- `GET /api/news` - Historical news events up to current time
- `GET /api/emails` - Email notifications and updates

### Market Crash Simulation
- `GET /api/crash/scenarios` - List all available crash scenarios (historical and hypothetical)
- `GET /api/crash/scenarios/:id` - Get detailed scenario configuration
- `POST /api/crash/trigger` - Trigger a crash event (scenarioId or customConfig)
- `GET /api/crash/active` - Get currently active crash events
- `POST /api/crash/deactivate/:eventId` - Manually deactivate a crash event
- `GET /api/crash/analytics` - Get crash analytics and market state
- `GET /api/crash/market-state` - Get current market state (volatility, liquidity, sentiment)
- `GET /api/crash/history` - Get crash event history (query: ?limit=50)
- `POST /api/crash/custom` - Create custom crash scenario template

### Dynamic Event Generation
- `GET /api/crash/dynamic/config` - Get dynamic event generation configuration
- `POST /api/crash/dynamic/config` - Update dynamic event generation configuration
- `GET /api/crash/dynamic/events` - Get all dynamically generated events
- `POST /api/crash/dynamic/generate` - Manually trigger dynamic event generation

### Corporate Events
- `GET /api/corporate-events` - List all corporate events (mergers, bankruptcies, IPOs, going private)
- `GET /api/corporate-events/pending` - List pending events that haven't occurred yet
- `GET /api/companies/:symbol/status` - Check company status (active, bankrupt, acquired, private)
- `GET /api/companies/:symbol/financials` - Get company financial data over time

### Economic Indicators
- `GET /api/economic/indicators/:year` - Get economic data (Fed funds rate, QE, GDP, unemployment)
- `GET /api/economic/historical` - Get all historical economic data (1970-2024)
- `GET /api/economic/impact/:year` - Calculate market impact from economic conditions
- `GET /api/economic/config` - Get economic modeling configuration
- `POST /api/economic/config` - Update economic modeling parameters


## 🗄️ Database Architecture

StockFake uses SQLite for data persistence with the following schema:

### Core Tables
- **game_state**: Game time, pause state, time multiplier, inflation tracking
- **user_account**: Cash balance, credit score
- **portfolio**: Stock holdings by symbol
- **index_fund_holdings**: Index fund shares
- **short_positions**: Short sale positions with borrow details
- **margin_account**: Margin balance, interest rate, status

### Index Fund Rebalancing
- **index_fund_constituents**: Historical constituent weights and market-cap data over time
- **index_fund_rebalancing_events**: Complete history of rebalancing events with details
- **index_fund_rebalancing_config**: Per-fund rebalancing strategy and configuration

### Market Crash Simulation
- **market_crash_events**: Active and historical crash events with full configuration
- **market_state**: Current market state (volatility, liquidity, sentiment)

### Corporate Events
- **corporate_events**: Historical and future corporate events (mergers, bankruptcies, IPOs, going private)
- **company_status**: Tracks company availability status (active, bankrupt, acquired, private, delisted)
- **company_financials**: Dynamic financial data for companies (revenue, net income, assets, employees, patents)

### Transaction Tracking
- **transactions**: Complete trading history
- **purchase_history**: Cost basis tracking for tax calculations
- **dividends**: Dividend payment records
- **taxes**: Tax payment history
- **fees**: All fees charged

### Loans & Credit
- **loans**: Active and historical loans
- **loan_history**: Loan activities and payment records
- **margin_calls**: Margin call tracking

### Risk Management
- **risk_controls**: Leverage limits, position size limits
- **shareholder_influence**: Voting power tracking
- **last_trade_time**: Cooldown enforcement

## 🎲 Game Progression

### Starting Out (1970-1975)
- Start with $10,000 in cash
- 120+ stocks available (IBM, HP, Exxon, GM, etc.)
- High trading fees ($9.99 per trade)
- 70% initial margin requirement
- Major events: Oil crisis, stagflation

### Growth Era (1976-1990)
- More companies become public
- Apple IPO (1980), Microsoft IPO (1986)
- Trading fees decrease
- Black Monday crash (1987)
- Introduction of monthly account fees

### Tech Boom (1991-2000)
- Internet companies emerge
- Amazon (1997), Google (2004)
- Lower trading fees ($2.99)
- Dot-com bubble
- 50% margin requirement established

### Modern Era (2001-Present)
- Full roster of 200+ companies
- 2008 Financial Crisis
- Commission-free trading (2019+)
- COVID-19 pandemic (2020)
- All index funds available

## 🛠️ Technical Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite with better-sqlite3
- **Frontend**: Vanilla JavaScript with retro terminal aesthetic
- **Data**: Historical stock prices, company information, economic indicators

## 📦 Project Structure

```
StockFake/
├── server.js                 # Main Express server
├── database.js               # SQLite database schema and queries
├── helpers/                  # Modular helper functions
│   ├── gameState.js         # Time and game state management
│   ├── userAccount.js       # Account database operations
│   ├── indexFundRebalancing.js # Index fund rebalancing engine
│   └── constants.js         # Trading constants and rates
├── data/                     # Game data modules
│   ├── stocks.js            # Stock price data
│   ├── companies.js         # Company information
│   ├── index-funds.js       # Index fund definitions
│   ├── loan-companies.js    # Loan provider information
│   ├── news.js              # Historical news events
│   ├── emails.js            # Email generation
│   ├── trade-halts.js       # Market suspension events
│   └── share-availability.js # Public float tracking
├── tests/                    # Modular test suite
│   ├── run-tests.js         # Test runner
│   ├── helpers/             # Test utilities
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── simulation/          # Historical market simulations
├── public/                   # Frontend HTML/CSS/JS
│   ├── index.html           # Portal page
│   ├── trading.html         # Trading platform
│   ├── bank.html            # Bank account
│   ├── loans.html           # Loan management
│   ├── taxes.html           # Tax center
│   ├── graphs.html          # Market charts
│   ├── news.html            # News feed
│   ├── email.html           # Email inbox
│   └── company.html         # Company profiles
├── TESTING.md                # Testing guide
└── LOAN_VS_SELL_LOGIC.md    # Loan decision documentation
```

## 🎯 Tips & Strategies

### For Beginners
- Start by buying stable blue-chip stocks (IBM, GE, Exxon)
- Don't invest everything at once - diversify over time
- Avoid margin trading until you understand the risks
- Pay attention to dividend-paying stocks for passive income

### For Intermediate Players
- Time the market using historical knowledge (buy before bull markets)
- Use index funds for easy diversification
- Take advantage of lower trading fees in later years
- Build credit score with small loans paid on time

### For Advanced Players
- Master margin trading for maximum gains (and risks)
- Short sell stocks before market crashes
- Use loans strategically to increase buying power
- Optimize tax efficiency with long-term holdings

### Common Pitfalls
- **Over-leveraging**: Margin calls can force liquidation at the worst time
- **Concentration Risk**: Don't put more than 30% in any single stock
- **Predatory Loans**: Avoid high-interest lenders (>20% APR)
- **Trading Fees**: In early years, excessive trading erodes profits
- **Ignoring Taxes**: Capital gains can significantly reduce net profit

## 🧪 Testing

StockFake includes a comprehensive test suite to validate game logic and ensure realistic behavior.

### Running Tests
```bash
npm test
```

### Test Categories
- **Unit Tests**: Validate individual functions and decision logic
- **Integration Tests**: Verify components work correctly together
- **Simulation Tests**: Run full market scenarios across historical periods

### What's Tested
✓ Stock price movements during historical events  
✓ Portfolio management and rebalancing  
✓ Loan vs sell decision logic  
✓ Dividend accumulation over time  
✓ Market crash responses  
✓ Long-term wealth building (20+ year simulations)  
✓ Tax calculations  
✓ Credit score management  

### Test Coverage
The test suite includes simulations of:
- 1970s Oil Crisis
- 1980s Bull Market
- 1987 Black Monday
- Dot-com Bubble (1998-2002)
- 2008 Financial Crisis
- Long-term buy-and-hold strategies

See [TESTING.md](TESTING.md) for detailed testing documentation.

## 🔮 Future Enhancements

- Multi-user support with leaderboards
- Options trading (calls and puts)
- Bonds and treasury securities
- Cryptocurrency (post-2009)
- ~~Economic indicators and Federal Reserve policy~~ ✅ **Implemented**
- ~~Corporate actions (stock splits, mergers, acquisitions)~~ ✅ **Implemented**
- Spin-offs and stock distribution events
- Dynamic IPO generation for new companies beyond 2025
- International stocks and forex trading
- Advanced charting with technical indicators
- Portfolio analysis and backtesting tools

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:
- Additional historical stock data
- Bug fixes and performance improvements
- New features and game mechanics
- UI/UX enhancements
- Documentation improvements

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Historical stock data compiled from various public sources
- Company information based on historical records and public filings
- Economic data from Federal Reserve and Bureau of Labor Statistics
- Inspired by classic trading simulations and financial education tools

## 📧 Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check existing issues for known problems
- Review the API documentation above

---

**Happy Trading! 📈💰**

*Remember: This is a simulation for educational and entertainment purposes. Past performance does not guarantee future results, even in a game!*
