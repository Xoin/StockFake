/**
 * Unit tests for the centralized pause handler
 */

const pauseHandler = require('../../helpers/pauseHandler');

describe('Pause Handler Unit Tests', () => {
  beforeEach(() => {
    // Reset to a known state before each test
    pauseHandler.setIsPaused(true);
  });

  describe('Initial State', () => {
    test('Game starts paused by default', () => {
      const initialPaused = pauseHandler.getIsPaused();
      expect(initialPaused).toBe(true);
    });
  });

  describe('shouldProcessGameState', () => {
    test('Should NOT process game state when paused', () => {
      pauseHandler.setIsPaused(true);
      const shouldNotProcess = pauseHandler.shouldProcessGameState();
      expect(shouldNotProcess).toBe(false);
    });

    test('SHOULD process game state when unpaused', () => {
      pauseHandler.setIsPaused(false);
      const shouldProcess = pauseHandler.shouldProcessGameState();
      expect(shouldProcess).toBe(true);
    });
  });

  describe('Toggling Pause State', () => {
    test('Can set pause to true', () => {
      pauseHandler.setIsPaused(true);
      expect(pauseHandler.getIsPaused()).toBe(true);
    });

    test('Can set pause to false', () => {
      pauseHandler.setIsPaused(false);
      expect(pauseHandler.getIsPaused()).toBe(false);
    });
  });

  describe('executeIfNotPaused', () => {
    test('Function not executed when paused', () => {
      pauseHandler.setIsPaused(true);
      let executedWhenPaused = false;
      const resultWhenPaused = pauseHandler.executeIfNotPaused(() => {
        executedWhenPaused = true;
        return 'executed';
      });

      expect(executedWhenPaused).toBe(false);
      expect(resultWhenPaused).toBeUndefined();
    });

    test('Function executed when unpaused', () => {
      pauseHandler.setIsPaused(false);
      let executedWhenUnpaused = false;
      const resultWhenUnpaused = pauseHandler.executeIfNotPaused(() => {
        executedWhenUnpaused = true;
        return 'executed';
      });

      expect(executedWhenUnpaused).toBe(true);
      expect(resultWhenUnpaused).toBe('executed');
    });
  });

  describe('wrapWithPauseCheck', () => {
    test('Wrapped function not executed when paused', () => {
      let wrapExecuted = false;
      const wrappedFn = pauseHandler.wrapWithPauseCheck(() => {
        wrapExecuted = true;
        return 'wrapped result';
      });

      pauseHandler.setIsPaused(true);
      wrapExecuted = false;
      const wrappedResultPaused = wrappedFn();
      
      expect(wrapExecuted).toBe(false);
      expect(wrappedResultPaused).toBeUndefined();
    });

    test('Wrapped function executed when unpaused', () => {
      let wrapExecuted = false;
      const wrappedFn = pauseHandler.wrapWithPauseCheck(() => {
        wrapExecuted = true;
        return 'wrapped result';
      });

      pauseHandler.setIsPaused(false);
      wrapExecuted = false;
      const wrappedResultUnpaused = wrappedFn();
      
      expect(wrapExecuted).toBe(true);
      expect(wrappedResultUnpaused).toBe('wrapped result');
    });
  });

  describe('Type Coercion', () => {
    test('Truthy value coerced to true', () => {
      pauseHandler.setIsPaused(1);
      expect(pauseHandler.getIsPaused()).toBe(true);
    });

    test('Falsy value coerced to false', () => {
      pauseHandler.setIsPaused(0);
      expect(pauseHandler.getIsPaused()).toBe(false);
    });
  });
});
