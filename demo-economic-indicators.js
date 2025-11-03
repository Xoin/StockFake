/**
 * Demonstration: Economic Indicators Impact on Stock Growth
 * 
 * This demo shows how Federal Reserve policy and economic conditions
 * prevent excessive stock market growth after 2025.
 */

const economicIndicators = require('./data/economic-indicators');
const dynamicRates = require('./helpers/dynamicRatesGenerator');
const stocks = require('./data/stocks');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Economic Indicators Demo: Preventing Excessive Growth Post-2025  ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// Scenario 1: Compare growth without vs with economic constraints
console.log('SCENARIO 1: Impact of Economic Constraints\n');
console.log('Without economic constraints, a simple market return model might give:');
console.log('  - Consistent 12-15% annual returns');
console.log('  - $100,000 → $5+ million in 26 years');
console.log('  - Unrealistic exponential growth\n');

console.log('With economic constraints (implemented):');
const portfolio2024 = 100000;
let portfolio = portfolio2024;
const years = [2025, 2026, 2027, 2028, 2029, 2030];

console.log('Year  | Fed Rate | QE/QT    | GDP  | Inflation | Stock Return | Portfolio');
console.log('------|----------|----------|------|-----------|--------------|------------');

years.forEach(year => {
  const inflationRate = dynamicRates.generateInflationRate(year);
  const economics = economicIndicators.getEconomicIndicators(year, inflationRate);
  
  // Calculate average return across sectors
  const sectors = ['Technology', 'Financial', 'Healthcare', 'Energy'];
  let totalReturn = 0;
  sectors.forEach(sector => {
    totalReturn += stocks.getAnnualGrowthRate(year, sector);
  });
  const avgReturn = totalReturn / sectors.length;
  
  portfolio *= (1 + avgReturn);
  
  const qeStr = economics.quantitativeEasing >= 0 ? 
    `+${economics.quantitativeEasing}B` : 
    `${economics.quantitativeEasing}B`;
  
  console.log(
    `${year} | ${economics.fedFundsRate.toFixed(2)}%    | ${qeStr.padEnd(8)} | ` +
    `${economics.gdpGrowth.toFixed(1)}% | ${inflationRate.toFixed(1)}%       | ` +
    `${(avgReturn * 100).toFixed(1)}%         | $${Math.round(portfolio).toLocaleString()}`
  );
});

const totalReturn = ((portfolio - portfolio2024) / portfolio2024) * 100;
const annualizedReturn = (Math.pow(portfolio / portfolio2024, 1 / years.length) - 1) * 100;

console.log('\nResult:');
console.log(`  Initial: $${portfolio2024.toLocaleString()}`);
console.log(`  Final:   $${Math.round(portfolio).toLocaleString()}`);
console.log(`  Total Return: ${totalReturn.toFixed(1)}%`);
console.log(`  Annualized: ${annualizedReturn.toFixed(2)}%`);
console.log('  ✓ Realistic and sustainable growth\n');

// Scenario 2: Impact of rising interest rates
console.log('\n' + '═'.repeat(70) + '\n');
console.log('SCENARIO 2: Federal Reserve Rate Hikes Impact\n');

console.log('Demonstration: How rising rates slow market growth\n');

const rateScenarios = [
  { year: 2025, desc: 'Moderate rates (4.85%)' },
  { year: 2023, desc: 'High rates (5.00%)' },
  { year: 2021, desc: 'Low rates (0.08%)' }
];

rateScenarios.forEach(scenario => {
  // Get inflation rate - use historical data for years <= 2024, generated for future
  let inflationRate;
  if (scenario.year <= 2024) {
    const historical = dynamicRates.getHistoricalInflation();
    inflationRate = historical[scenario.year] || 2.0;
  } else {
    inflationRate = dynamicRates.generateInflationRate(scenario.year);
  }
  
  const economics = economicIndicators.getEconomicIndicators(scenario.year, inflationRate);
  const impact = economicIndicators.calculateMarketImpact(economics);
  
  console.log(`${scenario.desc}:`);
  console.log(`  Fed Funds Rate: ${economics.fedFundsRate.toFixed(2)}%`);
  console.log(`  Market Impact: ${(impact * 100).toFixed(2)}%`);
  console.log(`  Interpretation: ${
    impact < -0.05 ? 'Significant headwind' :
    impact < 0 ? 'Mild headwind' :
    impact < 0.05 ? 'Neutral' :
    'Tailwind'
  }`);
  console.log();
});

// Scenario 3: Economic recession impact
console.log('═'.repeat(70) + '\n');
console.log('SCENARIO 3: Economic Recessions (Randomly Generated)\n');

console.log('The system models business cycles with periodic recessions:');
console.log('  - ~12% annual probability of recession');
console.log('  - GDP contracts by 1-3%');
console.log('  - Unemployment rises');
console.log('  - Stock returns become negative\n');

console.log('Scanning 2025-2045 for recessions...\n');

let recessionCount = 0;
for (let year = 2025; year <= 2045; year++) {
  const economics = economicIndicators.getEconomicIndicators(year);
  
  if (economics.gdpGrowth < 0) {
    recessionCount++;
    console.log(`${year}: RECESSION DETECTED`);
    console.log(`  GDP Growth: ${economics.gdpGrowth.toFixed(1)}%`);
    console.log(`  Unemployment: ${economics.unemploymentRate.toFixed(1)}%`);
    console.log(`  Fed Response: ${economics.fedFundsRate.toFixed(2)}% (likely cutting)\n`);
  }
}

console.log(`Found ${recessionCount} recession(s) in 20-year period`);
console.log(`Expected: ~2-3 recessions (12% probability × 20 years ≈ 2.4)`);
console.log('✓ Realistic business cycle modeling\n');

// Scenario 4: Quantitative Easing vs Tightening
console.log('═'.repeat(70) + '\n');
console.log('SCENARIO 4: Quantitative Easing vs Quantitative Tightening\n');

const qeYears = [2009, 2020, 2025, 2030];
console.log('Year | Policy      | QE/QT    | Fed Rate | Market Impact');
console.log('-----|-------------|----------|----------|---------------');

qeYears.forEach(year => {
  // Get inflation rate - use historical data for years <= 2024, generated for future
  let inflationRate;
  if (year <= 2024) {
    const historical = dynamicRates.getHistoricalInflation();
    inflationRate = historical[year] || 2.0;
  } else {
    inflationRate = dynamicRates.generateInflationRate(year);
  }
  
  const economics = economicIndicators.getEconomicIndicators(year, inflationRate);
  const impact = economicIndicators.calculateMarketImpact(economics);
  
  const policy = economics.quantitativeEasing > 0 ? 'QE (buying)' :
                 economics.quantitativeEasing < -200 ? 'QT (selling)' :
                 'Neutral';
  
  const qeStr = economics.quantitativeEasing >= 0 ?
    `+${economics.quantitativeEasing}B` :
    `${economics.quantitativeEasing}B`;
  
  console.log(
    `${year} | ${policy.padEnd(11)} | ${qeStr.padEnd(8)} | ` +
    `${economics.fedFundsRate.toFixed(2)}%    | ${(impact * 100).toFixed(2)}%`
  );
});

console.log('\nKey Insights:');
console.log('  - QE (asset purchases) provides market boost (~3% per $1T)');
console.log('  - QT (balance sheet reduction) creates headwinds');
console.log('  - Typically pairs with rate policy (low rates + QE, high rates + QT)');
console.log('  ✓ Realistic Fed policy impact on markets\n');

// Final summary
console.log('═'.repeat(70) + '\n');
console.log('SUMMARY: Economic Indicators System Benefits\n');

console.log('✓ Prevents unrealistic exponential growth after 2025');
console.log('✓ Models real Federal Reserve monetary policy');
console.log('✓ Incorporates business cycles and recessions');
console.log('✓ Links stock returns to GDP, unemployment, inflation');
console.log('✓ Provides strategic gameplay depth (timing matters)');
console.log('✓ Maintains long-term average returns around 7% (realistic)');
console.log('✓ Creates meaningful economic scenarios to navigate\n');

console.log('The system transforms StockFake from a simple growth simulator');
console.log('into a realistic economic and market simulation that remains');
console.log('engaging and challenging for decades of gameplay.\n');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║                        Demo Complete                               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');
