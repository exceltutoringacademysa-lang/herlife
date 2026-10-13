import { describe, expect, it } from 'vitest';
import { calculateNetCashFlow, parseTransactionAmount } from '../src/lib/finance';

describe('manual money recording', () => {
  it('accepts exact rand and cent amounts', () => {
    expect(parseTransactionAmount('250')).toBe(250);
    expect(parseTransactionAmount(' -75.40 ')).toBe(-75.4);
    expect(parseTransactionAmount('0.01')).toBe(0.01);
  });
  it('rejects imprecise, empty or zero entries', () => {
    for (const value of ['', '0', '0.00', '1.999', 'R50', '1e9', 'NaN', '99999999999']) {
      expect(parseTransactionAmount(value)).toBeNull();
    }
  });
  it('adds monetary amounts without floating-point drift', () => {
    expect(calculateNetCashFlow([{value:0.1},{value:0.2},{value:-0.3}])).toBe(0);
    expect(calculateNetCashFlow([{value:950.5},{value:-120.25}])).toBe(830.25);
  });
  it('does not silently accept invalid sums', () => {
    expect(() => calculateNetCashFlow([{value:NaN}])).toThrow();
  });
});
