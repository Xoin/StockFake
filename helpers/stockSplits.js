// Stock split management for dynamic splitting during gameplay
const dbModule = require('../database');

// Get database instance
function getDb() {
  return dbModule.db;
}

// Determine stock split threshold based on year
function getSplitThreshold(year) {
  if (year < 1991) return 150;      // 1970-1990: Split at $150
  if (year < 2011) return 200;      // 1991-2010: Split at $200
  if (year <= 2024) return 300;     // 2011-2024: Split at $300
  
  // Dynamic threshold for 2025+
  // Increase threshold by ~3% per year to account for inflation and market growth
  // This prevents excessive splitting in the far future while maintaining accessibility
  const yearsSince2025 = year - 2025;
  const baseThreshold = 450;
  const annualGrowthRate = 0.03; // 3% per year
  
  // Compound growth: threshold * (1 + rate)^years
  const dynamicThreshold = baseThreshold * Math.pow(1 + annualGrowthRate, yearsSince2025);
  
  // Round to nearest $50 for cleaner thresholds
  return Math.round(dynamicThreshold / 50) * 50;
}

// Determine split ratio based on how far over threshold the price is
function determineSplitRatio(price, threshold, symbol) {
  // Use symbol-based deterministic random for consistency
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 31 + symbol.charCodeAt(i)) % 1000000;
  }
  seed = (seed * 9301 + Math.floor(price)) % 233280;
  const randomValue = seed / 233280;
  
  const overageRatio = price / threshold;
  
  // More aggressive splits for higher prices
  if (overageRatio > 4) {
    // Very high price, consider larger splits
    const splitOptions = [5, 7, 10];
    return splitOptions[Math.floor(randomValue * splitOptions.length)];
  } else if (overageRatio > 2.5) {
    // High price, larger splits
    const splitOptions = [3, 4, 5];
    return splitOptions[Math.floor(randomValue * splitOptions.length)];
  } else {
    // Moderately over threshold, standard splits
    const splitOptions = [2, 3];
    return splitOptions[Math.floor(randomValue * splitOptions.length)];
  }
}

// Check if a stock needs to split based on current price and date
function checkForSplit(symbol, currentPrice, currentDate) {
  const year = new Date(currentDate).getFullYear();
  const threshold = getSplitThreshold(year);
  
  if (currentPrice > threshold) {
    const splitRatio = determineSplitRatio(currentPrice, threshold, symbol);
    const priceAfterSplit = currentPrice / splitRatio;
    
    return {
      needsSplit: true,
      splitRatio: splitRatio,
      priceBeforeSplit: currentPrice,
      priceAfterSplit: priceAfterSplit,
      threshold: threshold
    };
  }
  
  return { needsSplit: false };
}

// Apply a stock split to the database
function applySplit(symbol, splitDate, splitRatio, priceBeforeSplit, priceAfterSplit, stockName = null) {
  const db = getDb();
  
  try {
    // Check if this split already exists
    const existing = db.prepare(
      'SELECT id FROM stock_splits WHERE symbol = ? AND split_date = ?'
    ).get(symbol, splitDate);
    
    if (existing) {
      return { success: false, reason: 'Split already recorded' };
    }
    
    // Record the split
    const splitInsert = db.prepare(`
      INSERT INTO stock_splits (symbol, split_date, split_ratio, price_before_split, price_after_split, applied_to_portfolio)
      VALUES (?, ?, ?, ?, ?, 0)
    `);
    
    const result = splitInsert.run(symbol, splitDate, splitRatio, priceBeforeSplit, priceAfterSplit);
    const splitId = result.lastInsertRowid;
    
    // Apply to user's portfolio if they own this stock
    const portfolio = db.prepare('SELECT shares FROM portfolio WHERE symbol = ?').get(symbol);
    let portfolioAffected = false;
    
    if (portfolio && portfolio.shares > 0) {
      portfolioAffected = true;
      const newShares = portfolio.shares * splitRatio;
      
      // Update portfolio shares
      db.prepare('UPDATE portfolio SET shares = ? WHERE symbol = ?').run(newShares, symbol);
      
      // Update purchase history - multiply all shares by split ratio and divide price by split ratio
      db.prepare(`
        UPDATE purchase_history 
        SET shares = shares * ?, 
            price_per_share = price_per_share / ?
        WHERE symbol = ? AND asset_type = 'stock'
      `).run(splitRatio, splitRatio, symbol);
      
      // Mark split as applied to portfolio
      db.prepare('UPDATE stock_splits SET applied_to_portfolio = 1 WHERE id = ?').run(splitId);
      
      // Record transaction for the split
      db.prepare(`
        INSERT INTO transactions (date, type, symbol, shares, price_per_share, trading_fee, tax, total, data)
        VALUES (?, 'STOCK_SPLIT', ?, ?, ?, 0, 0, 0, ?)
      `).run(
        splitDate,
        symbol,
        newShares, // Total shares after split
        priceAfterSplit,
        JSON.stringify({ 
          splitRatio: splitRatio,
          oldShares: portfolio.shares,
          newShares: newShares,
          sharesAdded: newShares - portfolio.shares,
          priceBeforeSplit: priceBeforeSplit,
          priceAfterSplit: priceAfterSplit
        })
      );
    }
    
    // Apply to short positions if they exist
    const shortPosition = db.prepare('SELECT shares, borrow_price FROM short_positions WHERE symbol = ?').get(symbol);
    let shortPositionAffected = false;
    
    if (shortPosition && shortPosition.shares > 0) {
      shortPositionAffected = true;
      const newShortShares = shortPosition.shares * splitRatio;
      const newBorrowPrice = shortPosition.borrow_price / splitRatio;
      
      // Update short position
      db.prepare(`
        UPDATE short_positions 
        SET shares = ?, borrow_price = ?
        WHERE symbol = ?
      `).run(newShortShares, newBorrowPrice, symbol);
    }
    
    // Create email notification
    const email = generateSplitEmail(
      symbol, 
      stockName || symbol, 
      splitRatio, 
      priceBeforeSplit, 
      priceAfterSplit, 
      splitDate, 
      portfolioAffected || shortPositionAffected
    );
    
    db.prepare(`
      INSERT INTO emails (from_address, subject, body, date, is_read, spam, category)
      VALUES (?, ?, ?, ?, 0, 0, ?)
    `).run(email.from, email.subject, email.body, email.date.toISOString(), email.category);
    
    return { 
      success: true, 
      splitId: splitId,
      portfolioAffected: portfolioAffected,
      shortPositionAffected: shortPositionAffected
    };
    
  } catch (error) {
    console.error('Error applying stock split:', error);
    return { success: false, reason: error.message };
  }
}

// Check all stocks for potential splits at the current game time
function checkAndApplySplits(currentDate, stockPrices) {
  const db = getDb();
  const splits = [];
  
  // Get last check date
  const lastCheck = db.prepare('SELECT last_check_date FROM stock_split_check_state WHERE id = 1').get();
  const lastCheckDate = lastCheck ? new Date(lastCheck.last_check_date) : new Date('1970-01-01');
  const currentDateObj = new Date(currentDate);
  
  // Only check once per day - use efficient date comparison
  const daysSinceLastCheck = (currentDateObj.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastCheck < 1) {
    return { splitsApplied: [], message: 'Already checked today' };
  }
  
  // Check each stock
  for (const stock of stockPrices) {
    if (!stock || !stock.symbol || !stock.price) continue;
    
    const splitCheck = checkForSplit(stock.symbol, stock.price, currentDate);
    
    if (splitCheck.needsSplit) {
      const result = applySplit(
        stock.symbol,
        currentDate,
        splitCheck.splitRatio,
        splitCheck.priceBeforeSplit,
        splitCheck.priceAfterSplit,
        stock.name
      );
      
      if (result.success) {
        splits.push({
          symbol: stock.symbol,
          name: stock.name,
          ratio: splitCheck.splitRatio,
          priceBeforeSplit: splitCheck.priceBeforeSplit,
          priceAfterSplit: splitCheck.priceAfterSplit,
          portfolioAffected: result.portfolioAffected,
          shortPositionAffected: result.shortPositionAffected
        });
      }
    }
  }
  
  // Update last check date
  const updateCheck = db.prepare(`
    INSERT OR REPLACE INTO stock_split_check_state (id, last_check_date, updated_at)
    VALUES (1, ?, CURRENT_TIMESTAMP)
  `);
  updateCheck.run(currentDate);
  
  return { 
    splitsApplied: splits,
    message: splits.length > 0 ? `Applied ${splits.length} stock split(s)` : 'No splits needed'
  };
}

// Get all stock splits for a specific symbol
function getSplitsForSymbol(symbol) {
  const db = getDb();
  
  const splits = db.prepare(`
    SELECT * FROM stock_splits 
    WHERE symbol = ? 
    ORDER BY split_date DESC
  `).all(symbol);
  
  return splits;
}

// Get recent stock splits
function getRecentSplits(limit = 10) {
  const db = getDb();
  
  const splits = db.prepare(`
    SELECT * FROM stock_splits 
    ORDER BY split_date DESC, created_at DESC
    LIMIT ?
  `).all(limit);
  
  return splits;
}

// Generate email notification for a stock split
function generateSplitEmail(symbol, name, splitRatio, priceBeforeSplit, priceAfterSplit, splitDate, portfolioAffected) {
  const formattedDate = new Date(splitDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let body = `Dear Investor,\n\n`;
  body += `We are writing to inform you that ${name} (${symbol}) has executed a ${splitRatio}-for-1 stock split effective ${formattedDate}.\n\n`;
  body += `Split Details:\n`;
  body += `- Split Ratio: ${splitRatio}:1\n`;
  body += `- Price Before Split: $${priceBeforeSplit.toFixed(2)}\n`;
  body += `- Price After Split: $${priceAfterSplit.toFixed(2)}\n\n`;
  
  if (portfolioAffected) {
    body += `Impact on Your Holdings:\n`;
    body += `Your ${symbol} shares have been automatically adjusted. For every 1 share you owned, you now own ${splitRatio} shares at the new price.\n\n`;
    body += `Important: The total value of your position remains the same. Stock splits do not change the total value of your investment, only the number of shares and price per share.\n\n`;
  } else {
    body += `This split does not affect your portfolio as you do not currently hold ${symbol}.\n\n`;
  }
  
  body += `What is a Stock Split?\n`;
  body += `A stock split divides existing shares into multiple shares to make the stock more affordable and increase liquidity. While the number of shares increases, the proportional ownership remains the same.\n\n`;
  body += `Best regards,\nStockFake Trading Platform`;
  
  return {
    from: 'notifications@stockfake.com',
    subject: `Stock Split Notification: ${symbol} ${splitRatio}:1 Split`,
    body: body,
    date: new Date(splitDate),
    spam: false,
    category: 'stock_split'
  };
}

module.exports = {
  getSplitThreshold,
  determineSplitRatio,
  checkForSplit,
  applySplit,
  checkAndApplySplits,
  getSplitsForSymbol,
  getRecentSplits,
  generateSplitEmail
};
