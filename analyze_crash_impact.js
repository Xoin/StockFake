const marketCrashEvents = require('./data/market-crash-events');

console.log('=== Analysis of Major Crash Events ===\n');

const events = marketCrashEvents.getAllScenarios();

// Focus on major historical crashes
const majorCrashes = [
  'financial_crisis_2008',
  'dot_com_crash_2000',
  'black_monday_1987'
];

majorCrashes.forEach(crashId => {
  const event = marketCrashEvents.getScenarioById(crashId);
  if (!event) return;
  
  console.log(`\n${event.name}:`);
  console.log(`  Type: ${event.type}`);
  console.log(`  Severity: ${event.severity}`);
  console.log(`  Market Impact: ${(event.impact.market * 100).toFixed(2)}%`);
  console.log(`  Duration: ${event.recoveryPattern.durationDays} days (${(event.recoveryPattern.durationDays/365).toFixed(1)} years)`);
  console.log(`  Recovery Type: ${event.recoveryPattern.type}`);
  
  if (event.startDate && event.endDate) {
    const durationDays = (new Date(event.endDate) - new Date(event.startDate)) / (1000 * 60 * 60 * 24);
    console.log(`  Actual Event Duration: ${durationDays.toFixed(0)} days (${(durationDays/365).toFixed(1)} years)`);
  }
  
  console.log(`  Cascading Effects: ${event.cascadingEffects.length} stages`);
  event.cascadingEffects.forEach((effect, i) => {
    console.log(`    Stage ${i+1}: Day ${effect.delay}, Multiplier: ${effect.multiplier}`);
  });
});

// Historical analysis
console.log('\n\n=== Historical Reality ===');
console.log('\n2008 Financial Crisis:');
console.log('  - Peak to trough: Oct 2007 to March 2009 = ~17 months');
console.log('  - Market decline: -57% (S&P 500)');
console.log('  - Recovery to peak: ~5.5 years (March 2013)');
console.log('  - Total impact period: ~6.5 years');

console.log('\n2000 Dot-Com Crash:');
console.log('  - Peak to trough: March 2000 to Oct 2002 = ~2.5 years');
console.log('  - NASDAQ decline: -78%');
console.log('  - Recovery to peak: ~15 years (2015)');
console.log('  - Total impact period: ~17 years');

console.log('\n1987 Black Monday:');
console.log('  - Single day crash: -22.6%');
console.log('  - Recovery: ~2 years to previous peak');
console.log('  - Total impact period: ~2 years');

console.log('\n\n=== GAP ANALYSIS ===');
console.log('\nCurrent System vs Historical Reality:');
console.log('\n2008 Crisis - Current: 545 days (1.5 years) | Reality: ~6.5 years');
console.log('  - Missing: ~5 years of extended impact');
console.log('  - Issue: Recovery pattern too optimistic');

console.log('\nDot-Com - Current: 730 days (2 years) | Reality: ~17 years for full recovery');
console.log('  - Missing: ~15 years of extended impact');
console.log('  - Issue: Massive underestimation of decade-long bear market');

console.log('\n\nRECOMMENDATIONS:');
console.log('1. Extend recovery periods from months/years to 5-15 years for major crashes');
console.log('2. Add "prolonged" recovery pattern with multi-year decline and slow recovery');
console.log('3. Increase cascading effect stages from 4-7 to 10-20 for decade-long impacts');
console.log('4. Add volatility that persists for years, not months');
console.log('5. Increase market impact magnitudes to match -57% to -78% historical declines');

