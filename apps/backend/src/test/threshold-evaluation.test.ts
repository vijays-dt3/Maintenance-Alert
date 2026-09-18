// apps/backend/src/test/threshold-evaluation.test.ts
import { describe, it, expect } from 'vitest';
import { ThresholdEvaluatorService } from '../services/threshold-evaluator.service.js';

describe('ThresholdEvaluatorService (v2 explicit direction logic)', () => {
  describe('UPPER direction', () => {
    it('normal reading (value < threshold) -> no breach', () => {
      const res = ThresholdEvaluatorService.evaluate(65, 80, 'UPPER');
      expect(res.breached).toBe(false);
      expect(res.breachPercentage).toBe(0);
    });

    it('exact threshold reading (value == threshold) -> safe (no breach)', () => {
      const res = ThresholdEvaluatorService.evaluate(80, 80, 'UPPER');
      expect(res.breached).toBe(false);
      expect(res.breachPercentage).toBe(0);
    });

    it('breaching reading (value > threshold) -> breach with correct formula', () => {
      // Current = 95, Threshold = 80 -> ((95 - 80) / 80) * 100 = 18.75%
      const res = ThresholdEvaluatorService.evaluate(95, 80, 'UPPER');
      expect(res.breached).toBe(true);
      expect(res.breachPercentage).toBeCloseTo(18.75, 4);
    });

    it('decimal values (80.5 vs 80.0) -> breach = 0.625%', () => {
      const res = ThresholdEvaluatorService.evaluate(80.5, 80.0, 'UPPER');
      expect(res.breached).toBe(true);
      expect(res.breachPercentage).toBeCloseTo(0.625, 4);
    });

    it('large breach (160 vs 80) -> breach = 100%', () => {
      const res = ThresholdEvaluatorService.evaluate(160, 80, 'UPPER');
      expect(res.breached).toBe(true);
      expect(res.breachPercentage).toBe(100);
    });
  });

  describe('LOWER direction', () => {
    it('normal reading (value > threshold) -> no breach', () => {
      const res = ThresholdEvaluatorService.evaluate(120, 100, 'LOWER');
      expect(res.breached).toBe(false);
      expect(res.breachPercentage).toBe(0);
    });

    it('exact threshold reading (value == threshold) -> safe (no breach)', () => {
      const res = ThresholdEvaluatorService.evaluate(100, 100, 'LOWER');
      expect(res.breached).toBe(false);
      expect(res.breachPercentage).toBe(0);
    });

    it('breaching reading (value < threshold) -> breach with correct formula', () => {
      // Threshold = 100, Current = 80 -> ((100 - 80) / 100) * 100 = 20%
      const res = ThresholdEvaluatorService.evaluate(80, 100, 'LOWER');
      expect(res.breached).toBe(true);
      expect(res.breachPercentage).toBeCloseTo(20, 4);
    });

    it('value = 0 with positive threshold -> breach = 100%', () => {
      const res = ThresholdEvaluatorService.evaluate(0, 50, 'LOWER');
      expect(res.breached).toBe(true);
      expect(res.breachPercentage).toBe(100);
    });

    it('decimal values (99.5 vs 100) -> breach = 0.5%', () => {
      const res = ThresholdEvaluatorService.evaluate(99.5, 100, 'LOWER');
      expect(res.breached).toBe(true);
      expect(res.breachPercentage).toBeCloseTo(0.5, 4);
    });
  });

  describe('Edge cases & validation', () => {
    it('throws error when threshold is 0', () => {
      expect(() => ThresholdEvaluatorService.evaluate(10, 0, 'UPPER')).toThrow(
        'Threshold value must be positive'
      );
    });

    it('throws error when threshold is negative', () => {
      expect(() => ThresholdEvaluatorService.evaluate(10, -5, 'UPPER')).toThrow(
        'Threshold value must be positive'
      );
    });
  });
});
