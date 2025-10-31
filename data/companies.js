// Company information including products, intellectual property, financials, assets, and employees
// This data represents realistic company information from 1970s onwards

const companyData = {
  'IBM': {
    name: 'International Business Machines',
    sector: 'Technology',
    founded: 1911,
    headquarters: 'Armonk, New York',
    description: 'Leading manufacturer of computers and business machines',
    products: [
      { name: 'System/360 Mainframes', category: 'Hardware', yearIntroduced: 1964 },
      { name: 'IBM PC', category: 'Hardware', yearIntroduced: 1981 },
      { name: 'DB2 Database', category: 'Software', yearIntroduced: 1983 },
      { name: 'ThinkPad Laptops', category: 'Hardware', yearIntroduced: 1992 }
    ],
    intellectualProperty: {
      patents: { 1970: 1200, 1980: 2800, 1990: 4500, 2000: 8000, 2010: 12000, 2020: 15000 },
      trademarks: ['IBM', 'ThinkPad', 'Watson', 'DB2']
    },
    financials: {
      revenue: { 1970: 7500, 1980: 26213, 1990: 69000, 2000: 88396, 2010: 99870, 2020: 73620 },
      netIncome: { 1970: 1018, 1980: 3562, 1990: 6020, 2000: 8093, 2010: 14833, 2020: 5590 },
      assets: { 1970: 9500, 1980: 32541, 1990: 87568, 2000: 88313, 2010: 113452, 2020: 155971 }
    },
    employees: { 1970: 269291, 1980: 341279, 1990: 373816, 2000: 316303, 2010: 426751, 2020: 345900 }
  },
  'AAPL': {
    name: 'Apple Inc.',
    sector: 'Technology',
    founded: 1976,
    headquarters: 'Cupertino, California',
    description: 'Consumer electronics and software company',
    products: [
      { name: 'Apple II', category: 'Hardware', yearIntroduced: 1977 },
      { name: 'Macintosh', category: 'Hardware', yearIntroduced: 1984 },
      { name: 'iPod', category: 'Hardware', yearIntroduced: 2001 },
      { name: 'iPhone', category: 'Hardware', yearIntroduced: 2007 },
      { name: 'iPad', category: 'Hardware', yearIntroduced: 2010 }
    ],
    intellectualProperty: {
      patents: { 1980: 15, 1990: 150, 2000: 800, 2010: 4000, 2020: 12000 },
      trademarks: ['Apple', 'Mac', 'iPod', 'iPhone', 'iPad', 'iOS']
    },
    financials: {
      revenue: { 1980: 117, 1990: 5558, 2000: 7983, 2010: 65225, 2020: 274515 },
      netIncome: { 1980: 12, 1990: 475, 2000: 786, 2010: 14013, 2020: 57411 },
      assets: { 1980: 65, 1990: 2743, 2000: 6803, 2010: 75183, 2020: 323888 }
    },
    employees: { 1980: 1000, 1990: 5000, 2000: 8400, 2010: 46600, 2020: 147000 }
  },
  'MSFT': {
    name: 'Microsoft Corporation',
    sector: 'Technology',
    founded: 1975,
    headquarters: 'Redmond, Washington',
    description: 'Software, services, and cloud computing company',
    products: [
      { name: 'MS-DOS', category: 'Software', yearIntroduced: 1981 },
      { name: 'Windows', category: 'Software', yearIntroduced: 1985 },
      { name: 'Office Suite', category: 'Software', yearIntroduced: 1989 },
      { name: 'Xbox', category: 'Hardware', yearIntroduced: 2001 },
      { name: 'Azure Cloud', category: 'Services', yearIntroduced: 2010 }
    ],
    intellectualProperty: {
      patents: { 1990: 50, 2000: 2500, 2010: 8000, 2020: 15000 },
      trademarks: ['Microsoft', 'Windows', 'Office', 'Xbox', 'Azure']
    },
    financials: {
      revenue: { 1990: 1183, 2000: 22956, 2010: 62484, 2020: 143015 },
      netIncome: { 1990: 279, 2000: 9421, 2010: 18760, 2020: 44281 },
      assets: { 1990: 851, 2000: 52150, 2010: 86113, 2020: 301311 }
    },
    employees: { 1990: 5635, 2000: 39100, 2010: 89000, 2020: 163000 }
  },
  'XOM': {
    name: 'Exxon Mobil Corporation',
    sector: 'Energy',
    founded: 1870,
    headquarters: 'Irving, Texas',
    description: 'Oil and gas exploration and production',
    products: [
      { name: 'Gasoline', category: 'Fuel', yearIntroduced: 1900 },
      { name: 'Diesel Fuel', category: 'Fuel', yearIntroduced: 1920 },
      { name: 'Lubricants', category: 'Chemical', yearIntroduced: 1930 },
      { name: 'Petrochemicals', category: 'Chemical', yearIntroduced: 1950 }
    ],
    intellectualProperty: {
      patents: { 1970: 800, 1980: 1500, 1990: 2200, 2000: 3000, 2010: 4500, 2020: 6000 },
      trademarks: ['Exxon', 'Mobil', 'Esso', 'Speedpass']
    },
    financials: {
      revenue: { 1970: 16550, 1980: 103143, 1990: 105885, 2000: 210392, 2010: 383221, 2020: 181502 },
      netIncome: { 1970: 1520, 1980: 5650, 1990: 5010, 2000: 17720, 2010: 30460, 2020: -22440 },
      assets: { 1970: 21500, 1980: 56576, 1990: 87720, 2000: 149000, 2010: 302510, 2020: 332750 }
    },
    employees: { 1970: 145000, 1980: 180000, 1990: 104000, 2000: 97900, 2010: 83600, 2020: 72000 }
  },
  'JNJ': {
    name: 'Johnson & Johnson',
    sector: 'Healthcare',
    founded: 1886,
    headquarters: 'New Brunswick, New Jersey',
    description: 'Pharmaceuticals, medical devices, and consumer healthcare',
    products: [
      { name: 'Band-Aid', category: 'Consumer Health', yearIntroduced: 1920 },
      { name: "Johnson's Baby Products", category: 'Consumer Health', yearIntroduced: 1894 },
      { name: 'Tylenol', category: 'Pharmaceuticals', yearIntroduced: 1959 },
      { name: 'Contact Lenses', category: 'Medical Devices', yearIntroduced: 1987 }
    ],
    intellectualProperty: {
      patents: { 1970: 600, 1980: 1200, 1990: 2500, 2000: 5000, 2010: 8500, 2020: 12000 },
      trademarks: ['Johnson & Johnson', 'Band-Aid', 'Tylenol', 'Listerine', 'Neutrogena']
    },
    financials: {
      revenue: { 1970: 2100, 1980: 5400, 1990: 11232, 2000: 29139, 2010: 61587, 2020: 82584 },
      netIncome: { 1970: 190, 1980: 465, 1990: 1143, 2000: 4800, 2010: 13334, 2020: 14714 },
      assets: { 1970: 1800, 1980: 4800, 1990: 11360, 2000: 38488, 2010: 102908, 2020: 174894 }
    },
    employees: { 1970: 46000, 1980: 77800, 1990: 81600, 2000: 97800, 2010: 114000, 2020: 134500 }
  },
  'WMT': {
    name: 'Walmart Inc.',
    sector: 'Retail',
    founded: 1962,
    headquarters: 'Bentonville, Arkansas',
    description: 'Multinational retail corporation',
    products: [
      { name: 'Discount Stores', category: 'Retail', yearIntroduced: 1962 },
      { name: 'Supercenters', category: 'Retail', yearIntroduced: 1988 },
      { name: "Sam's Club", category: 'Retail', yearIntroduced: 1983 },
      { name: 'Walmart.com', category: 'E-commerce', yearIntroduced: 2000 }
    ],
    intellectualProperty: {
      patents: { 1980: 5, 1990: 25, 2000: 100, 2010: 500, 2020: 1200 },
      trademarks: ['Walmart', "Sam's Club", 'Great Value', 'Equate']
    },
    financials: {
      revenue: { 1980: 1248, 1990: 25811, 2000: 165013, 2010: 408214, 2020: 559151 },
      netIncome: { 1980: 41, 1990: 1076, 2000: 5377, 2010: 14335, 2020: 13510 },
      assets: { 1980: 528, 1990: 8198, 2000: 70349, 2010: 170706, 2020: 252496 }
    },
    employees: { 1980: 21000, 1990: 275000, 2000: 1140000, 2010: 2100000, 2020: 2300000 }
  },
  'KO': {
    name: 'The Coca-Cola Company',
    sector: 'Consumer Goods',
    founded: 1886,
    headquarters: 'Atlanta, Georgia',
    description: 'Beverage manufacturer and distributor',
    products: [
      { name: 'Coca-Cola', category: 'Beverage', yearIntroduced: 1886 },
      { name: 'Sprite', category: 'Beverage', yearIntroduced: 1961 },
      { name: 'Fanta', category: 'Beverage', yearIntroduced: 1940 },
      { name: 'Dasani Water', category: 'Beverage', yearIntroduced: 1999 }
    ],
    intellectualProperty: {
      patents: { 1970: 100, 1980: 200, 1990: 400, 2000: 800, 2010: 1500, 2020: 2500 },
      trademarks: ['Coca-Cola', 'Coke', 'Sprite', 'Fanta', 'Dasani', 'Minute Maid']
    },
    financials: {
      revenue: { 1970: 1500, 1980: 5500, 1990: 10236, 2000: 20458, 2010: 35119, 2020: 33014 },
      netIncome: { 1970: 200, 1980: 422, 1990: 1382, 2000: 3399, 2010: 11809, 2020: 7747 },
      assets: { 1970: 1100, 1980: 4200, 1990: 9278, 2000: 20834, 2010: 72921, 2020: 87296 }
    },
    employees: { 1970: 35000, 1980: 50000, 1990: 31000, 2000: 29500, 2010: 92800, 2020: 80300 }
  },
  'JPM': {
    name: 'JPMorgan Chase & Co.',
    sector: 'Financial Services',
    founded: 1799,
    headquarters: 'New York, New York',
    description: 'Multinational investment bank and financial services company',
    products: [
      { name: 'Commercial Banking', category: 'Banking', yearIntroduced: 1800 },
      { name: 'Investment Banking', category: 'Banking', yearIntroduced: 1900 },
      { name: 'Asset Management', category: 'Financial Services', yearIntroduced: 1960 },
      { name: 'Chase Credit Cards', category: 'Consumer Banking', yearIntroduced: 1985 }
    ],
    intellectualProperty: {
      patents: { 1990: 50, 2000: 200, 2010: 800, 2020: 2000 },
      trademarks: ['JPMorgan', 'Chase', 'J.P. Morgan', 'Chase Sapphire']
    },
    financials: {
      revenue: { 1970: 800, 1980: 3200, 1990: 9500, 2000: 51900, 2010: 102694, 2020: 119543 },
      netIncome: { 1970: 100, 1980: 350, 1990: 980, 2000: 5727, 2010: 17370, 2020: 29131 },
      assets: { 1970: 15000, 1980: 65000, 1990: 148000, 2000: 715348, 2010: 2117605, 2020: 3386071 }
    },
    employees: { 1970: 8000, 1980: 25000, 1990: 45000, 2000: 93453, 2010: 239831, 2020: 255351 }
  }
};

// Get company information for a specific symbol
function getCompanyInfo(symbol) {
  return companyData[symbol] || null;
}

// Generate dynamic company info for stocks without detailed data
function generateDynamicCompanyInfo(symbol, stockInfo, currentYear) {
  if (!stockInfo) return null;
  
  // Estimate founding year based on when stock first appeared
  const estimatedFounded = Math.max(1800, currentYear - 50);
  
  // Generate basic company info
  return {
    name: stockInfo.name,
    sector: stockInfo.sector,
    founded: estimatedFounded,
    headquarters: 'United States', // Default
    description: `${stockInfo.name} is a company in the ${stockInfo.sector} sector.`,
    products: [
      {
        name: `${stockInfo.sector} Products`,
        category: stockInfo.sector,
        yearIntroduced: estimatedFounded
      }
    ],
    intellectualProperty: {
      patents: Math.floor(100 + Math.random() * 400), // Random between 100-500
      trademarks: [stockInfo.name]
    },
    financials: {
      revenue: Math.floor(500 + Math.random() * 4500), // Random revenue
      netIncome: Math.floor(50 + Math.random() * 450), // Random net income
      assets: Math.floor(800 + Math.random() * 4200), // Random assets
      year: currentYear
    },
    employees: Math.floor(5000 + Math.random() * 45000), // Random employee count
    employeeYear: currentYear,
    isAvailable: true,
    isDynamic: true // Flag to indicate this is generated data
  };
}

// Get company information filtered by time (only show products/data available at that time)
function getCompanyInfoAtTime(symbol, currentTime) {
  const company = companyData[symbol];
  const currentYear = currentTime.getFullYear();
  
  // If we have detailed company data, use it
  if (company) {
    // Filter products by year introduced
    const availableProducts = company.products.filter(p => p.yearIntroduced <= currentYear);
    
    // Get financial data for the closest year
    const financialYears = Object.keys(company.financials.revenue).map(Number).sort((a, b) => a - b);
    const closestYear = financialYears.reduce((prev, curr) => {
      return Math.abs(curr - currentYear) < Math.abs(prev - currentYear) ? curr : prev;
    });
    
    // Get IP data for the closest year
    const patentYears = Object.keys(company.intellectualProperty.patents).map(Number).sort((a, b) => a - b);
    const closestPatentYear = patentYears.reduce((prev, curr) => {
      return Math.abs(curr - currentYear) < Math.abs(prev - currentYear) ? curr : prev;
    });
    
    // Get employee count for the closest year
    const employeeYears = Object.keys(company.employees).map(Number).sort((a, b) => a - b);
    const closestEmployeeYear = employeeYears.reduce((prev, curr) => {
      return Math.abs(curr - currentYear) < Math.abs(prev - currentYear) ? curr : prev;
    });
    
    return {
      ...company,
      products: availableProducts,
      intellectualProperty: {
        ...company.intellectualProperty,
        patents: company.intellectualProperty.patents[closestPatentYear]
      },
      financials: {
        revenue: company.financials.revenue[closestYear],
        netIncome: company.financials.netIncome[closestYear],
        assets: company.financials.assets[closestYear],
        year: closestYear
      },
      employees: company.employees[closestEmployeeYear],
      employeeYear: closestEmployeeYear,
      isAvailable: currentYear >= company.founded,
      isDynamic: false
    };
  }
  
  // Otherwise, try to generate dynamic company info from stock data
  const stocks = require('./stocks');
  const stockInfo = stocks.getStockPrice(symbol, currentTime);
  
  if (stockInfo) {
    return generateDynamicCompanyInfo(symbol, stockInfo, currentYear);
  }
  
  return null;
}

// Get all companies
function getAllCompanies() {
  return Object.keys(companyData);
}

module.exports = {
  getCompanyInfo,
  getCompanyInfoAtTime,
  getAllCompanies
};
