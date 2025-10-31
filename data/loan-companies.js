// Loan companies with varying trustworthiness levels
// Interest rates, terms, and penalties vary based on company trustworthiness

const loanCompanies = [
  // Extremely shady - highest rates, worst terms
  {
    id: 'fast-cash',
    name: 'Fast Cash Loans',
    trustLevel: 1, // 1-10 scale (1 = extremely shady, 10 = most trustworthy)
    description: 'Need cash NOW? No credit check! Same day approval!',
    minCreditScore: 0, // Accepts anyone
    baseInterestRate: 0.35, // 35% annual
    latePaymentPenalty: 0.15, // 15% penalty on missed payment
    creditScoreImpact: {
      onTime: 2,  // Small credit score increase for on-time payment
      late: -15,  // Large credit score decrease for late payment
      default: -50 // Severe credit score decrease for default
    },
    availableFrom: new Date('1970-01-01'),
    minLoan: 100,
    maxLoan: 5000,
    termDays: 90, // Short 90-day terms
    originationFee: 0.10 // 10% origination fee
  },
  {
    id: 'payday-express',
    name: 'Payday Express',
    trustLevel: 2,
    description: 'Quick payday loans with flexible terms',
    minCreditScore: 300,
    baseInterestRate: 0.28, // 28% annual
    latePaymentPenalty: 0.12,
    creditScoreImpact: {
      onTime: 3,
      late: -12,
      default: -40
    },
    availableFrom: new Date('1975-01-01'),
    minLoan: 200,
    maxLoan: 10000,
    termDays: 180,
    originationFee: 0.08
  },
  
  // Moderately shady
  {
    id: 'quick-credit',
    name: 'Quick Credit Solutions',
    trustLevel: 4,
    description: 'Flexible personal loans for those with less-than-perfect credit',
    minCreditScore: 450,
    baseInterestRate: 0.18, // 18% annual
    latePaymentPenalty: 0.08,
    creditScoreImpact: {
      onTime: 4,
      late: -10,
      default: -30
    },
    availableFrom: new Date('1980-01-01'),
    minLoan: 500,
    maxLoan: 20000,
    termDays: 365,
    originationFee: 0.05
  },
  {
    id: 'community-lending',
    name: 'Community Lending Group',
    trustLevel: 5,
    description: 'Community-focused lending with fair terms',
    minCreditScore: 550,
    baseInterestRate: 0.14, // 14% annual
    latePaymentPenalty: 0.06,
    creditScoreImpact: {
      onTime: 5,
      late: -8,
      default: -25
    },
    availableFrom: new Date('1985-01-01'),
    minLoan: 1000,
    maxLoan: 30000,
    termDays: 365,
    originationFee: 0.04
  },
  
  // Moderate trustworthiness
  {
    id: 'regional-bank',
    name: 'Regional Bank Personal Loans',
    trustLevel: 6,
    description: 'Traditional personal loans from your local bank',
    minCreditScore: 600,
    baseInterestRate: 0.11, // 11% annual
    latePaymentPenalty: 0.05,
    creditScoreImpact: {
      onTime: 6,
      late: -7,
      default: -20
    },
    availableFrom: new Date('1970-01-01'),
    minLoan: 2000,
    maxLoan: 50000,
    termDays: 730, // 2 years
    originationFee: 0.03
  },
  {
    id: 'national-credit',
    name: 'National Credit Union',
    trustLevel: 7,
    description: 'Member-focused lending with competitive rates',
    minCreditScore: 650,
    baseInterestRate: 0.09, // 9% annual
    latePaymentPenalty: 0.04,
    creditScoreImpact: {
      onTime: 7,
      late: -6,
      default: -18
    },
    availableFrom: new Date('1970-01-01'),
    minLoan: 3000,
    maxLoan: 75000,
    termDays: 1095, // 3 years
    originationFee: 0.02
  },
  
  // High trustworthiness
  {
    id: 'prime-lending',
    name: 'Prime Lending Corp',
    trustLevel: 8,
    description: 'Premium lending for qualified borrowers',
    minCreditScore: 700,
    baseInterestRate: 0.07, // 7% annual
    latePaymentPenalty: 0.03,
    creditScoreImpact: {
      onTime: 8,
      late: -5,
      default: -15
    },
    availableFrom: new Date('1990-01-01'),
    minLoan: 5000,
    maxLoan: 100000,
    termDays: 1825, // 5 years
    originationFee: 0.015
  },
  {
    id: 'wealth-management',
    name: 'Wealth Management Bank',
    trustLevel: 9,
    description: 'Exclusive lending for high-credit customers',
    minCreditScore: 750,
    baseInterestRate: 0.05, // 5% annual
    latePaymentPenalty: 0.02,
    creditScoreImpact: {
      onTime: 10,
      late: -4,
      default: -12
    },
    availableFrom: new Date('1995-01-01'),
    minLoan: 10000,
    maxLoan: 200000,
    termDays: 2555, // 7 years
    originationFee: 0.01
  },
  
  // Most trustworthy
  {
    id: 'elite-credit',
    name: 'Elite Credit Partners',
    trustLevel: 10,
    description: 'Ultra-low rates for excellent credit',
    minCreditScore: 800,
    baseInterestRate: 0.03, // 3% annual
    latePaymentPenalty: 0.01,
    creditScoreImpact: {
      onTime: 12,
      late: -3,
      default: -10
    },
    availableFrom: new Date('2000-01-01'),
    minLoan: 25000,
    maxLoan: 500000,
    termDays: 3650, // 10 years
    originationFee: 0.005
  }
];

// Get available loan companies at a given time based on credit score
function getAvailableCompanies(currentTime, creditScore) {
  return loanCompanies.filter(company => {
    return currentTime >= company.availableFrom && creditScore >= company.minCreditScore;
  }).sort((a, b) => b.trustLevel - a.trustLevel); // Sort by trust level descending
}

// Get a specific company by ID
function getCompany(companyId) {
  return loanCompanies.find(c => c.id === companyId);
}

// Calculate adjusted interest rate based on credit score
// Better credit score = lower rate (up to 30% reduction for excellent credit)
function getAdjustedInterestRate(company, creditScore) {
  const baseRate = company.baseInterestRate;
  
  // Credit score ranges and discounts
  // 800+: 30% discount
  // 750-799: 20% discount
  // 700-749: 10% discount
  // 650-699: 5% discount
  // Below 650: no discount (could even increase for very low scores)
  
  let discount = 0;
  if (creditScore >= 800) {
    discount = 0.30;
  } else if (creditScore >= 750) {
    discount = 0.20;
  } else if (creditScore >= 700) {
    discount = 0.10;
  } else if (creditScore >= 650) {
    discount = 0.05;
  } else if (creditScore < 500) {
    // Penalty for very low credit scores
    discount = -0.20; // 20% increase
  } else if (creditScore < 550) {
    discount = -0.10; // 10% increase
  }
  
  return baseRate * (1 - discount);
}

module.exports = {
  loanCompanies,
  getAvailableCompanies,
  getCompany,
  getAdjustedInterestRate
};
