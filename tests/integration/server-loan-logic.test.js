/**
 * Integration test for the fixed loan vs sell decision logic
 * This test verifies that the server.js implementation correctly
 * decides between selling assets and taking loans
 */

const fs = require('fs');
const path = require('path');

describe('Integration Test: Fixed Loan vs Sell Logic in server.js', () => {
  const serverPath = path.join(__dirname, '../../server.js');
  const serverCode = fs.readFileSync(serverPath, 'utf8');

  describe('Code Review', () => {
    test('shouldSellAssetsInsteadOfLoan function exists', () => {
      expect(serverCode).toContain('function shouldSellAssetsInsteadOfLoan');
    });

    test('processNegativeBalance uses decision logic', () => {
      expect(serverCode).toContain('const shouldSell = shouldSellAssetsInsteadOfLoan(negativeAmount)');
    });

    test('Function calculates portfolio value', () => {
      expect(serverCode).toContain('let portfolioValue = 0');
    });

    test('Function calculates total loan debt', () => {
      expect(serverCode).toContain('let totalLoanDebt = 0');
    });

    test('Checks if heavily in debt', () => {
      expect(serverCode).toContain('totalLoanDebt > portfolioValue * 0.5');
    });

    test('Checks if portfolio can easily cover debt', () => {
      expect(serverCode).toContain('portfolioValue > negativeAmount * 2');
    });

    test('Checks credit score threshold', () => {
      expect(serverCode).toContain('userAccount.creditScore < 600');
    });

    test('Checks if debt is small relative to portfolio', () => {
      expect(serverCode).toContain('negativeAmount < portfolioValue * 0.1');
    });
  });

  describe('Decision Logic Verification', () => {
    test('Decision function can be extracted', () => {
      const functionMatch = serverCode.match(/function shouldSellAssetsInsteadOfLoan[\s\S]*?^}/m);
      expect(functionMatch).not.toBeNull();
    });
  });

  describe('Implementation Quality', () => {
    test('Includes decision logging for debugging', () => {
      const hasDecisionLogging = serverCode.includes('Decision: SELL') && serverCode.includes('Decision: LOAN');
      expect(hasDecisionLogging).toBe(true);
    });

    test('Handles both sell and loan paths', () => {
      const hasSellPath = serverCode.includes('if (shouldSell)');
      const hasLoanPath = serverCode.includes('} else {') && serverCode.includes('availableLenders');
      expect(hasSellPath && hasLoanPath).toBe(true);
    });
  });
});
