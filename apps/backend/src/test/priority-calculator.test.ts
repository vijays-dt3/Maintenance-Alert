// apps/backend/src/test/priority-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { PriorityCalculatorService } from '../services/priority-calculator.service.js';
import { EquipmentCriticality } from '@maintenance/shared';

describe('PriorityCalculatorService (v2 unambiguous decision waterfall)', () => {
  const criticalities: EquipmentCriticality[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  describe('Breach percentage = 9.99% (< 10% high threshold)', () => {
    criticalities.forEach((crit) => {
      it(`evaluates ${crit} equipment as MEDIUM`, () => {
        expect(PriorityCalculatorService.calculate(9.99, crit)).toBe('MEDIUM');
      });
    });
  });

  describe('Breach percentage = 10.0% (exact high threshold boundary)', () => {
    criticalities.forEach((crit) => {
      it(`evaluates ${crit} equipment as HIGH`, () => {
        expect(PriorityCalculatorService.calculate(10.0, crit)).toBe('HIGH');
      });
    });
  });

  describe('Breach percentage = 10.01%', () => {
    criticalities.forEach((crit) => {
      it(`evaluates ${crit} equipment as HIGH`, () => {
        expect(PriorityCalculatorService.calculate(10.01, crit)).toBe('HIGH');
      });
    });
  });

  describe('Breach percentage = 14.99% (< 15% critical equipment threshold)', () => {
    it('evaluates CRITICAL equipment as HIGH (not CRITICAL yet)', () => {
      expect(PriorityCalculatorService.calculate(14.99, 'CRITICAL')).toBe('HIGH');
    });

    ['HIGH', 'MEDIUM', 'LOW'].forEach((crit) => {
      it(`evaluates ${crit} equipment as HIGH`, () => {
        expect(PriorityCalculatorService.calculate(14.99, crit as EquipmentCriticality)).toBe('HIGH');
      });
    });
  });

  describe('Breach percentage = 15.0% (critical equipment boundary)', () => {
    it('evaluates CRITICAL equipment as CRITICAL (>= 15%)', () => {
      expect(PriorityCalculatorService.calculate(15.0, 'CRITICAL')).toBe('CRITICAL');
    });

    ['HIGH', 'MEDIUM', 'LOW'].forEach((crit) => {
      it(`evaluates ${crit} equipment as HIGH`, () => {
        expect(PriorityCalculatorService.calculate(15.0, crit as EquipmentCriticality)).toBe('HIGH');
      });
    });
  });

  describe('Breach percentage = 15.01%', () => {
    it('evaluates CRITICAL equipment as CRITICAL', () => {
      expect(PriorityCalculatorService.calculate(15.01, 'CRITICAL')).toBe('CRITICAL');
    });

    ['HIGH', 'MEDIUM', 'LOW'].forEach((crit) => {
      it(`evaluates ${crit} equipment as HIGH`, () => {
        expect(PriorityCalculatorService.calculate(15.01, crit as EquipmentCriticality)).toBe('HIGH');
      });
    });
  });

  describe('Breach percentage = 24.99% (< 25% universal critical threshold)', () => {
    it('evaluates CRITICAL equipment as CRITICAL (>= 15%)', () => {
      expect(PriorityCalculatorService.calculate(24.99, 'CRITICAL')).toBe('CRITICAL');
    });

    ['HIGH', 'MEDIUM', 'LOW'].forEach((crit) => {
      it(`evaluates ${crit} equipment as HIGH`, () => {
        expect(PriorityCalculatorService.calculate(24.99, crit as EquipmentCriticality)).toBe('HIGH');
      });
    });
  });

  describe('Breach percentage = 25.0% (universal critical boundary)', () => {
    criticalities.forEach((crit) => {
      it(`evaluates ALL equipment (${crit}) as CRITICAL`, () => {
        expect(PriorityCalculatorService.calculate(25.0, crit)).toBe('CRITICAL');
      });
    });
  });

  describe('Breach percentage = 25.01%', () => {
    criticalities.forEach((crit) => {
      it(`evaluates ALL equipment (${crit}) as CRITICAL`, () => {
        expect(PriorityCalculatorService.calculate(25.01, crit)).toBe('CRITICAL');
      });
    });
  });
});
