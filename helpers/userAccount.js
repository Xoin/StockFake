const db = require('../database');

// Helper functions to work with user account in database

function getUserAccount() {
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
  
  // Build shareholder influence object
  const shareholderInfluence = {};
  const influenceRows = db.getShareholderInfluence().all();
  influenceRows.forEach(row => {
    shareholderInfluence[row.symbol] = row.shares;
  });
  
  return {
    cash: account.cash,
    creditScore: account.credit_score,
    portfolio,
    indexFundHoldings,
    shortPositions,
    shareholderInfluence,
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
    bondHoldings: db.getBondHoldings().all().map(bond => ({
      id: bond.id,
      bondType: bond.bond_type,
      issuer: bond.issuer,
      faceValue: bond.face_value,
      couponRate: bond.coupon_rate,
      purchasePrice: bond.purchase_price,
      purchaseDate: new Date(bond.purchase_date),
      maturityDate: new Date(bond.maturity_date),
      creditRating: bond.credit_rating,
      quantity: bond.quantity
    })),
    bondInterestPayments: db.getAllBondInterestPayments().all(20).map(payment => ({
      id: payment.id,
      bondId: payment.bond_id,
      paymentDate: new Date(payment.payment_date),
      amount: payment.amount
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

function getCash() {
  const account = db.getUserAccount().get();
  return account.cash;
}

function setCash(amount) {
  const account = db.getUserAccount().get();
  db.updateUserAccount.run(amount, account.credit_score);
}

function updateCash(delta) {
  const account = db.getUserAccount().get();
  db.updateUserAccount.run(account.cash + delta, account.credit_score);
}

function getCreditScore() {
  const account = db.getUserAccount().get();
  return account.credit_score;
}

function setCreditScore(score) {
  const account = db.getUserAccount().get();
  db.updateUserAccount.run(account.cash, score);
}

function getPortfolio() {
  const portfolio = {};
  const portfolioRows = db.getPortfolio().all();
  portfolioRows.forEach(row => {
    portfolio[row.symbol] = row.shares;
  });
  return portfolio;
}

function getPortfolioShares(symbol) {
  const item = db.getPortfolioItem.get(symbol);
  return item ? item.shares : 0;
}

function setPortfolioShares(symbol, shares) {
  if (shares <= 0) {
    db.deletePortfolio.run(symbol);
  } else {
    db.upsertPortfolio.run(symbol, shares);
  }
}

function getPurchaseHistory(symbol) {
  return db.getPurchaseHistory.all(symbol, 'stock').map(p => ({
    id: p.id,
    date: new Date(p.date),
    shares: p.shares,
    pricePerShare: p.price_per_share
  }));
}

function addPurchaseHistory(symbol, date, shares, pricePerShare, assetType = 'stock') {
  db.insertPurchaseHistory.run(symbol, date.toISOString(), shares, pricePerShare, assetType);
}

function deletePurchaseHistoryItem(id) {
  db.deletePurchaseHistoryItem.run(id);
}

function addTransaction(transaction) {
  const { date, type, symbol, shares, pricePerShare, tradingFee, tax, total, ...rest } = transaction;
  db.insertTransaction.run(
    date.toISOString(),
    type,
    symbol || null,
    shares || null,
    pricePerShare || null,
    tradingFee || null,
    tax || null,
    total || null,
    Object.keys(rest).length > 0 ? JSON.stringify(rest) : null
  );
}

function addDividend(dividend) {
  const { date, quarter, grossAmount, tax, netAmount, details } = dividend;
  db.insertDividend.run(
    date.toISOString(),
    quarter,
    grossAmount,
    tax,
    netAmount,
    JSON.stringify(details)
  );
}

function addTax(tax) {
  const { date, type, amount, description } = tax;
  db.insertTax.run(date.toISOString(), type, amount, description);
}

function addFee(fee) {
  const { date, type, amount, description } = fee;
  db.insertFee.run(date.toISOString(), type, amount, description);
}

function getShareholderInfluence(symbol) {
  const influence = {};
  const rows = db.getShareholderInfluence().all();
  rows.forEach(row => {
    influence[row.symbol] = row.shares;
  });
  return symbol ? (influence[symbol] || 0) : influence;
}

function setShareholderInfluence(symbol, shares) {
  if (shares <= 0) {
    db.deleteShareholderInfluence.run(symbol);
  } else {
    db.upsertShareholderInfluence.run(symbol, shares);
  }
}

function getLastTradeTime(symbol) {
  const row = db.getLastTradeTime.get(symbol);
  return row ? new Date(row.last_trade_time) : null;
}

function setLastTradeTime(symbol, date) {
  db.upsertLastTradeTime.run(symbol, date.toISOString());
}

function getIndexFundHolding(symbol) {
  const row = db.getIndexFundHolding.get(symbol);
  if (!row) return null;
  
  const purchaseHistory = db.getPurchaseHistory.all(symbol, 'indexfund');
  return {
    shares: row.shares,
    purchaseHistory: purchaseHistory.map(p => ({
      date: new Date(p.date),
      shares: p.shares,
      pricePerShare: p.price_per_share
    }))
  };
}

function setIndexFundShares(symbol, shares) {
  if (shares <= 0) {
    db.deleteIndexFundHolding.run(symbol);
  } else {
    db.upsertIndexFundHolding.run(symbol, shares);
  }
}

function getShortPosition(symbol) {
  const row = db.getShortPosition.get(symbol);
  if (!row) return null;
  
  return {
    shares: row.shares,
    borrowPrice: row.borrow_price,
    borrowDate: new Date(row.borrow_date),
    lastFeeDate: row.last_fee_date ? new Date(row.last_fee_date) : null
  };
}

function setShortPosition(symbol, shares, borrowPrice, borrowDate, lastFeeDate = null) {
  if (shares <= 0) {
    db.deleteShortPosition.run(symbol);
  } else {
    db.upsertShortPosition.run(
      symbol,
      shares,
      borrowPrice,
      borrowDate.toISOString(),
      lastFeeDate ? lastFeeDate.toISOString() : null
    );
  }
}

function getMarginAccount() {
  const row = db.getMarginAccount().get();
  return {
    marginBalance: row.margin_balance,
    marginInterestRate: row.margin_interest_rate,
    lastMarginInterestDate: row.last_margin_interest_date ? new Date(row.last_margin_interest_date) : null,
    hasMarginEnabled: Boolean(row.has_margin_enabled)
  };
}

function setMarginAccount(data) {
  const current = db.getMarginAccount().get();
  db.updateMarginAccount.run(
    data.marginBalance !== undefined ? data.marginBalance : current.margin_balance,
    data.marginInterestRate !== undefined ? data.marginInterestRate : current.margin_interest_rate,
    data.lastMarginInterestDate !== undefined ? (data.lastMarginInterestDate ? data.lastMarginInterestDate.toISOString() : null) : current.last_margin_interest_date,
    data.hasMarginEnabled !== undefined ? (data.hasMarginEnabled ? 1 : 0) : current.has_margin_enabled
  );
}

function addMarginCall(marginCall) {
  db.insertMarginCall.run(
    marginCall.issueDate.toISOString(),
    marginCall.dueDate.toISOString(),
    marginCall.amountNeeded,
    marginCall.currentRatio,
    marginCall.requiredRatio,
    marginCall.status,
    marginCall.metDate ? marginCall.metDate.toISOString() : null,
    marginCall.liquidationDate ? marginCall.liquidationDate.toISOString() : null
  );
}

function updateMarginCallStatus(id, status, metDate = null, liquidationDate = null) {
  db.updateMarginCall.run(
    status,
    metDate ? metDate.toISOString() : null,
    liquidationDate ? liquidationDate.toISOString() : null,
    id
  );
}

function getActiveMarginCall() {
  const row = db.getActiveMarginCall.get();
  if (!row) return null;
  
  return {
    id: row.id,
    issueDate: new Date(row.issue_date),
    dueDate: new Date(row.due_date),
    amountNeeded: row.amount_needed,
    currentRatio: row.current_ratio,
    requiredRatio: row.required_ratio,
    status: row.status
  };
}

function getLoan(id) {
  const row = db.getLoan.get(id);
  if (!row) return null;
  
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    principal: row.principal,
    balance: row.balance,
    interestRate: row.interest_rate,
    startDate: new Date(row.start_date),
    dueDate: new Date(row.due_date),
    lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date) : null,
    lastInterestAccrual: row.last_interest_accrual ? new Date(row.last_interest_accrual) : null,
    missedPayments: row.missed_payments,
    status: row.status,
    markedAsMissed: Boolean(row.marked_as_missed),
    termDays: row.term_days
  };
}

function addLoan(loan) {
  db.insertLoan.run(
    loan.id,
    loan.companyId,
    loan.companyName,
    loan.principal,
    loan.balance,
    loan.interestRate,
    loan.startDate.toISOString(),
    loan.dueDate.toISOString(),
    loan.lastPaymentDate ? loan.lastPaymentDate.toISOString() : null,
    loan.lastInterestAccrual ? loan.lastInterestAccrual.toISOString() : null,
    loan.missedPayments || 0,
    loan.status || 'active',
    loan.markedAsMissed ? 1 : 0,
    loan.termDays
  );
}

function updateLoan(id, updates) {
  const current = db.getLoan.get(id);
  if (!current) return;
  
  db.updateLoan.run(
    updates.balance !== undefined ? updates.balance : current.balance,
    updates.lastPaymentDate !== undefined ? (updates.lastPaymentDate ? updates.lastPaymentDate.toISOString() : null) : current.last_payment_date,
    updates.lastInterestAccrual !== undefined ? (updates.lastInterestAccrual ? updates.lastInterestAccrual.toISOString() : null) : current.last_interest_accrual,
    updates.missedPayments !== undefined ? updates.missedPayments : current.missed_payments,
    updates.status !== undefined ? updates.status : current.status,
    updates.markedAsMissed !== undefined ? (updates.markedAsMissed ? 1 : 0) : current.marked_as_missed,
    id
  );
}

function addLoanHistory(history) {
  const { date, type, loanId, companyId, ...rest } = history;
  db.insertLoanHistory.run(
    date.toISOString(),
    type,
    loanId || null,
    companyId || null,
    Object.keys(rest).length > 0 ? JSON.stringify(rest) : null
  );
}

module.exports = {
  getUserAccount,
  getCash,
  setCash,
  updateCash,
  getCreditScore,
  setCreditScore,
  getPortfolio,
  getPortfolioShares,
  setPortfolioShares,
  getPurchaseHistory,
  addPurchaseHistory,
  deletePurchaseHistoryItem,
  addTransaction,
  addDividend,
  addTax,
  addFee,
  getShareholderInfluence,
  setShareholderInfluence,
  getLastTradeTime,
  setLastTradeTime,
  getIndexFundHolding,
  setIndexFundShares,
  getShortPosition,
  setShortPosition,
  getMarginAccount,
  setMarginAccount,
  addMarginCall,
  updateMarginCallStatus,
  getActiveMarginCall,
  getLoan,
  addLoan,
  updateLoan,
  addLoanHistory
};
