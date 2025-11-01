#!/usr/bin/env node

/**
 * Visual demonstration of decade-long crash impacts
 * Shows how stock prices are affected over multi-year periods
 */

const marketCrashSim = require('./helpers/marketCrashSimulation');
const crashEvents = require('./data/market-crash-events');

console.log('=== Visual Demonstration: Decade-Long Crash Impacts ===\n');

// Demo 1: 2008 Financial Crisis over 6.5 years
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2008 Financial Crisis - Bank Stock Price Over 6.5 Years');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

marketCrashSim.resetForTesting();
const crisis2008Start = new Date('2008-09-15T09:30:00');
marketCrashSim.triggerCrashEvent('financial_crisis_2008', crisis2008Start);

const basePrice = 100.0;
const bankStock = { symbol: 'BAC', sector: 'Financial' };

console.log(`Starting Price (Sept 2008): $${basePrice.toFixed(2)}\n`);

// Show price progression
const timePoints2008 = [
  { label: 'Sep 2008 - Crisis Begins', months: 0 },
  { label: 'Oct 2008 - Panic', months: 1 },
  { label: 'Dec 2008 - Deepening', months: 3 },
  { label: 'Mar 2009 - Bottom', months: 6 },
  { label: 'Sep 2009 - 1 Year', months: 12 },
  { label: 'Sep 2010 - 2 Years', months: 24 },
  { label: 'Sep 2011 - 3 Years', months: 36 },
  { label: 'Sep 2012 - 4 Years', months: 48 },
  { label: 'Sep 2013 - 5 Years', months: 60 },
  { label: 'Mar 2014 - 5.5 Years', months: 66 },
  { label: 'Sep 2014 - 6 Years', months: 72 },
  { label: 'Mar 2015 - 6.5 Years (Recovery)', months: 78 }
];

for (const point of timePoints2008) {
  // Use precise date arithmetic instead of average days per month
  const testDate = new Date(crisis2008Start);
  testDate.setMonth(testDate.getMonth() + point.months);
  
  const price = marketCrashSim.calculateStockPriceImpact(bankStock.symbol, bankStock.sector, basePrice, testDate);
  const change = ((price - basePrice) / basePrice) * 100;
  const changeStr = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  
  // Create visual bar
  const barLength = Math.floor(Math.abs(price));
  const bar = '█'.repeat(Math.max(0, barLength));
  
  console.log(`${point.label.padEnd(30)} $${price.toFixed(2).padStart(6)} (${changeStr.padStart(7)}) ${bar}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2000 Dot-Com Crash - Tech Stock Price Over 15 Years');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

marketCrashSim.resetForTesting();
const dotComStart = new Date('2000-03-10T09:30:00');
marketCrashSim.triggerCrashEvent('dot_com_crash_2000', dotComStart);

const techStock = { symbol: 'AAPL', sector: 'Technology' };

console.log(`Starting Price (March 2000): $${basePrice.toFixed(2)}\n`);

// Show price progression over 15 years
const timePointsDotCom = [
  { label: 'Mar 2000 - Bubble Bursts', years: 0 },
  { label: '2001 - Sustained Decline', years: 1 },
  { label: '2002 - Bottom Reached', years: 2 },
  { label: '2003 - Still Depressed', years: 3 },
  { label: '2005 - Slow Recovery', years: 5 },
  { label: '2007 - Continued Recovery', years: 7 },
  { label: '2010 - Approaching Normal', years: 10 },
  { label: '2012 - Getting Closer', years: 12 },
  { label: '2015 - Full Recovery', years: 15 }
];

for (const point of timePointsDotCom) {
  const days = Math.floor(point.years * 365);
  const testDate = new Date(dotComStart.getTime() + (days * 24 * 60 * 60 * 1000));
  const price = marketCrashSim.calculateStockPriceImpact(techStock.symbol, techStock.sector, basePrice, testDate);
  const change = ((price - basePrice) / basePrice) * 100;
  const changeStr = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  
  // Create visual bar
  const barLength = Math.floor(Math.abs(price));
  const bar = '█'.repeat(Math.max(0, barLength));
  
  console.log(`${point.label.padEnd(30)} $${price.toFixed(2).padStart(6)} (${changeStr.padStart(7)}) ${bar}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Key Takeaways');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✓ Major economic crashes now have DECADE-LONG impacts');
console.log('✓ 2008 crisis takes 6.5 years to recover (not 1.5 years)');
console.log('✓ Dot-Com crash takes 15 years to recover (not 2 years)');
console.log('✓ Stock prices remain depressed for YEARS, not months');
console.log('✓ Gradual recovery matches historical market behavior');
console.log('✓ Cascading effects persist throughout multi-year periods');
console.log('\nThis ensures economic events have the massive, lasting');
console.log('impact observed in historical data! 📉📊\n');
