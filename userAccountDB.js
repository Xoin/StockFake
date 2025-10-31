const db = require('./database');

// Helper functions to work with the user account in database

function getUserAccountData() {
  const account = db.getUserAccount().get();
  const marginAccount = db.getMarginAccount().get();
  const riskControls = db.getRiskControls().get();
  
  // Build portfolio object
  const portfolio = {};
  const portfolioRows = db.getPortfolio().all();
  portfolioRows.forEach(row => {
    portfolio[row.symbol] = row.shares;
  });
  
  // Build index fund holdings object
  const indexFundHoldings = {};
  const indexFundRows = db.getIndexFundHoldings().all();
  indexFundRows.forEach(row => {
    const purchaseHistory = db.getPurchaseHistory.all(row.symbol, 'indexfund');
    indexFundHoldings[row.symbol] = {
      shares: row.shares,
      purchaseHistory: purchaseHistory.map(p => ({
        date: new Date(p.date),
        shares: p.shares,
        pricePerShare: p.price_per_share
      }))
    };
  });
  
  // Build short positions object
  const shortPositions = {};
  const shortRows = db.getShortPositions().all();
  shortRows.forEach(row => {
    shortPositions[row.symbol] = {
      shares: row.shares,
      borrowPrice: row.borrow_price,
      borrowDate: new Date(row.borrow_date),
      lastFeeDate: row.last_fee_date ? new Date(row.last_fee_date) : null
    };
  });
  
  // Build purchase history object
  const purchaseHistory = {};
  const symbols = [...new Set(portfolioRows.map(r => r.symbol))];
  symbols.forEach(symbol => {
    const history = db.getPurchaseHistory.all(symbol, 'stock');
    if (history.length > 0) {
      purchaseHistory[symbol] = history.map(p => ({
        id: p.id,
        date: new Date(p.date),
        shares: p.shares,
        pricePerShare: p.price_per_share
      }));
    }
  });
  
  // Build shareholder influence object
  const shareholderInfluence = {};
  const influenceRows = db.getShareholderInfluence().all();
  influenceRows.forEach(row => {
    shareholderInfluence[row.symbol] = row.shares;
  });
  
  // Build last trade time object
  const lastTradeTime = {};
  // We'll populate this on demand from the database
  
  return {
    cash: account.cash,
    creditScore: account.credit_score,
    portfolio,
    indexFundHoldings,
    shortPositions,
    purchaseHistory,
    shareholderInfluence,
    lastTradeTime, // Will be populated on demand
    marginAccount: {
      marginBalance: marginAccount.margin_balance,
      marginInterestRate: marginAccount.margin_interest_rate,
      lastMarginInterestDate: marginAccount.last_margin_interest_date ? new Date(marginAccount.last_margin_interest_date) : null,
      hasMarginEnabled: Boolean(marginAccount.has_margin_enabled),
      marginCalls: db.getMarginCalls.all(100).map(mc => ({
        id: mc.id,
        issueDate: new Date(mc.issue_date),
        dueDate: new Date(mc.due_date),
        amountNeeded: mc.amount_needed,
        currentRatio: mc.current_ratio,
        requiredRatio: mc.required_ratio,
        status: mc.status,
        metDate: mc.met_date ? new Date(mc.met_date) : null,
        liquidationDate: mc.liquidation_date ? new Date(mc.liquidation_date) : null
      }))
    },
    riskControls: {
      maxLeverage: riskControls.max_leverage,
      maxPositionSize: riskControls.max_position_size,
      maintenanceMarginRatio: riskControls.maintenance_margin_ratio,
      concentrationWarningThreshold: riskControls.concentration_warning_threshold
    },
    loans: db.getLoans().all().map(loan => ({
      id: loan.id,
      companyId: loan.company_id,
      companyName: loan.company_name,
      principal: loan.principal,
      balance: loan.balance,
      interestRate: loan.interest_rate,
      startDate: new Date(loan.start_date),
      dueDate: new Date(loan.due_date),
      lastPaymentDate: loan.last_payment_date ? new Date(loan.last_payment_date) : null,
      lastInterestAccrual: loan.last_interest_accrual ? new Date(loan.last_interest_accrual) : null,
      missedPayments: loan.missed_payments,
      status: loan.status,
      markedAsMissed: Boolean(loan.marked_as_missed),
      termDays: loan.term_days
    })),
    transactions: db.getTransactions.all(20).map(tx => {
      const data = tx.data ? JSON.parse(tx.data) : {};
      return {
        date: new Date(tx.date),
        type: tx.type,
        symbol: tx.symbol,
        shares: tx.shares,
        pricePerShare: tx.price_per_share,
        tradingFee: tx.trading_fee,
        tax: tx.tax,
        total: tx.total,
        ...data
      };
    }),
    dividends: db.getDividends.all(10).map(div => ({
      date: new Date(div.date),
      quarter: div.quarter,
      grossAmount: div.gross_amount,
      tax: div.tax,
      netAmount: div.net_amount,
      details: JSON.parse(div.details || '[]')
    })),
    taxes: db.getTaxes.all(10).map(tax => ({
      date: new Date(tax.date),
      type: tax.type,
      amount: tax.amount,
      description: tax.description
    })),
    fees: db.getFees.all(10).map(fee => ({
      date: new Date(fee.date),
      type: fee.type,
      amount: fee.amount,
      description: fee.description
    })),
    loanHistory: db.getLoanHistory.all(20).map(lh => {
      const data = lh.data ? JSON.parse(lh.data) : {};
      return {
        date: new Date(lh.date),
        type: lh.type,
        loanId: lh.loan_id,
        companyId: lh.company_id,
        ...data
      };
    })
  };
}

function updateCash(amount) {
  const account = db.getUserAccount().get();
  db.updateUserAccount.run(account.cash + amount, account.credit_score);
}

function setCash(amount) {
  const account = db.getUserAccount().get();
  db.updateUserAccount.run(amount, account.credit_score);
}

function updateCreditScore(score) {
  const account = db.getUserAccount().get();
  db.updateUserAccount.run(account.cash, score);
}

module.exports = {
  getUserAccountData,
  updateCash,
  setCash,
  updateCreditScore
};
