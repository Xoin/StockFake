# StockFake

A stock trading game that uses historical stock data. The server starts in 1970 and progresses in real-time with accurate stock market opening and closing hours.

## Features

- **Time Simulation**: Game starts on January 1, 1970, and progresses in accelerated time
- **Stock Market Hours**: Realistic NYSE trading hours (9:30 AM - 4:00 PM, Mon-Fri)
- **Historical Stock Data**: Real historical data for 200+ major companies from 1970 to current day
  - Stocks become available as they become publicly traded or relevant
  - 120+ stocks available in 1970, expanding to 200+ by 2020
  - Includes companies across all major sectors: Technology, Energy, Finance, Healthcare, Retail, and more
- **Minor Price Fluctuations**: Stock prices include realistic ±2% fluctuations between data points
- **Company Information Pages**: Detailed company profiles including:
  - Products and services with introduction dates
  - Intellectual property (patents and trademarks)
  - Financial information (revenue, net income, assets)
  - Employee headcount over time
  - Company history and headquarters
- **Five Simulated Websites**:
  - 🏦 **Bank**: View your cash balance and stock portfolio
  - 📈 **Trading Platform**: Buy and sell stocks during market hours, with links to company details
  - 🏢 **Company Pages**: View detailed information about individual companies
  - 📊 **Market Graphs**: Charts and market trends
  - 📰 **News**: Historical news limited to major events (Apollo 13, Nixon resigns, Oil Crisis, etc.)
  - 📧 **Email**: Notifications and messages

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
- Trading only available during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
- Stock prices update in real-time with historical data
- Major historical news events appear as time progresses
- Stocks become available as their companies emerge or become publicly traded

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

- `GET /api/time` - Get current game time and market status
- `GET /api/stocks` - Get all stock prices
- `GET /api/stocks/:symbol` - Get specific stock price
- `GET /api/companies` - Get all available companies
- `GET /api/companies/:symbol` - Get detailed company information
- `GET /api/news` - Get historical news up to current time
- `GET /api/account` - Get user account info
- `POST /api/trade` - Place a trade (buy/sell)
- `POST /api/time/pause` - Toggle pause
- `POST /api/time/speed` - Set time multiplier

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
