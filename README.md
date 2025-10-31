# StockFake

A stock trading game that uses historical stock data. The server starts in 1970 and progresses in real-time with accurate stock market opening and closing hours.

## Features

- **Time Simulation**: Game starts on January 1, 1970, and progresses in accelerated time
- **Stock Market Hours**: Realistic NYSE trading hours (9:30 AM - 4:00 PM, Mon-Fri)
- **Historical Stock Data**: Real historical data for 200+ major companies from 1970 to current day
  - Stocks become available as they become publicly traded or relevant
  - 120+ stocks available in 1970, expanding to 200+ by 2020
  - Includes companies across all major sectors: Technology, Energy, Finance, Healthcare, Retail, and more
- **Dynamic Share Availability**: Limited shares available for each stock based on public float
  - Realistic ownership tracking
  - Purchase limits based on available shares
- **Minor Price Fluctuations**: Stock prices include realistic ±2% fluctuations between data points
- **Company Information Pages**: Detailed company profiles including:
  - Products and services with introduction dates
  - Intellectual property (patents and trademarks)
  - Financial information (revenue, net income, assets)
  - Employee headcount over time
  - Company history and headquarters
- **Historical Trade Halts**: Trading suspensions during major market crises
  - Black Monday (1987)
  - September 11, 2001
  - 2008 Financial Crisis
  - COVID-19 Pandemic (2020)
  - And more historical events
- **Loan System**: Borrow money from various lenders
  - 10 loan companies ranging from extremely shady to highly trustworthy
  - Interest rates from 3% to 35% based on credit score and lender
  - Credit score system (300-850) that adjusts based on payment behavior
  - Late payment penalties and default consequences
  - Term lengths from 90 days to 10 years
- **Six Simulated Websites**:
  - 🏦 **Bank**: View your cash balance, stock portfolio, and credit score
  - 📈 **Trading Platform**: Buy and sell stocks during market hours, with share availability shown
  - 💰 **Loans**: Apply for loans, manage payments, and track credit score
  - 🏢 **Company Pages**: View detailed information about individual companies
  - 📊 **Market Graphs**: Charts and market trends
  - 📰 **News**: Historical news limited to major events (Apollo 13, Nixon resigns, Oil Crisis, etc.)
  - 📧 **Email**: Notifications and messages including loan status updates

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Time Controls

- **Pause/Resume**: Pause or resume the game time progression
- **Speed Controls**:
  - Slow: 1 real second = 1 game minute
  - Normal: 1 real second = 1 game hour
  - Fast: 1 real second = 1 game day

## Game Rules

- Starting balance: $10,000
- Starting credit score: 750 (Fair)
- Trading only available during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
- Trading halted during historical market crises
- Stock prices update in real-time with historical data
- Share purchases limited by available float
- Major historical news events appear as time progresses
- Stocks become available as their companies emerge or become publicly traded
- Loan interest accrues daily
- Late payments (30+ days) result in penalties and credit score decreases
- 3 missed payments result in loan default

## Stock Data

The game includes historical price data for 200+ major companies across multiple sectors:

- **Technology**: IBM, Apple, Microsoft, Intel, Oracle, Cisco, Amazon, Google, and more
- **Energy**: Exxon, Chevron, BP, Shell, and other major oil companies
- **Finance**: JPMorgan, Bank of America, Goldman Sachs, and major banks
- **Healthcare**: Johnson & Johnson, Pfizer, Merck, and pharmaceutical companies
- **Retail**: Walmart, Target, Home Depot, Costco, and major retailers
- **Consumer Goods**: Procter & Gamble, Coca-Cola, PepsiCo, and consumer brands
- **Industrials**: General Electric, Boeing, Caterpillar, and manufacturing companies
- **And many more sectors including Automotive, Telecom, Media, Utilities, etc.

Stock availability changes over time - for example, Apple becomes available in 1980, Microsoft in 1986, Amazon in 1997, and Google in 2004.

## API Endpoints

### Time & Market
- `GET /api/time` - Get current game time, market status, and trade halt information
- `POST /api/time/pause` - Toggle pause
- `POST /api/time/speed` - Set time multiplier

### Stocks & Trading
- `GET /api/stocks` - Get all stock prices with share availability
- `GET /api/stocks/:symbol` - Get specific stock price and availability details
- `GET /api/stocks/:symbol/history` - Get historical prices for charting
- `POST /api/trade` - Place a trade (buy/sell/short/cover)

### Companies & Information
- `GET /api/companies` - Get all available companies
- `GET /api/companies/:symbol` - Get detailed company information
- `GET /api/news` - Get historical news up to current time

### Account & Loans
- `GET /api/account` - Get user account info including credit score and loans
- `GET /api/loans/companies` - Get available loan companies based on credit score
- `GET /api/loans/active` - Get active loans
- `POST /api/loans/take` - Apply for and take out a loan
- `POST /api/loans/pay` - Make a payment on a loan

### Communications
- `GET /api/emails` - Get email notifications including loan updates

## Screenshots

### Portal
![Portal](https://github.com/user-attachments/assets/97403253-5fe9-4372-95e9-ea44e9d19c69)

### Trading Platform
![Trading](https://github.com/user-attachments/assets/279263b8-b6f3-4096-8d27-8be53113a3ae)

### Bank Account
![Bank](https://github.com/user-attachments/assets/519215f3-66e4-446f-9713-304cdf054b92)

### News
![News](https://github.com/user-attachments/assets/849178b1-32eb-4340-95be-45b8b6f9b721)

### Email
![Email](https://github.com/user-attachments/assets/73b14b01-54d1-460c-97c1-871de8040804)
