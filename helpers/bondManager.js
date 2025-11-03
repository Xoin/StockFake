// Bond manager - handles bond pricing, purchases, sales, and interest payments
const db = require('../database');
const bondsData = require('../data/bonds');
const treasuryYields = require('../data/treasury-yields');

// Calculate bond price based on yield
// Formula: Price = Sum of PV of coupon payments + PV of face value
function calculateBondPrice(bond, currentYield, yearsToMaturity, faceValue = 100) {
  const couponRate = bond.couponRate;
  
  // Handle zero-coupon bonds (T-Bills)
  if (couponRate === 0) {
    // Zero-coupon bond: Price = FaceValue / (1 + yield)^years
    return faceValue / Math.pow(1 + currentYield, yearsToMaturity);
  }
  
  // Regular coupon bonds - semi-annual payments
  const periods = yearsToMaturity * 2;
  const couponPayment = (couponRate * faceValue) / 2;
  const yieldPerPeriod = currentYield / 2;
  
  let price = 0;
  
  // Present value of all coupon payments
  for (let i = 1; i <= periods; i++) {
    price += couponPayment / Math.pow(1 + yieldPerPeriod, i);
  }
  
  // Present value of face value
  price += faceValue / Math.pow(1 + yieldPerPeriod, periods);
  
  return price;
}

// Get current market price for a bond
function getBondMarketPrice(bondSymbol, currentDate, faceValue = 100) {
  const bond = bondsData.getBond(bondSymbol);
  if (!bond) return null;
  
  // Get current yield based on treasury yield curve
  const maturityKey = treasuryYields.getMaturityKey(bond);
  let marketYield = treasuryYields.getYield(currentDate, maturityKey);
  
  // Add credit spread for corporate and municipal bonds
  if (bond.type === 'corporate') {
    const creditSpreads = {
      'AAA': 0.005,
      'AA': 0.008,
      'A': 0.012,
      'BBB': 0.018,
      'BB': 0.030,
      'B': 0.045,
      'CCC': 0.070,
      'CC': 0.100,
      'C': 0.150,
      'D': 0.300
    };
    marketYield += creditSpreads[bond.creditRating] || 0.020;
  } else if (bond.type === 'municipal') {
    // Municipal bonds typically yield less due to tax advantages
    marketYield *= 0.75; // Tax-equivalent adjustment
  }
  
  // Calculate years to maturity
  let yearsToMaturity;
  if (bond.maturityWeeks) {
    yearsToMaturity = bond.maturityWeeks / 52;
  } else {
    yearsToMaturity = bond.maturityYears || 10;
  }
  
  const price = calculateBondPrice(bond, marketYield, yearsToMaturity, faceValue);
  
  return {
    price: Math.round(price * 100) / 100,
    yield: Math.round(marketYield * 10000) / 100, // Convert to percentage with 2 decimals
    yearsToMaturity
  };
}

// Calculate yield to maturity (YTM) for a bond given its price
function calculateYieldToMaturity(bond, price, yearsToMaturity, faceValue = 100) {
  // For zero-coupon bonds, YTM can be calculated directly
  if (bond.couponRate === 0) {
    return Math.pow(faceValue / price, 1 / yearsToMaturity) - 1;
  }
  
  // For coupon bonds, use binary search (more reliable than Newton's method)
  let lowerBound = 0.0001; // 0.01%
  let upperBound = 0.5;    // 50%
  const tolerance = 0.0001;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    const ytm = (lowerBound + upperBound) / 2;
    const calculatedPrice = calculateBondPrice(bond, ytm, yearsToMaturity, faceValue);
    
    if (Math.abs(calculatedPrice - price) < tolerance) {
      return ytm;
    }
    
    // If calculated price is too high, we need higher yield (lower bound)
    if (calculatedPrice > price) {
      lowerBound = ytm;
    } else {
      upperBound = ytm;
    }
  }
  
  // Return mid-point if we didn't converge
  return (lowerBound + upperBound) / 2;
}

// Process bond interest payments (called during game time updates)
function processInterestPayments(currentDate) {
  const holdings = db.getBondHoldings.all();
  const payments = [];
  
  for (const holding of holdings) {
    const bond = bondsData.getBond(`${holding.bond_type.toUpperCase()}-${holding.issuer}`);
    if (!bond) continue;
    
    // Skip zero-coupon bonds (no periodic payments)
    if (holding.coupon_rate === 0) continue;
    
    // Check if interest payment is due (semi-annual)
    const purchaseDate = new Date(holding.purchase_date);
    const monthsSincePurchase = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // Get last payment date from bond_interest_payments
    const lastPayments = db.getBondInterestPayments.all(holding.id);
    const lastPaymentDate = lastPayments.length > 0 
      ? new Date(lastPayments[0].payment_date)
      : purchaseDate;
    
    const monthsSinceLastPayment = (currentDate.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // Pay interest every 6 months
    if (monthsSinceLastPayment >= 6) {
      const semiAnnualCoupon = (holding.coupon_rate * holding.face_value * holding.quantity) / 2;
      
      // Apply tax if applicable
      let tax = 0;
      let netAmount = semiAnnualCoupon;
      
      if (holding.credit_rating !== 'tax_free') {
        // 15% tax on bond interest (simplified)
        tax = semiAnnualCoupon * 0.15;
        netAmount = semiAnnualCoupon - tax;
        
        // Record tax
        db.insertTax.run(
          currentDate.toISOString(),
          'bond_interest',
          tax,
          `Tax on bond interest from ${holding.issuer}`
        );
      }
      
      // Record interest payment
      db.insertBondInterestPayment.run(
        holding.id,
        currentDate.toISOString(),
        netAmount
      );
      
      // Add to user's cash
      const account = db.getUserAccount.get();
      db.updateUserAccount.run(
        account.cash + netAmount,
        account.credit_score
      );
      
      // Record transaction
      db.insertTransaction.run(
        currentDate.toISOString(),
        'bond_interest',
        holding.issuer,
        null,
        null,
        null,
        tax,
        netAmount,
        JSON.stringify({
          bondId: holding.id,
          bondType: holding.bond_type,
          grossAmount: semiAnnualCoupon,
          taxStatus: holding.credit_rating
        })
      );
      
      payments.push({
        bondId: holding.id,
        issuer: holding.issuer,
        grossAmount: semiAnnualCoupon,
        tax,
        netAmount
      });
    }
  }
  
  return payments;
}

// Process bond maturities (redeem bonds at face value)
function processMaturities(currentDate) {
  const holdings = db.getBondHoldings.all();
  const maturedBonds = [];
  
  for (const holding of holdings) {
    const maturityDate = new Date(holding.maturity_date);
    
    if (currentDate >= maturityDate) {
      // Redeem at face value
      const redemptionAmount = holding.face_value * holding.quantity;
      
      // Add to user's cash
      const account = db.getUserAccount.get();
      db.updateUserAccount.run(
        account.cash + redemptionAmount,
        account.credit_score
      );
      
      // Calculate gain/loss
      const totalCost = holding.purchase_price * holding.quantity;
      const gainLoss = redemptionAmount - totalCost;
      
      // Record transaction
      db.insertTransaction.run(
        currentDate.toISOString(),
        'bond_maturity',
        holding.issuer,
        holding.quantity,
        holding.face_value,
        null,
        null,
        redemptionAmount,
        JSON.stringify({
          bondId: holding.id,
          bondType: holding.bond_type,
          purchasePrice: holding.purchase_price,
          gainLoss
        })
      );
      
      // Remove bond from holdings
      db.deleteBondHolding.run(holding.id);
      
      maturedBonds.push({
        bondId: holding.id,
        issuer: holding.issuer,
        bondType: holding.bond_type,
        quantity: holding.quantity,
        redemptionAmount,
        gainLoss
      });
    }
  }
  
  return maturedBonds;
}

// Calculate bond portfolio duration (weighted average time to receive cash flows)
function calculatePortfolioDuration(currentDate) {
  const holdings = db.getBondHoldings.all();
  let totalValue = 0;
  let weightedDuration = 0;
  
  for (const holding of holdings) {
    const maturityDate = new Date(holding.maturity_date);
    const yearsToMaturity = (maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearsToMaturity <= 0) continue;
    
    // Simplified duration calculation (Macaulay duration approximation)
    const bondValue = holding.purchase_price * holding.quantity;
    const duration = yearsToMaturity * 0.85; // Approximation for coupon bonds
    
    totalValue += bondValue;
    weightedDuration += duration * bondValue;
  }
  
  return totalValue > 0 ? weightedDuration / totalValue : 0;
}

// Get bond portfolio statistics
function getBondPortfolioStats(currentDate) {
  const holdings = db.getBondHoldings.all();
  
  let totalValue = 0;
  let totalCost = 0;
  const byType = { treasury: 0, corporate: 0, municipal: 0 };
  const byRating = {};
  
  for (const holding of holdings) {
    const value = holding.purchase_price * holding.quantity;
    totalValue += value;
    totalCost += value;
    
    byType[holding.bond_type] = (byType[holding.bond_type] || 0) + value;
    byRating[holding.credit_rating] = (byRating[holding.credit_rating] || 0) + value;
  }
  
  return {
    totalHoldings: holdings.length,
    totalValue,
    totalCost,
    byType,
    byRating,
    duration: calculatePortfolioDuration(currentDate)
  };
}

module.exports = {
  calculateBondPrice,
  getBondMarketPrice,
  calculateYieldToMaturity,
  processInterestPayments,
  processMaturities,
  calculatePortfolioDuration,
  getBondPortfolioStats
};
