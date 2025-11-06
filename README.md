# StockFake 📈

**A Testing Ground for AI Agent Development**

StockFake is a comprehensive stock trading simulation built as a practical testbed for developing and refining AI coding agents. This project demonstrates how AI agents can construct, enhance, and maintain a complex full-stack application through iterative development.

![Portal Screenshot](https://github.com/user-attachments/assets/e5031345-ed90-4ee3-af22-cd771308f9c7)

## 🤖 Purpose: AI Agent Development Platform

This project serves as a **real-world environment for testing AI agent capabilities** in:
- Complex feature implementation
- Code architecture and organization
- Documentation generation
- Test-driven development
- Iterative refinement and debugging
- Full-stack integration

The simulation itself provides a rich domain with multiple interconnected systems, making it an ideal proving ground for AI agents to demonstrate their ability to understand requirements, write code, and maintain software.

## 🎮 The Simulation

StockFake is a single-player financial simulation that lets you trade stocks using authentic historical market data from 1970 to present day. Experience market history including the oil crisis, Black Monday 1987, the dot-com bubble, 2008 financial crisis, and the COVID-19 crash—all with accelerated time and realistic trading mechanics.

## ✨ Key Features

- **Historical Accuracy**: Real stock data for 200+ companies (1970-present)
- **Cryptocurrency Trading**: Bitcoin, Ethereum, and major altcoins (2009-present, 24/7 trading)
- **Realistic Trading**: NYSE hours, margin trading, short selling, index funds
- **Economic Simulation**: Federal Reserve policy, GDP, unemployment, inflation
- **Market Events**: Crashes, corporate actions, trading halts, blockchain events
- **Financial Management**: Loans, credit scoring, tax calculations
- **Portfolio Tools**: Dividends, staking rewards, transaction history, risk metrics

**See full feature list in [docs/README_FULL.md](docs/README_FULL.md)**

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

## 🎯 Quick Start Guide

1. Start with $10,000 cash and a 750 credit score
2. Browse available stocks in the Trading Platform
3. Use time controls (Slow/Normal/Fast) to progress through time
4. Buy stocks during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
5. Monitor your portfolio in the Bank Account section
6. Navigate through decades of market history

## 📚 Comprehensive Documentation

All documentation has been organized in the `docs/` folder:

### Core Documentation
- **[API.md](docs/API.md)** - Complete API reference
- **[DATABASE.md](docs/DATABASE.md)** - Database schema and architecture
- **[GAME_STATE.md](docs/GAME_STATE.md)** - Game state and time management
- **[TESTING.md](docs/TESTING.md)** - Testing guide and best practices
- **[README_FULL.md](docs/README_FULL.md)** - Full detailed README with all features

### Feature Documentation
- **[CRASH_SIMULATION.md](docs/CRASH_SIMULATION.md)** - Market crash system
- **[CORPORATE_EVENTS_SUMMARY.md](docs/CORPORATE_EVENTS_SUMMARY.md)** - Mergers, bankruptcies, IPOs
- **[CRYPTOCURRENCY.md](docs/CRYPTOCURRENCY.md)** - Cryptocurrency trading and blockchain events
- **[ECONOMIC_INDICATORS_SUMMARY.md](docs/ECONOMIC_INDICATORS_SUMMARY.md)** - Fed policy and economic data
- **[LOAN_VS_SELL_LOGIC.md](docs/LOAN_VS_SELL_LOGIC.md)** - Smart financial decision-making
- **[REBALANCING_SUMMARY.md](docs/REBALANCING_SUMMARY.md)** - Index fund rebalancing
- **[STOCK_SPLITS_SUMMARY.md](docs/STOCK_SPLITS_SUMMARY.md)** - Stock split handling

### Project Information
- **[FUTURE_ENHANCEMENTS.md](FUTURE_ENHANCEMENTS.md)** - Detailed roadmap and planned features
- **[IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)** - Development history
- **[BENCHMARK_RESULTS.md](docs/BENCHMARK_RESULTS.md)** - Performance metrics

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/bonds.test.js
```

The project uses **Jest** as its testing framework. The test suite includes unit tests, integration tests, and full market simulations covering major historical periods. See [docs/TESTING.md](docs/TESTING.md) for complete testing documentation and best practices.

## 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

### Portal - Main Hub
![Portal](https://github.com/user-attachments/assets/e5031345-ed90-4ee3-af22-cd771308f9c7)

### Trading Platform
![Trading Platform](https://github.com/user-attachments/assets/bc594d3d-6228-411f-a523-87ad6ca01f89)

### Bank Account
![Bank Account](https://github.com/user-attachments/assets/12c3412b-4e52-40b5-ab46-cee7c796434c)

### Loans Management
![Loans](https://github.com/user-attachments/assets/b10d049b-6bc2-48e9-97ee-a90edca2c012)

See [docs/README_FULL.md](docs/README_FULL.md) for all screenshots.

</details>

## 🛠️ Technical Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite with better-sqlite3
- **Frontend**: Vanilla JavaScript with retro terminal aesthetic
- **Data**: Historical stock prices, company information, economic indicators

See [docs/DATABASE.md](docs/DATABASE.md) for complete database schema documentation.

## 🤝 Contributing

Contributions are welcome! This project serves as a testing ground for AI agent capabilities, and we're interested in:
- AI agent-generated features and improvements
- Documentation enhancements
- Bug fixes
- Additional historical data
- UI/UX improvements

Please feel free to submit pull requests or open issues.

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Historical stock data compiled from various public sources
- Company information based on historical records and public filings
- Economic data from Federal Reserve and Bureau of Labor Statistics
- This project was built and enhanced through iterative AI agent development

---

**Note**: StockFake is a simulation for educational and entertainment purposes. It demonstrates AI agent capabilities in building complex applications while providing an engaging way to learn about financial markets and investing principles.
