// apps/backend/src/test/work-order-number.test.ts
import { describe, it, expect } from 'vitest';
import { formatWorkOrderNumber, generateNextLocalWorkOrderNumber } from '../utils/work-order-number.js';

describe('Work Order Number Generation', () => {
  it('formats work order number with year and 5-digit zero-padded sequence', () => {
    const fixedDate = new Date('2026-03-15T12:00:00Z');
    expect(formatWorkOrderNumber(1, fixedDate)).toBe('WO-2026-00001');
    expect(formatWorkOrderNumber(42, fixedDate)).toBe('WO-2026-00042');
    expect(formatWorkOrderNumber(9999, fixedDate)).toBe('WO-2026-09999');
    expect(formatWorkOrderNumber(10000, fixedDate)).toBe('WO-2026-10000');
  });

  it('increments local sequence numbers properly', () => {
    const num1 = generateNextLocalWorkOrderNumber();
    const num2 = generateNextLocalWorkOrderNumber();
    expect(num1).toMatch(/^WO-\d{4}-\d{5}$/);
    expect(num2).toMatch(/^WO-\d{4}-\d{5}$/);
    expect(num1).not.toEqual(num2);
  });
});
