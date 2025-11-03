// Bond data including treasury securities, corporate bonds, and municipal bonds
// Credit ratings: AAA, AA, A, BBB (investment grade), BB, B, CCC, CC, C, D (junk/speculative grade)

const bonds = {
  // US Treasury Securities - T-Bills (short-term, zero coupon)
  'T-BILL-4W': {
    type: 'treasury',
    name: 'US Treasury Bill 4-Week',
    issuer: 'US Treasury',
    maturityWeeks: 4,
    couponRate: 0, // Zero-coupon
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '4-week Treasury Bill issued by US Government'
  },
  'T-BILL-8W': {
    type: 'treasury',
    name: 'US Treasury Bill 8-Week',
    issuer: 'US Treasury',
    maturityWeeks: 8,
    couponRate: 0,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '8-week Treasury Bill issued by US Government'
  },
  'T-BILL-13W': {
    type: 'treasury',
    name: 'US Treasury Bill 13-Week',
    issuer: 'US Treasury',
    maturityWeeks: 13,
    couponRate: 0,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '13-week Treasury Bill issued by US Government'
  },
  'T-BILL-26W': {
    type: 'treasury',
    name: 'US Treasury Bill 26-Week',
    issuer: 'US Treasury',
    maturityWeeks: 26,
    couponRate: 0,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '26-week Treasury Bill issued by US Government'
  },
  'T-BILL-52W': {
    type: 'treasury',
    name: 'US Treasury Bill 52-Week',
    issuer: 'US Treasury',
    maturityWeeks: 52,
    couponRate: 0,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '52-week Treasury Bill issued by US Government'
  },
  
  // US Treasury Notes (intermediate-term, semi-annual coupon)
  'T-NOTE-2Y': {
    type: 'treasury',
    name: 'US Treasury Note 2-Year',
    issuer: 'US Treasury',
    maturityYears: 2,
    couponRate: 0.04, // Base rate, will vary with yield curve
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '2-year Treasury Note with semi-annual interest payments'
  },
  'T-NOTE-3Y': {
    type: 'treasury',
    name: 'US Treasury Note 3-Year',
    issuer: 'US Treasury',
    maturityYears: 3,
    couponRate: 0.045,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '3-year Treasury Note with semi-annual interest payments'
  },
  'T-NOTE-5Y': {
    type: 'treasury',
    name: 'US Treasury Note 5-Year',
    issuer: 'US Treasury',
    maturityYears: 5,
    couponRate: 0.05,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '5-year Treasury Note with semi-annual interest payments'
  },
  'T-NOTE-7Y': {
    type: 'treasury',
    name: 'US Treasury Note 7-Year',
    issuer: 'US Treasury',
    maturityYears: 7,
    couponRate: 0.055,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '7-year Treasury Note with semi-annual interest payments'
  },
  'T-NOTE-10Y': {
    type: 'treasury',
    name: 'US Treasury Note 10-Year',
    issuer: 'US Treasury',
    maturityYears: 10,
    couponRate: 0.06,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '10-year Treasury Note with semi-annual interest payments'
  },
  
  // US Treasury Bonds (long-term, semi-annual coupon)
  'T-BOND-20Y': {
    type: 'treasury',
    name: 'US Treasury Bond 20-Year',
    issuer: 'US Treasury',
    maturityYears: 20,
    couponRate: 0.065,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '20-year Treasury Bond with semi-annual interest payments'
  },
  'T-BOND-30Y': {
    type: 'treasury',
    name: 'US Treasury Bond 30-Year',
    issuer: 'US Treasury',
    maturityYears: 30,
    couponRate: 0.07,
    creditRating: 'AAA',
    taxStatus: 'federal_taxable',
    minPurchase: 100,
    description: '30-year Treasury Bond with semi-annual interest payments'
  },
  
  // Corporate Bonds - Investment Grade (AAA-BBB)
  'CORP-AAPL-5Y': {
    type: 'corporate',
    name: 'Apple Inc. 5-Year Bond',
    issuer: 'AAPL',
    maturityYears: 5,
    couponRate: 0.035,
    creditRating: 'AAA',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: false,
    description: 'Apple Inc. corporate bond with excellent credit rating'
  },
  'CORP-MSFT-10Y': {
    type: 'corporate',
    name: 'Microsoft 10-Year Bond',
    issuer: 'MSFT',
    maturityYears: 10,
    couponRate: 0.04,
    creditRating: 'AAA',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: false,
    description: 'Microsoft corporate bond with excellent credit rating'
  },
  'CORP-JNJ-7Y': {
    type: 'corporate',
    name: 'Johnson & Johnson 7-Year Bond',
    issuer: 'JNJ',
    maturityYears: 7,
    couponRate: 0.038,
    creditRating: 'AAA',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: false,
    description: 'Johnson & Johnson corporate bond with excellent credit rating'
  },
  'CORP-XOM-10Y': {
    type: 'corporate',
    name: 'Exxon Mobil 10-Year Bond',
    issuer: 'XOM',
    maturityYears: 10,
    couponRate: 0.045,
    creditRating: 'AA',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: true,
    description: 'Exxon Mobil corporate bond with high credit rating'
  },
  'CORP-WMT-5Y': {
    type: 'corporate',
    name: 'Walmart 5-Year Bond',
    issuer: 'WMT',
    maturityYears: 5,
    couponRate: 0.042,
    creditRating: 'AA',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: false,
    description: 'Walmart corporate bond with high credit rating'
  },
  'CORP-BAC-7Y': {
    type: 'corporate',
    name: 'Bank of America 7-Year Bond',
    issuer: 'BAC',
    maturityYears: 7,
    couponRate: 0.05,
    creditRating: 'A',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: true,
    description: 'Bank of America corporate bond with good credit rating'
  },
  'CORP-F-5Y': {
    type: 'corporate',
    name: 'Ford Motor 5-Year Bond',
    issuer: 'F',
    maturityYears: 5,
    couponRate: 0.055,
    creditRating: 'BBB',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: false,
    description: 'Ford Motor corporate bond with investment grade rating'
  },
  
  // Corporate Bonds - Junk/High-Yield (BB and below)
  'CORP-T-10Y': {
    type: 'corporate',
    name: 'AT&T 10-Year Bond',
    issuer: 'T',
    maturityYears: 10,
    couponRate: 0.07,
    creditRating: 'BBB',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: true,
    description: 'AT&T corporate bond with lower investment grade rating'
  },
  'CORP-JUNK-5Y': {
    type: 'corporate',
    name: 'High-Yield Corporate 5-Year',
    issuer: 'Various',
    maturityYears: 5,
    couponRate: 0.09,
    creditRating: 'BB',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: false,
    description: 'High-yield corporate bond with speculative grade rating'
  },
  'CORP-JUNK-7Y': {
    type: 'corporate',
    name: 'High-Yield Corporate 7-Year',
    issuer: 'Various',
    maturityYears: 7,
    couponRate: 0.10,
    creditRating: 'B',
    taxStatus: 'fully_taxable',
    minPurchase: 1000,
    callable: false,
    description: 'High-yield corporate bond with speculative grade rating, higher risk'
  },
  
  // Municipal Bonds (tax-free interest)
  'MUNI-CA-5Y': {
    type: 'municipal',
    name: 'California General Obligation 5-Year',
    issuer: 'State of California',
    maturityYears: 5,
    couponRate: 0.03,
    creditRating: 'AA',
    taxStatus: 'tax_free',
    minPurchase: 5000,
    callable: false,
    description: 'California municipal bond with tax-free interest income'
  },
  'MUNI-NY-10Y': {
    type: 'municipal',
    name: 'New York Municipal 10-Year',
    issuer: 'New York City',
    maturityYears: 10,
    couponRate: 0.035,
    creditRating: 'A',
    taxStatus: 'tax_free',
    minPurchase: 5000,
    callable: true,
    description: 'New York City municipal bond with tax-free interest income'
  },
  'MUNI-TX-7Y': {
    type: 'municipal',
    name: 'Texas Municipal 7-Year',
    issuer: 'State of Texas',
    maturityYears: 7,
    couponRate: 0.032,
    creditRating: 'AA',
    taxStatus: 'tax_free',
    minPurchase: 5000,
    callable: false,
    description: 'Texas municipal bond with tax-free interest income'
  },
  'MUNI-FL-5Y': {
    type: 'municipal',
    name: 'Florida Revenue 5-Year',
    issuer: 'State of Florida',
    maturityYears: 5,
    couponRate: 0.028,
    creditRating: 'A',
    taxStatus: 'tax_free',
    minPurchase: 5000,
    callable: false,
    description: 'Florida revenue bond with tax-free interest income'
  }
};

// Get available bonds for trading
function getAvailableBonds() {
  return Object.keys(bonds).map(symbol => ({
    symbol,
    ...bonds[symbol]
  }));
}

// Get bond by symbol
function getBond(symbol) {
  return bonds[symbol] ? { symbol, ...bonds[symbol] } : null;
}

// Get bonds by type
function getBondsByType(type) {
  return Object.keys(bonds)
    .filter(symbol => bonds[symbol].type === type)
    .map(symbol => ({ symbol, ...bonds[symbol] }));
}

module.exports = {
  bonds,
  getAvailableBonds,
  getBond,
  getBondsByType
};
