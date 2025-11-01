/**
 * Demonstration script showing how inflation rates work across the 2024 boundary
 * This demonstrates the linking of historical and dynamic data
 */

const constants = require('./helpers/constants');

console.log('=== Inflation Rate Demonstration ===\n');
console.log('This demonstration shows how inflation rates are linked between');
console.log('historical data (1970-2024) and dynamically generated data (2025+)\n');

console.log('--- Historical Inflation Rates (Sample) ---');
console.log('Year | Rate  | Source');
console.log('-----|-------|----------');
const historicalYears = [1970, 1980, 1990, 2000, 2010, 2020, 2024];
for (const year of historicalYears) {
  const rate = constants.inflationRates[year];
  console.log(`${year} | ${rate.toFixed(1)}% | Historical`);
}

console.log('\n--- Transition at 2024/2025 Boundary ---');
console.log('Year | Rate  | Source');
console.log('-----|-------|----------');
const transitionYears = [2023, 2024, 2025, 2026];
for (const year of transitionYears) {
  const rate = constants.inflationRates[year];
  const source = year <= 2024 ? 'Historical' : 'Dynamic';
  console.log(`${year} | ${rate.toFixed(1)}% | ${source}`);
}

console.log('\n--- Future Inflation Rates (Dynamic) ---');
console.log('Year | Rate  | Source');
console.log('-----|-------|----------');
const futureYears = [2025, 2030, 2035, 2040, 2050];
for (const year of futureYears) {
  const rate = constants.inflationRates[year];
  console.log(`${year} | ${rate.toFixed(1)}% | Dynamic`);
}

console.log('\n--- Dividend Rates (Sample Stocks) ---');
console.log('Symbol | Rate   | Description');
console.log('-------|--------|----------------------------------');
const stocks = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'IBM', name: 'IBM' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'XOM', name: 'Exxon Mobil' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' }
];

for (const stock of stocks) {
  const rate = constants.dividendRates[stock.symbol];
  console.log(`${stock.symbol.padEnd(6)} | $${rate.toFixed(2).padStart(5)} | ${stock.name}`);
}

console.log('\n--- Dynamic Dividend Growth (Example: AAPL) ---');
console.log('Year | Dividend | Growth');
console.log('-----|----------|-------');
const dividendYears = [2024, 2025, 2030, 2035, 2040];
let previousDiv = null;
for (const year of dividendYears) {
  const div = constants.getDividendRate('AAPL', year);
  let growth = '';
  if (previousDiv !== null) {
    const growthPct = ((div - previousDiv) / previousDiv * 100).toFixed(1);
    growth = `${growthPct > 0 ? '+' : ''}${growthPct}%`;
  }
  console.log(`${year} | $${div.toFixed(2).padStart(5)}    | ${growth}`);
  previousDiv = div;
}

console.log('\n--- Access Methods Comparison ---');
console.log('\nBoth methods return the same values:');
const testYear = 2027;
const proxyAccess = constants.inflationRates[testYear];
const functionAccess = constants.getInflationRate(testYear);
console.log(`  Proxy access:    inflationRates[${testYear}] = ${proxyAccess}%`);
console.log(`  Function access: getInflationRate(${testYear}) = ${functionAccess}%`);
console.log(`  Match: ${proxyAccess === functionAccess ? '✓' : '✗'}`);

console.log('\n--- Summary ---');
console.log('✓ Historical data (1970-2024): Exact values from historical records');
console.log('✓ Dynamic data (2025+): Deterministic generation based on economic models');
console.log('✓ Seamless transition: No discontinuity at the 2024/2025 boundary');
console.log('✓ Backward compatible: Existing code continues to work');
console.log('✓ Future-proof: Game can run indefinitely without manual updates');
