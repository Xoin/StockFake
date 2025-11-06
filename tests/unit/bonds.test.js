// Bond functionality tests
const bondManager = require('../../helpers/bondManager');
const bondsData = require('../../data/bonds');
const treasuryYields = require('../../data/treasury-yields');

describe('Bond Functionality Test Suite', () => {
  describe('Bond Data Module', () => {
    test('Should load all bonds', () => {
      const bonds = bondsData.getAvailableBonds();
      expect(bonds.length).toBeGreaterThan(0);
      expect(bonds.length).toBeGreaterThanOrEqual(30);
    });

    test('Should have treasury bonds', () => {
      const treasuryBonds = bondsData.getBondsByType('treasury');
      expect(treasuryBonds.length).toBeGreaterThan(0);
      expect(treasuryBonds.some(b => b.symbol === 'T-BILL-4W')).toBe(true);
      expect(treasuryBonds.some(b => b.symbol === 'T-NOTE-10Y')).toBe(true);
      expect(treasuryBonds.some(b => b.symbol === 'T-BOND-30Y')).toBe(true);
    });

    test('Should have corporate bonds', () => {
      const corporateBonds = bondsData.getBondsByType('corporate');
      expect(corporateBonds.length).toBeGreaterThan(0);
      expect(corporateBonds.some(b => b.creditRating === 'AAA')).toBe(true);
      expect(corporateBonds.some(b => b.creditRating === 'BB' || b.creditRating === 'B')).toBe(true);
    });

    test('Should have municipal bonds', () => {
      const muniBonds = bondsData.getBondsByType('municipal');
      expect(muniBonds.length).toBeGreaterThan(0);
      expect(muniBonds.every(b => b.taxStatus === 'tax_free')).toBe(true);
    });

    test('Should get specific bond by symbol', () => {
      const bond = bondsData.getBond('T-NOTE-10Y');
      expect(bond).not.toBeNull();
      expect(bond.type).toBe('treasury');
      expect(bond.maturityYears).toBe(10);
    });
  });

  describe('Treasury Yields Module', () => {
    test('Should have historical yield data', () => {
      const yields = treasuryYields.yieldCurveData;
      expect(Object.keys(yields).length).toBeGreaterThan(0);
      expect(yields[1970]).toBeDefined();
      expect(yields[2020]).toBeDefined();
    });

    test('Should get yield for specific date and maturity', () => {
      const date = new Date('1980-06-15');
      const yield10Y = treasuryYields.getYield(date, '10Y');
      expect(yield10Y).toBeGreaterThan(0);
      expect(yield10Y).toBeGreaterThan(0.10);
    });

    test('Should get full yield curve', () => {
      const date = new Date('2000-01-01');
      const curve = treasuryYields.getYieldCurve(date);
      expect(curve['3M']).toBeDefined();
      expect(curve['10Y']).toBeDefined();
      expect(curve['30Y']).toBeDefined();
    });

    test('Should map bond maturity to yield curve key', () => {
      const tBill = bondsData.getBond('T-BILL-13W');
      const key1 = treasuryYields.getMaturityKey(tBill);
      expect(key1).toBe('3M');
      
      const tNote = bondsData.getBond('T-NOTE-10Y');
      const key2 = treasuryYields.getMaturityKey(tNote);
      expect(key2).toBe('10Y');
    });
  });

  describe('Bond Pricing Calculations', () => {
    test('Should calculate zero-coupon bond price', () => {
      const bond = bondsData.getBond('T-BILL-52W');
      const yield5pct = 0.05;
      const yearsToMaturity = 1;
      const price = bondManager.calculateBondPrice(bond, yield5pct, yearsToMaturity, 100);
      
      // Zero-coupon bond: Price = FaceValue / (1 + yield)^years
      const expectedPrice = 100 / (1 + 0.05);
      expect(Math.abs(price - expectedPrice)).toBeLessThan(0.01);
      expect(price).toBeLessThan(100);
    });

    test('Should calculate coupon bond price at par', () => {
      const bond = bondsData.getBond('T-NOTE-10Y');
      // When yield = coupon rate, bond should trade at par (100)
      const price = bondManager.calculateBondPrice(bond, bond.couponRate, 10, 100);
      expect(Math.abs(price - 100)).toBeLessThan(1);
    });

    test('Should calculate coupon bond price at premium', () => {
      const bond = bondsData.getBond('T-NOTE-10Y');
      // When yield < coupon rate, bond should trade at premium (>100)
      const lowerYield = bond.couponRate - 0.01;
      const price = bondManager.calculateBondPrice(bond, lowerYield, 10, 100);
      expect(price).toBeGreaterThan(100);
    });

    test('Should calculate coupon bond price at discount', () => {
      const bond = bondsData.getBond('T-NOTE-10Y');
      // When yield > coupon rate, bond should trade at discount (<100)
      const higherYield = bond.couponRate + 0.02;
      const price = bondManager.calculateBondPrice(bond, higherYield, 10, 100);
      expect(price).toBeLessThan(100);
    });

    test('Should get market price for treasury bond', () => {
      const date = new Date('2000-01-01');
      const pricing = bondManager.getBondMarketPrice('T-NOTE-10Y', date);
      
      expect(pricing).not.toBeNull();
      expect(pricing.price).toBeGreaterThan(0);
      expect(pricing.yield).toBeGreaterThan(0);
      expect(pricing.yearsToMaturity).toBe(10);
    });

    test('Should apply credit spread to corporate bonds', () => {
      const date = new Date('2000-01-01');
      const treasuryPricing = bondManager.getBondMarketPrice('T-NOTE-10Y', date);
      const corporatePricing = bondManager.getBondMarketPrice('CORP-AAPL-5Y', date);
      
      // Corporate bonds should have higher yield (lower price) than treasuries
      expect(corporatePricing.yield).toBeGreaterThan(treasuryPricing.yield);
    });

    test('Should apply tax adjustment to municipal bonds', () => {
      const date = new Date('2000-01-01');
      const treasuryPricing = bondManager.getBondMarketPrice('T-NOTE-10Y', date);
      const muniPricing = bondManager.getBondMarketPrice('MUNI-CA-5Y', date);
      
      // Municipal bonds typically yield less due to tax advantages
      expect(muniPricing.yield).toBeLessThan(treasuryPricing.yield);
    });
  });

  describe('Yield to Maturity Calculations', () => {
    test('Should calculate YTM for zero-coupon bond', () => {
      const bond = bondsData.getBond('T-BILL-52W');
      const price = 95; // Trading at $95
      const yearsToMaturity = 1;
      const ytm = bondManager.calculateYieldToMaturity(bond, price, yearsToMaturity, 100);
      
      // YTM for zero-coupon: (100/95)^(1/1) - 1 = 0.0526 or 5.26%
      const expectedYTM = Math.pow(100 / 95, 1) - 1;
      expect(Math.abs(ytm - expectedYTM)).toBeLessThan(0.001);
    });

    test('Should calculate YTM for coupon bond trading at discount', () => {
      const bond = bondsData.getBond('T-NOTE-10Y');
      const price = 90; // Trading below par
      const yearsToMaturity = 10;
      const ytm = bondManager.calculateYieldToMaturity(bond, price, yearsToMaturity, 100);
      
      // YTM should be higher than coupon rate when trading at discount
      expect(ytm).toBeGreaterThan(bond.couponRate);
      expect(ytm).toBeGreaterThan(0);
      expect(ytm).toBeLessThan(0.5);
    });

    test('Should calculate YTM for coupon bond trading at premium', () => {
      const bond = bondsData.getBond('T-NOTE-10Y');
      const price = 110; // Trading above par
      const yearsToMaturity = 10;
      const ytm = bondManager.calculateYieldToMaturity(bond, price, yearsToMaturity, 100);
      
      // YTM should be lower than coupon rate when trading at premium
      expect(ytm).toBeLessThan(bond.couponRate);
      expect(ytm).toBeGreaterThan(0);
    });
  });

  describe('Bond Characteristics', () => {
    test('All bonds should have required fields', () => {
      const bonds = bondsData.getAvailableBonds();
      bonds.forEach(bond => {
        expect(bond.symbol).toBeDefined();
        expect(bond.type).toBeDefined();
        expect(bond.name).toBeDefined();
        expect(bond.issuer).toBeDefined();
        expect(bond.creditRating).toBeDefined();
        expect(bond).toHaveProperty('couponRate');
        expect(bond.minPurchase).toBeGreaterThan(0);
      });
    });

    test('Credit ratings should be valid', () => {
      const bonds = bondsData.getAvailableBonds();
      const validRatings = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D'];
      bonds.forEach(bond => {
        expect(validRatings).toContain(bond.creditRating);
      });
    });

    test('Treasury bonds should have AAA rating', () => {
      const treasuryBonds = bondsData.getBondsByType('treasury');
      treasuryBonds.forEach(bond => {
        expect(bond.creditRating).toBe('AAA');
      });
    });

    test('Investment grade vs junk bonds', () => {
      const investmentGrade = ['AAA', 'AA', 'A', 'BBB'];
      const corporateBonds = bondsData.getBondsByType('corporate');
      
      const investmentGradeBonds = corporateBonds.filter(b => investmentGrade.includes(b.creditRating));
      const junkBonds = corporateBonds.filter(b => !investmentGrade.includes(b.creditRating));
      
      expect(investmentGradeBonds.length).toBeGreaterThan(0);
      expect(junkBonds.length).toBeGreaterThan(0);
      
      // Junk bonds should have higher coupon rates
      const avgJunkCoupon = junkBonds.reduce((sum, b) => sum + b.couponRate, 0) / junkBonds.length;
      const avgInvGradeCoupon = investmentGradeBonds.reduce((sum, b) => sum + b.couponRate, 0) / investmentGradeBonds.length;
      expect(avgJunkCoupon).toBeGreaterThan(avgInvGradeCoupon);
    });
  });

  describe('Historical Yield Curve Trends', () => {
    test('1980s had high interest rates', () => {
      const date1981 = new Date('1981-01-01');
      const yield10Y = treasuryYields.getYield(date1981, '10Y');
      expect(yield10Y).toBeGreaterThan(0.10);
    });

    test('2020 had low interest rates', () => {
      const date2020 = new Date('2020-06-01');
      const yield10Y = treasuryYields.getYield(date2020, '10Y');
      expect(yield10Y).toBeLessThan(0.02);
    });

    test('Yield curve should generally be upward sloping', () => {
      const date = new Date('2010-01-01');
      const curve = treasuryYields.getYieldCurve(date);
      
      // Generally, longer maturities should have higher yields
      expect(curve['30Y']).toBeGreaterThanOrEqual(curve['10Y']);
      expect(curve['10Y']).toBeGreaterThanOrEqual(curve['2Y']);
      // Note: Sometimes yield curves invert, so we use >= not >
    });
  });
});
