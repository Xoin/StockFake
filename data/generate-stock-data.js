// Script to generate historical stock data for 200 companies from 1970 to current day
// This creates realistic stock data based on major market companies that were relevant each year

const fs = require('fs');
const path = require('path');

// Top 200 companies that were relevant from 1970s onwards
// These represent major companies across different eras and sectors
const companies = [
  // Technology Giants (emerged in different eras)
  { symbol: 'IBM', name: 'International Business Machines', sector: 'Technology', foundedYear: 1911, relevantFrom: 1970 },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', foundedYear: 1976, relevantFrom: 1980 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', foundedYear: 1975, relevantFrom: 1986 },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology', foundedYear: 1977, relevantFrom: 1986 },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', foundedYear: 1968, relevantFrom: 1971 },
  { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology', foundedYear: 1984, relevantFrom: 1990 },
  { symbol: 'HPQ', name: 'Hewlett-Packard', sector: 'Technology', foundedYear: 1939, relevantFrom: 1970 },
  { symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology', foundedYear: 1930, relevantFrom: 1970 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', foundedYear: 1969, relevantFrom: 1972 },
  { symbol: 'DELL', name: 'Dell Technologies', sector: 'Technology', foundedYear: 1984, relevantFrom: 1988 },
  
  // Internet/Modern Tech (1990s-2000s)
  { symbol: 'AMZN', name: 'Amazon.com', sector: 'Technology', foundedYear: 1994, relevantFrom: 1997 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', foundedYear: 1998, relevantFrom: 2004 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Technology', foundedYear: 2004, relevantFrom: 2012 },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Technology', foundedYear: 1997, relevantFrom: 2002 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', foundedYear: 1993, relevantFrom: 1999 },
  { symbol: 'CRM', name: 'Salesforce', sector: 'Technology', foundedYear: 1999, relevantFrom: 2004 },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', foundedYear: 1982, relevantFrom: 1986 },
  { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Technology', foundedYear: 1998, relevantFrom: 2002 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', foundedYear: 2003, relevantFrom: 2010 },
  
  // Oil & Energy
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', foundedYear: 1870, relevantFrom: 1970 },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy', foundedYear: 1879, relevantFrom: 1970 },
  { symbol: 'BP', name: 'BP plc', sector: 'Energy', foundedYear: 1909, relevantFrom: 1970 },
  { symbol: 'RDS', name: 'Royal Dutch Shell', sector: 'Energy', foundedYear: 1907, relevantFrom: 1970 },
  { symbol: 'TOT', name: 'TotalEnergies', sector: 'Energy', foundedYear: 1924, relevantFrom: 1970 },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy', foundedYear: 1917, relevantFrom: 1970 },
  { symbol: 'SLB', name: 'Schlumberger', sector: 'Energy', foundedYear: 1926, relevantFrom: 1970 },
  { symbol: 'OXY', name: 'Occidental Petroleum', sector: 'Energy', foundedYear: 1920, relevantFrom: 1970 },
  
  // Industrials & Manufacturing
  { symbol: 'GE', name: 'General Electric', sector: 'Industrial', foundedYear: 1892, relevantFrom: 1970 },
  { symbol: 'BA', name: 'Boeing Company', sector: 'Aerospace', foundedYear: 1916, relevantFrom: 1970 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrial', foundedYear: 1925, relevantFrom: 1970 },
  { symbol: 'MMM', name: '3M Company', sector: 'Industrial', foundedYear: 1902, relevantFrom: 1970 },
  { symbol: 'HON', name: 'Honeywell International', sector: 'Industrial', foundedYear: 1906, relevantFrom: 1970 },
  { symbol: 'LMT', name: 'Lockheed Martin', sector: 'Aerospace', foundedYear: 1912, relevantFrom: 1970 },
  { symbol: 'UTX', name: 'United Technologies', sector: 'Industrial', foundedYear: 1934, relevantFrom: 1970 },
  { symbol: 'DE', name: 'Deere & Company', sector: 'Industrial', foundedYear: 1837, relevantFrom: 1970 },
  { symbol: 'EMR', name: 'Emerson Electric', sector: 'Industrial', foundedYear: 1890, relevantFrom: 1970 },
  
  // Automotive
  { symbol: 'GM', name: 'General Motors', sector: 'Automotive', foundedYear: 1908, relevantFrom: 1970 },
  { symbol: 'F', name: 'Ford Motor Company', sector: 'Automotive', foundedYear: 1903, relevantFrom: 1970 },
  { symbol: 'TM', name: 'Toyota Motor Corp', sector: 'Automotive', foundedYear: 1937, relevantFrom: 1972 },
  { symbol: 'HMC', name: 'Honda Motor Co.', sector: 'Automotive', foundedYear: 1948, relevantFrom: 1975 },
  
  // Pharmaceuticals & Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', foundedYear: 1886, relevantFrom: 1970 },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Pharmaceuticals', foundedYear: 1849, relevantFrom: 1970 },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Pharmaceuticals', foundedYear: 1891, relevantFrom: 1970 },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Pharmaceuticals', foundedYear: 2013, relevantFrom: 2013 },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Pharmaceuticals', foundedYear: 1876, relevantFrom: 1970 },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Pharmaceuticals', foundedYear: 1887, relevantFrom: 1970 },
  { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Biotechnology', foundedYear: 1980, relevantFrom: 1983 },
  { symbol: 'GILD', name: 'Gilead Sciences', sector: 'Biotechnology', foundedYear: 1987, relevantFrom: 1992 },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', foundedYear: 1977, relevantFrom: 1984 },
  { symbol: 'CVS', name: 'CVS Health', sector: 'Healthcare', foundedYear: 1963, relevantFrom: 1970 },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare', foundedYear: 1888, relevantFrom: 1970 },
  
  // Financial Services
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financial', foundedYear: 1799, relevantFrom: 1970 },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financial', foundedYear: 1784, relevantFrom: 1970 },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'Financial', foundedYear: 1852, relevantFrom: 1970 },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Financial', foundedYear: 1812, relevantFrom: 1970 },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financial', foundedYear: 1869, relevantFrom: 1970 },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financial', foundedYear: 1935, relevantFrom: 1970 },
  { symbol: 'AXP', name: 'American Express', sector: 'Financial', foundedYear: 1850, relevantFrom: 1970 },
  { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'Financial', foundedYear: 1988, relevantFrom: 1999 },
  { symbol: 'SCHW', name: 'Charles Schwab', sector: 'Financial', foundedYear: 1971, relevantFrom: 1975 },
  { symbol: 'USB', name: 'U.S. Bancorp', sector: 'Financial', foundedYear: 1863, relevantFrom: 1970 },
  { symbol: 'PNC', name: 'PNC Financial Services', sector: 'Financial', foundedYear: 1845, relevantFrom: 1970 },
  { symbol: 'TFC', name: 'Truist Financial', sector: 'Financial', foundedYear: 1872, relevantFrom: 1970 },
  
  // Insurance
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financial', foundedYear: 1839, relevantFrom: 1970 },
  { symbol: 'AIG', name: 'American International Group', sector: 'Insurance', foundedYear: 1919, relevantFrom: 1970 },
  { symbol: 'MET', name: 'MetLife Inc.', sector: 'Insurance', foundedYear: 1868, relevantFrom: 1970 },
  { symbol: 'PRU', name: 'Prudential Financial', sector: 'Insurance', foundedYear: 1875, relevantFrom: 1970 },
  { symbol: 'ALL', name: 'Allstate Corporation', sector: 'Insurance', foundedYear: 1931, relevantFrom: 1970 },
  { symbol: 'TRV', name: 'Travelers Companies', sector: 'Insurance', foundedYear: 1853, relevantFrom: 1970 },
  { symbol: 'PGR', name: 'Progressive Corporation', sector: 'Insurance', foundedYear: 1937, relevantFrom: 1971 },
  
  // Retail
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Retail', foundedYear: 1962, relevantFrom: 1972 },
  { symbol: 'HD', name: 'Home Depot', sector: 'Retail', foundedYear: 1978, relevantFrom: 1981 },
  { symbol: 'LOW', name: 'Lowe\'s Companies', sector: 'Retail', foundedYear: 1946, relevantFrom: 1970 },
  { symbol: 'TGT', name: 'Target Corporation', sector: 'Retail', foundedYear: 1902, relevantFrom: 1970 },
  { symbol: 'COST', name: 'Costco Wholesale', sector: 'Retail', foundedYear: 1976, relevantFrom: 1983 },
  { symbol: 'KR', name: 'Kroger Company', sector: 'Retail', foundedYear: 1883, relevantFrom: 1970 },
  { symbol: 'JCP', name: 'J.C. Penney', sector: 'Retail', foundedYear: 1902, relevantFrom: 1970 },
  { symbol: 'SHLD', name: 'Sears Holdings', sector: 'Retail', foundedYear: 1886, relevantFrom: 1970 },
  { symbol: 'KSS', name: 'Kohl\'s Corporation', sector: 'Retail', foundedYear: 1962, relevantFrom: 1986 },
  
  // Consumer Goods
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Goods', foundedYear: 1837, relevantFrom: 1970 },
  { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Beverages', foundedYear: 1886, relevantFrom: 1970 },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Beverages', foundedYear: 1898, relevantFrom: 1970 },
  { symbol: 'PM', name: 'Philip Morris', sector: 'Tobacco', foundedYear: 1847, relevantFrom: 1970 },
  { symbol: 'MO', name: 'Altria Group', sector: 'Tobacco', foundedYear: 1822, relevantFrom: 1970 },
  { symbol: 'CL', name: 'Colgate-Palmolive', sector: 'Consumer Goods', foundedYear: 1806, relevantFrom: 1970 },
  { symbol: 'KMB', name: 'Kimberly-Clark', sector: 'Consumer Goods', foundedYear: 1872, relevantFrom: 1970 },
  { symbol: 'GIS', name: 'General Mills', sector: 'Food', foundedYear: 1866, relevantFrom: 1970 },
  { symbol: 'K', name: 'Kellogg Company', sector: 'Food', foundedYear: 1906, relevantFrom: 1970 },
  { symbol: 'CPB', name: 'Campbell Soup', sector: 'Food', foundedYear: 1869, relevantFrom: 1970 },
  { symbol: 'HSY', name: 'Hershey Company', sector: 'Food', foundedYear: 1894, relevantFrom: 1970 },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', sector: 'Restaurants', foundedYear: 1940, relevantFrom: 1970 },
  { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Restaurants', foundedYear: 1971, relevantFrom: 1992 },
  { symbol: 'YUM', name: 'Yum! Brands', sector: 'Restaurants', foundedYear: 1997, relevantFrom: 1997 },
  { symbol: 'NKE', name: 'Nike Inc.', sector: 'Apparel', foundedYear: 1964, relevantFrom: 1972 },
  
  // Telecom
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Telecommunications', foundedYear: 1885, relevantFrom: 1970 },
  { symbol: 'VZ', name: 'Verizon Communications', sector: 'Telecommunications', foundedYear: 1983, relevantFrom: 1984 },
  { symbol: 'TMUS', name: 'T-Mobile US', sector: 'Telecommunications', foundedYear: 1994, relevantFrom: 2001 },
  { symbol: 'CTL', name: 'CenturyLink', sector: 'Telecommunications', foundedYear: 1930, relevantFrom: 1970 },
  { symbol: 'S', name: 'Sprint Corporation', sector: 'Telecommunications', foundedYear: 1899, relevantFrom: 1970 },
  
  // Media & Entertainment
  { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Entertainment', foundedYear: 1923, relevantFrom: 1970 },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Media', foundedYear: 1963, relevantFrom: 1972 },
  { symbol: 'TWX', name: 'Time Warner', sector: 'Media', foundedYear: 1923, relevantFrom: 1970 },
  { symbol: 'FOXA', name: 'Fox Corporation', sector: 'Media', foundedYear: 1979, relevantFrom: 1986 },
  { symbol: 'VIAB', name: 'ViacomCBS', sector: 'Media', foundedYear: 1952, relevantFrom: 1970 },
  { symbol: 'SNE', name: 'Sony Corporation', sector: 'Electronics', foundedYear: 1946, relevantFrom: 1970 },
  
  // Chemicals & Materials
  { symbol: 'DOW', name: 'Dow Chemical', sector: 'Chemicals', foundedYear: 1897, relevantFrom: 1970 },
  { symbol: 'DD', name: 'DuPont de Nemours', sector: 'Chemicals', foundedYear: 1802, relevantFrom: 1970 },
  { symbol: 'LYB', name: 'LyondellBasell', sector: 'Chemicals', foundedYear: 2007, relevantFrom: 2010 },
  { symbol: 'ECL', name: 'Ecolab Inc.', sector: 'Chemicals', foundedYear: 1923, relevantFrom: 1970 },
  { symbol: 'APD', name: 'Air Products', sector: 'Chemicals', foundedYear: 1940, relevantFrom: 1970 },
  { symbol: 'PPG', name: 'PPG Industries', sector: 'Chemicals', foundedYear: 1883, relevantFrom: 1970 },
  { symbol: 'NEM', name: 'Newmont Corporation', sector: 'Mining', foundedYear: 1916, relevantFrom: 1970 },
  { symbol: 'FCX', name: 'Freeport-McMoRan', sector: 'Mining', foundedYear: 1912, relevantFrom: 1970 },
  
  // Utilities
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Utilities', foundedYear: 1925, relevantFrom: 1970 },
  { symbol: 'DUK', name: 'Duke Energy', sector: 'Utilities', foundedYear: 1904, relevantFrom: 1970 },
  { symbol: 'SO', name: 'Southern Company', sector: 'Utilities', foundedYear: 1945, relevantFrom: 1970 },
  { symbol: 'D', name: 'Dominion Energy', sector: 'Utilities', foundedYear: 1983, relevantFrom: 1983 },
  { symbol: 'EXC', name: 'Exelon Corporation', sector: 'Utilities', foundedYear: 2000, relevantFrom: 2000 },
  { symbol: 'AEP', name: 'American Electric Power', sector: 'Utilities', foundedYear: 1906, relevantFrom: 1970 },
  
  // Real Estate & Construction
  { symbol: 'AMT', name: 'American Tower', sector: 'Real Estate', foundedYear: 1995, relevantFrom: 1998 },
  { symbol: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate', foundedYear: 1983, relevantFrom: 1997 },
  { symbol: 'CCI', name: 'Crown Castle', sector: 'Real Estate', foundedYear: 1994, relevantFrom: 1998 },
  { symbol: 'SPG', name: 'Simon Property Group', sector: 'Real Estate', foundedYear: 1960, relevantFrom: 1993 },
  
  // Transportation
  { symbol: 'UPS', name: 'United Parcel Service', sector: 'Transportation', foundedYear: 1907, relevantFrom: 1975 },
  { symbol: 'FDX', name: 'FedEx Corporation', sector: 'Transportation', foundedYear: 1971, relevantFrom: 1978 },
  { symbol: 'UAL', name: 'United Airlines', sector: 'Airlines', foundedYear: 1926, relevantFrom: 1970 },
  { symbol: 'DAL', name: 'Delta Air Lines', sector: 'Airlines', foundedYear: 1924, relevantFrom: 1970 },
  { symbol: 'AAL', name: 'American Airlines', sector: 'Airlines', foundedYear: 1930, relevantFrom: 1970 },
  { symbol: 'LUV', name: 'Southwest Airlines', sector: 'Airlines', foundedYear: 1967, relevantFrom: 1971 },
  
  // Additional Major Companies (bringing total toward 200)
  { symbol: 'MDT', name: 'Medtronic plc', sector: 'Healthcare', foundedYear: 1949, relevantFrom: 1970 },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare', foundedYear: 1956, relevantFrom: 1970 },
  { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Industrial', foundedYear: 1969, relevantFrom: 1984 },
  { symbol: 'UNP', name: 'Union Pacific', sector: 'Transportation', foundedYear: 1862, relevantFrom: 1970 },
  { symbol: 'NSC', name: 'Norfolk Southern', sector: 'Transportation', foundedYear: 1883, relevantFrom: 1970 },
  { symbol: 'CSX', name: 'CSX Corporation', sector: 'Transportation', foundedYear: 1827, relevantFrom: 1970 },
  { symbol: 'RTX', name: 'Raytheon Technologies', sector: 'Aerospace', foundedYear: 1922, relevantFrom: 1970 },
  { symbol: 'GD', name: 'General Dynamics', sector: 'Aerospace', foundedYear: 1899, relevantFrom: 1970 },
  { symbol: 'NOC', name: 'Northrop Grumman', sector: 'Aerospace', foundedYear: 1939, relevantFrom: 1970 },
  { symbol: 'TXT', name: 'Textron Inc.', sector: 'Aerospace', foundedYear: 1923, relevantFrom: 1970 },
  { symbol: 'ETN', name: 'Eaton Corporation', sector: 'Industrial', foundedYear: 1911, relevantFrom: 1970 },
  { symbol: 'ITW', name: 'Illinois Tool Works', sector: 'Industrial', foundedYear: 1912, relevantFrom: 1970 },
  { symbol: 'PH', name: 'Parker Hannifin', sector: 'Industrial', foundedYear: 1917, relevantFrom: 1970 },
  { symbol: 'CMI', name: 'Cummins Inc.', sector: 'Industrial', foundedYear: 1919, relevantFrom: 1970 },
  { symbol: 'ROK', name: 'Rockwell Automation', sector: 'Industrial', foundedYear: 1903, relevantFrom: 1970 },
  { symbol: 'SPR', name: 'Spirit AeroSystems', sector: 'Aerospace', foundedYear: 2005, relevantFrom: 2006 },
  { symbol: 'WM', name: 'Waste Management', sector: 'Services', foundedYear: 1968, relevantFrom: 1971 },
  { symbol: 'RSG', name: 'Republic Services', sector: 'Services', foundedYear: 1996, relevantFrom: 1998 },
  { symbol: 'ADM', name: 'Archer Daniels Midland', sector: 'Food Processing', foundedYear: 1902, relevantFrom: 1970 },
  { symbol: 'BG', name: 'Bunge Limited', sector: 'Food Processing', foundedYear: 1818, relevantFrom: 1970 },
  { symbol: 'CAG', name: 'Conagra Brands', sector: 'Food', foundedYear: 1919, relevantFrom: 1970 },
  { symbol: 'SJM', name: 'J.M. Smucker', sector: 'Food', foundedYear: 1897, relevantFrom: 1970 },
  { symbol: 'HRL', name: 'Hormel Foods', sector: 'Food', foundedYear: 1891, relevantFrom: 1970 },
  { symbol: 'TSN', name: 'Tyson Foods', sector: 'Food', foundedYear: 1935, relevantFrom: 1970 },
  { symbol: 'CLX', name: 'Clorox Company', sector: 'Consumer Goods', foundedYear: 1913, relevantFrom: 1970 },
  { symbol: 'CHD', name: 'Church & Dwight', sector: 'Consumer Goods', foundedYear: 1846, relevantFrom: 1970 },
  { symbol: 'EL', name: 'Estée Lauder', sector: 'Consumer Goods', foundedYear: 1946, relevantFrom: 1970 },
  { symbol: 'AVY', name: 'Avery Dennison', sector: 'Industrial', foundedYear: 1935, relevantFrom: 1970 },
  { symbol: 'BLL', name: 'Ball Corporation', sector: 'Packaging', foundedYear: 1880, relevantFrom: 1970 },
  { symbol: 'PKG', name: 'Packaging Corp', sector: 'Packaging', foundedYear: 1959, relevantFrom: 1970 },
  { symbol: 'IP', name: 'International Paper', sector: 'Paper', foundedYear: 1898, relevantFrom: 1970 },
  { symbol: 'WY', name: 'Weyerhaeuser', sector: 'Forestry', foundedYear: 1900, relevantFrom: 1970 },
  { symbol: 'MLM', name: 'Martin Marietta', sector: 'Materials', foundedYear: 1939, relevantFrom: 1970 },
  { symbol: 'VMC', name: 'Vulcan Materials', sector: 'Materials', foundedYear: 1909, relevantFrom: 1970 },
  { symbol: 'NUE', name: 'Nucor Corporation', sector: 'Steel', foundedYear: 1940, relevantFrom: 1972 },
  { symbol: 'STLD', name: 'Steel Dynamics', sector: 'Steel', foundedYear: 1993, relevantFrom: 1996 },
  { symbol: 'X', name: 'United States Steel', sector: 'Steel', foundedYear: 1901, relevantFrom: 1970 },
  { symbol: 'AA', name: 'Alcoa Corporation', sector: 'Metals', foundedYear: 1888, relevantFrom: 1970 },
  { symbol: 'ALB', name: 'Albemarle Corporation', sector: 'Chemicals', foundedYear: 1887, relevantFrom: 1970 },
  { symbol: 'CE', name: 'Celanese Corporation', sector: 'Chemicals', foundedYear: 1918, relevantFrom: 1970 },
  { symbol: 'EMN', name: 'Eastman Chemical', sector: 'Chemicals', foundedYear: 1920, relevantFrom: 1970 },
  { symbol: 'FMC', name: 'FMC Corporation', sector: 'Chemicals', foundedYear: 1883, relevantFrom: 1970 },
  { symbol: 'IFF', name: 'International Flavors', sector: 'Chemicals', foundedYear: 1889, relevantFrom: 1970 },
  { symbol: 'MOS', name: 'Mosaic Company', sector: 'Chemicals', foundedYear: 2004, relevantFrom: 2004 },
  { symbol: 'CF', name: 'CF Industries', sector: 'Chemicals', foundedYear: 1946, relevantFrom: 1970 },
  { symbol: 'WDC', name: 'Western Digital', sector: 'Technology', foundedYear: 1970, relevantFrom: 1976 },
  { symbol: 'STX', name: 'Seagate Technology', sector: 'Technology', foundedYear: 1978, relevantFrom: 1981 },
  { symbol: 'NTAP', name: 'NetApp Inc.', sector: 'Technology', foundedYear: 1992, relevantFrom: 1995 },
  { symbol: 'FFIV', name: 'F5 Networks', sector: 'Technology', foundedYear: 1996, relevantFrom: 1999 },
  { symbol: 'JNPR', name: 'Juniper Networks', sector: 'Technology', foundedYear: 1996, relevantFrom: 1999 },
  { symbol: 'AMAT', name: 'Applied Materials', sector: 'Technology', foundedYear: 1967, relevantFrom: 1972 },
  { symbol: 'KLAC', name: 'KLA Corporation', sector: 'Technology', foundedYear: 1975, relevantFrom: 1980 },
  { symbol: 'LRCX', name: 'Lam Research', sector: 'Technology', foundedYear: 1980, relevantFrom: 1984 },
  { symbol: 'MCHP', name: 'Microchip Technology', sector: 'Technology', foundedYear: 1987, relevantFrom: 1993 },
  { symbol: 'MU', name: 'Micron Technology', sector: 'Technology', foundedYear: 1978, relevantFrom: 1984 },
  { symbol: 'QCOM', name: 'Qualcomm Inc.', sector: 'Technology', foundedYear: 1985, relevantFrom: 1991 },
  { symbol: 'SWKS', name: 'Skyworks Solutions', sector: 'Technology', foundedYear: 1962, relevantFrom: 2002 },
  { symbol: 'XLNX', name: 'Xilinx Inc.', sector: 'Technology', foundedYear: 1984, relevantFrom: 1990 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', foundedYear: 1991, relevantFrom: 1998 },
  { symbol: 'QRVO', name: 'Qorvo Inc.', sector: 'Technology', foundedYear: 2015, relevantFrom: 2015 },
  { symbol: 'NOW', name: 'ServiceNow', sector: 'Technology', foundedYear: 2003, relevantFrom: 2012 },
  { symbol: 'WDAY', name: 'Workday Inc.', sector: 'Technology', foundedYear: 2005, relevantFrom: 2012 },
  { symbol: 'TEAM', name: 'Atlassian Corporation', sector: 'Technology', foundedYear: 2002, relevantFrom: 2015 },
  { symbol: 'ZM', name: 'Zoom Video', sector: 'Technology', foundedYear: 2011, relevantFrom: 2019 },
  { symbol: 'DOCU', name: 'DocuSign Inc.', sector: 'Technology', foundedYear: 2003, relevantFrom: 2018 },
  { symbol: 'SQ', name: 'Block Inc.', sector: 'Technology', foundedYear: 2009, relevantFrom: 2015 },
  { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'Technology', foundedYear: 2004, relevantFrom: 2015 },
  { symbol: 'SNAP', name: 'Snap Inc.', sector: 'Technology', foundedYear: 2011, relevantFrom: 2017 },
  { symbol: 'TWTR', name: 'Twitter Inc.', sector: 'Technology', foundedYear: 2006, relevantFrom: 2013 },
  { symbol: 'UBER', name: 'Uber Technologies', sector: 'Technology', foundedYear: 2009, relevantFrom: 2019 },
  { symbol: 'LYFT', name: 'Lyft Inc.', sector: 'Technology', foundedYear: 2012, relevantFrom: 2019 },
  { symbol: 'ABNB', name: 'Airbnb Inc.', sector: 'Technology', foundedYear: 2008, relevantFrom: 2020 },
  { symbol: 'COIN', name: 'Coinbase Global', sector: 'Technology', foundedYear: 2012, relevantFrom: 2021 },
  { symbol: 'RBLX', name: 'Roblox Corporation', sector: 'Technology', foundedYear: 2004, relevantFrom: 2021 },
];

// Historical market events that affected stock prices
const marketEvents = [
  { year: 1970, name: 'Recession begins', impact: -0.15 },
  { year: 1973, name: 'Oil Crisis', impact: -0.20, sectors: { 'Energy': 0.30 } },
  { year: 1974, name: 'Market crash', impact: -0.25 },
  { year: 1975, name: 'Recovery begins', impact: 0.30 },
  { year: 1980, name: 'Inflation peak', impact: -0.10 },
  { year: 1982, name: 'Bull market begins', impact: 0.20 },
  { year: 1987, name: 'Black Monday', impact: -0.22 },
  { year: 1990, name: 'Gulf War recession', impact: -0.10 },
  { year: 1995, name: 'Tech boom', impact: 0.25, sectors: { 'Technology': 0.50 } },
  { year: 2000, name: 'Dot-com crash', impact: -0.15, sectors: { 'Technology': -0.40 } },
  { year: 2001, name: '9/11 attacks', impact: -0.10 },
  { year: 2008, name: 'Financial crisis', impact: -0.40, sectors: { 'Financial': -0.60 } },
  { year: 2009, name: 'Recovery begins', impact: 0.25 },
  { year: 2020, name: 'COVID-19 pandemic', impact: -0.20, sectors: { 'Technology': 0.30, 'Airlines': -0.50 } },
  { year: 2021, name: 'Post-pandemic boom', impact: 0.25 },
];

// Synthetic company name generator
function generateCompanyName(sector, index) {
  const prefixes = ['Global', 'American', 'United', 'National', 'First', 'Premier', 'Advanced', 'Universal', 'Continental', 'Pacific', 'Atlantic', 'Central', 'Eastern', 'Western', 'Northern', 'Southern', 'International', 'Apex', 'Summit', 'Elite', 'Prime'];
  const suffixes = ['Corp', 'Inc', 'LLC', 'Group', 'Holdings', 'Industries', 'Systems', 'Solutions', 'Enterprises', 'Partners', 'Associates', 'Company', 'Technologies'];
  
  const sectorKeywords = {
    'Technology': ['Tech', 'Data', 'Digital', 'Cyber', 'Cloud', 'Software', 'Systems', 'Networks'],
    'Energy': ['Energy', 'Oil', 'Gas', 'Petroleum', 'Power', 'Resources', 'Fuel'],
    'Financial': ['Financial', 'Capital', 'Investment', 'Banking', 'Credit', 'Finance', 'Trust'],
    'Healthcare': ['Health', 'Medical', 'Care', 'Wellness', 'Clinical', 'Diagnostic'],
    'Industrial': ['Industrial', 'Manufacturing', 'Engineering', 'Machinery', 'Equipment'],
    'Retail': ['Retail', 'Stores', 'Markets', 'Shops', 'Commerce', 'Trade'],
    'Consumer Goods': ['Consumer', 'Products', 'Brands', 'Goods', 'Household'],
    'Telecommunications': ['Telecom', 'Communications', 'Network', 'Wireless', 'Mobile'],
    'Utilities': ['Utilities', 'Electric', 'Power', 'Water', 'Services'],
    'Automotive': ['Auto', 'Motors', 'Automotive', 'Vehicles', 'Transport'],
    'Aerospace': ['Aerospace', 'Aviation', 'Defense', 'Aircraft', 'Space'],
    'Pharmaceuticals': ['Pharma', 'Therapeutics', 'Drugs', 'Medicines', 'Biotech'],
    'Biotechnology': ['Biotech', 'Biosciences', 'Genetics', 'Molecular', 'Life Sciences'],
    'Insurance': ['Insurance', 'Assurance', 'Risk', 'Protection', 'Coverage'],
    'Mining': ['Mining', 'Minerals', 'Resources', 'Extraction', 'Metals'],
    'Chemicals': ['Chemical', 'Polymers', 'Materials', 'Compounds', 'Specialty'],
    'Materials': ['Materials', 'Resources', 'Components', 'Supplies'],
    'Transportation': ['Transport', 'Logistics', 'Freight', 'Shipping', 'Delivery'],
    'Airlines': ['Airlines', 'Airways', 'Air', 'Aviation', 'Flight'],
    'Media': ['Media', 'Broadcasting', 'Entertainment', 'Content', 'Publishing'],
    'Entertainment': ['Entertainment', 'Studios', 'Productions', 'Gaming', 'Recreation'],
    'Real Estate': ['Realty', 'Properties', 'Real Estate', 'Development', 'Land'],
    'Services': ['Services', 'Professional', 'Business', 'Consulting', 'Solutions'],
    'Food': ['Food', 'Foods', 'Nutrition', 'Culinary', 'Provisions'],
    'Beverages': ['Beverages', 'Drinks', 'Bottling', 'Brewing', 'Distillery'],
    'Tobacco': ['Tobacco', 'Smoking', 'Cigarettes', 'Products'],
    'Apparel': ['Apparel', 'Fashion', 'Clothing', 'Textiles', 'Garments', 'Wear'],
    'Restaurants': ['Restaurants', 'Dining', 'Food Services', 'Eateries', 'Cuisine'],
    'Food Processing': ['Food Processing', 'Agriculture', 'Farming', 'Produce', 'Grains'],
    'Paper': ['Paper', 'Pulp', 'Packaging', 'Cardboard', 'Fiber'],
    'Forestry': ['Forestry', 'Timber', 'Wood', 'Lumber', 'Forest Products'],
    'Steel': ['Steel', 'Iron', 'Metalworks', 'Foundry', 'Alloys'],
    'Metals': ['Metals', 'Aluminum', 'Copper', 'Alloys', 'Metallurgy'],
    'Packaging': ['Packaging', 'Containers', 'Wrapping', 'Box', 'Cartons'],
    'Electronics': ['Electronics', 'Electronic', 'Components', 'Devices', 'Circuits']
  };
  
  const keywords = sectorKeywords[sector] || ['Industries'];
  const prefix = prefixes[index % prefixes.length];
  const keywordIndex = Math.floor(index / prefixes.length) % keywords.length;
  const keyword = keywords[keywordIndex];
  const suffixIndex = Math.floor(index / (prefixes.length * keywords.length)) % suffixes.length;
  const suffix = suffixes[suffixIndex];
  
  // Build name from available parts
  const parts = [prefix, keyword, suffix].filter(p => p !== undefined);
  return parts.join(' ');
}

// Generate ticker symbol from company name
function generateTicker(name, existingTickers) {
  // Extract uppercase letters and first letters of words
  const words = name.split(' ');
  let ticker = '';
  
  // Try using first letters of each word
  for (const word of words) {
    if (word.length > 0 && /^[A-Z]/.test(word[0])) {
      ticker += word[0];
    }
  }
  
  // If too short, add more letters from first word
  if (ticker.length < 3) {
    const firstWord = words[0];
    for (let i = 0; i < firstWord.length && ticker.length < 4; i++) {
      if (/^[A-Z]/.test(firstWord[i]) && !ticker.includes(firstWord[i])) {
        ticker += firstWord[i];
      }
    }
  }
  
  // Truncate to 4 characters max
  ticker = ticker.substring(0, 4);
  
  // Make sure it's unique
  let suffix = 1;
  let finalTicker = ticker;
  while (existingTickers.has(finalTicker)) {
    finalTicker = ticker.substring(0, 3) + suffix;
    suffix++;
  }
  
  existingTickers.add(finalTicker);
  return finalTicker;
}

// Generate synthetic companies to meet minimum per sector
function generateSyntheticCompanies(existingCompanies, minPerSector = 10) {
  // Count companies per sector
  const sectorCounts = {};
  const existingTickers = new Set();
  
  existingCompanies.forEach(company => {
    sectorCounts[company.sector] = (sectorCounts[company.sector] || 0) + 1;
    existingTickers.add(company.symbol);
  });
  
  // Determine which sectors need more companies
  const syntheticCompanies = [];
  const sectors = Object.keys(sectorCounts);
  
  sectors.forEach(sector => {
    const needed = minPerSector - sectorCounts[sector];
    if (needed > 0) {
      console.log(`  Generating ${needed} synthetic companies for ${sector} sector...`);
      
      for (let i = 0; i < needed; i++) {
        const name = generateCompanyName(sector, sectorCounts[sector] + i);
        const ticker = generateTicker(name, existingTickers);
        
        // Determine founding year and relevance
        // Spread synthetic companies across different eras
        const eras = [
          { start: 1970, end: 1979, relevantFrom: 1970 },
          { start: 1980, end: 1989, relevantFrom: 1980 },
          { start: 1990, end: 1999, relevantFrom: 1990 },
          { start: 2000, end: 2009, relevantFrom: 2000 },
          { start: 2010, end: 2020, relevantFrom: 2010 }
        ];
        
        const era = eras[i % eras.length];
        const foundedYear = era.start + Math.floor(Math.random() * (era.end - era.start + 1));
        
        syntheticCompanies.push({
          symbol: ticker,
          name: name,
          sector: sector,
          foundedYear: foundedYear,
          relevantFrom: era.relevantFrom,
          synthetic: true
        });
      }
    }
  });
  
  return syntheticCompanies;
}


// Enhanced price history with sector correlations and diverse growth profiles
function generatePriceHistory(company, seedOffset = 0) {
  const history = [];
  const startYear = company.relevantFrom;
  const currentYear = new Date().getFullYear();
  
  // Generate base starting price based on sector
  const sectorBasePrices = {
    'Technology': 25,
    'Energy': 30,
    'Financial': 40,
    'Healthcare': 35,
    'Industrial': 30,
    'Retail': 20,
    'Consumer Goods': 25,
    'Telecommunications': 35,
    'Utilities': 30,
    'Automotive': 25,
    'Aerospace': 35,
    'Pharmaceuticals': 40,
    'Biotechnology': 20,
    'Insurance': 45,
    'Mining': 28,
    'Chemicals': 32,
    'Materials': 30,
    'Transportation': 28,
    'Airlines': 25,
    'Media': 30,
    'Entertainment': 28,
    'Real Estate': 35,
    'Services': 25,
    'Food': 22,
    'Beverages': 24,
    'Tobacco': 40,
    'Apparel': 18,
    'Restaurants': 20,
    'Food Processing': 25,
    'Paper': 20,
    'Forestry': 22,
    'Steel': 25,
    'Metals': 28,
    'Packaging': 20,
    'Electronics': 30
  };
  
  let currentPrice = sectorBasePrices[company.sector] || 25;
  
  // Create deterministic seed for this company
  let seed = seedOffset;
  for (let i = 0; i < company.symbol.length; i++) {
    seed = (seed * 31 + company.symbol.charCodeAt(i)) % 1000000;
  }
  
  // Seeded random generator
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  // Add variety to starting prices (±40% for more diversity)
  currentPrice *= (0.6 + seededRandom() * 0.8);
  
  // Determine company growth profile (blue chip, growth, volatile, etc.)
  const profiles = ['stable', 'growth', 'volatile', 'cyclical', 'value'];
  const profile = profiles[Math.floor(seededRandom() * profiles.length)];
  
  // Profile-specific parameters
  const profileParams = {
    'stable': { baseGrowth: 0.015, volatility: 0.05, eventSensitivity: 0.7 },
    'growth': { baseGrowth: 0.035, volatility: 0.12, eventSensitivity: 1.2 },
    'volatile': { baseGrowth: 0.02, volatility: 0.20, eventSensitivity: 1.5 },
    'cyclical': { baseGrowth: 0.018, volatility: 0.15, eventSensitivity: 1.8 },
    'value': { baseGrowth: 0.012, volatility: 0.08, eventSensitivity: 0.9 }
  };
  
  const params = profileParams[profile];
  
  // Generate quarterly data points
  for (let year = startYear; year <= currentYear; year++) {
    for (let quarter = 0; quarter < 4; quarter++) {
      const month = quarter * 3;
      const date = new Date(year, month, 1);
      
      // Don't generate future dates
      if (date > new Date()) break;
      
      // Base growth rate
      let growthRate = params.baseGrowth;
      
      // Apply market events with profile-specific sensitivity
      const event = marketEvents.find(e => e.year === year);
      if (event) {
        if (event.sectors && event.sectors[company.sector]) {
          growthRate += (event.sectors[company.sector] / 4) * params.eventSensitivity;
        } else {
          growthRate += (event.impact / 4) * params.eventSensitivity;
        }
      }
      
      // Add sector-specific growth patterns
      if (company.sector === 'Technology' && year >= 1995) {
        growthRate += 0.03; // Tech boom
      }
      if (company.sector === 'Energy' && year >= 2000 && year <= 2008) {
        growthRate += 0.02; // Oil price surge
      }
      if (company.sector === 'Financial' && year >= 2002 && year <= 2007) {
        growthRate += 0.025; // Pre-crisis financial boom
      }
      if (company.sector === 'Real Estate' && year >= 2003 && year <= 2006) {
        growthRate += 0.03; // Housing bubble
      }
      
      // Add random variation based on profile volatility
      growthRate += (seededRandom() - 0.5) * params.volatility;
      
      // Update price
      currentPrice *= (1 + growthRate);
      
      // Ensure price doesn't go below $1
      currentPrice = Math.max(1, currentPrice);
      
      history.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(currentPrice.toFixed(2))
      });
    }
  }
  
  return history;
}


// Generate all stock data
function generateAllStockData() {
  const stockData = {};
  
  // First, add all real companies
  companies.forEach((company, index) => {
    console.log(`Generating data for ${company.symbol} (${company.name})...`);
    stockData[company.symbol] = {
      name: company.name,
      sector: company.sector,
      history: generatePriceHistory(company, index)
    };
  });
  
  // Generate synthetic companies to ensure min 10 per sector
  const syntheticCompanies = generateSyntheticCompanies(companies, 10);
  
  syntheticCompanies.forEach((company, index) => {
    console.log(`Generating data for synthetic ${company.symbol} (${company.name})...`);
    stockData[company.symbol] = {
      name: company.name,
      sector: company.sector,
      history: generatePriceHistory(company, index + 1000)
    };
  });
  
  return { stockData, totalCompanies: companies.length + syntheticCompanies.length };
}

// Generate and save the data
console.log('Generating historical stock data with minimum 10 stocks per sector...');
const { stockData, totalCompanies } = generateAllStockData();

const output = {
  generated: new Date().toISOString(),
  companies: totalCompanies,
  description: 'Historical stock data from 1970 to current day with minimum 10 stocks per sector',
  data: stockData
};

fs.writeFileSync(
  path.join(__dirname, 'historical-stock-data.json'),
  JSON.stringify(output, null, 2)
);

console.log(`✓ Generated data for ${totalCompanies} companies`);

// Count and display stocks per sector
const sectorCounts = {};
Object.values(stockData).forEach(stock => {
  sectorCounts[stock.sector] = (sectorCounts[stock.sector] || 0) + 1;
});

console.log('\nStocks per sector:');
Object.entries(sectorCounts)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([sector, count]) => {
    console.log(`  ${sector}: ${count}`);
  });

console.log('\n✓ Saved to data/historical-stock-data.json');
