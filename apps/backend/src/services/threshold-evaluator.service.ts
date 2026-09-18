// apps/backend/src/services/threshold-evaluator.service.ts
import { ThresholdDirection } from '@maintenance/shared';

export interface ThresholdEvaluationResult {
  breached: boolean;
  breachPercentage: number; // 0 if not breached, positive percentage if breached
  direction: ThresholdDirection;
  currentValue: number;
  thresholdValue: number;
}

export class ThresholdEvaluatorService {
  /**
   * Evaluates if a current parameter value breaches the specified threshold.
   *
   * Business Rules:
   * - UPPER: breach when currentValue > thresholdValue. currentValue <= thresholdValue is SAFE.
   * - LOWER: breach when currentValue < thresholdValue. currentValue >= thresholdValue is SAFE.
   * - Equal to threshold is always SAFE (within operating specification).
   * - Threshold must be strictly positive (> 0).
   */
  static evaluate(
    currentValue: number,
    thresholdValue: number,
    direction: ThresholdDirection
  ): ThresholdEvaluationResult {
    if (thresholdValue <= 0) {
      throw new Error('Threshold value must be positive and greater than 0');
    }

    if (direction === 'UPPER') {
      if (currentValue > thresholdValue) {
        const breachPercentage = ((currentValue - thresholdValue) / thresholdValue) * 100;
        return {
          breached: true,
          breachPercentage,
          direction,
          currentValue,
          thresholdValue,
        };
      }
      return {
        breached: false,
        breachPercentage: 0,
        direction,
        currentValue,
        thresholdValue,
      };
    }

    if (direction === 'LOWER') {
      if (currentValue < thresholdValue) {
        const breachPercentage = ((thresholdValue - currentValue) / thresholdValue) * 100;
        return {
          breached: true,
          breachPercentage,
          direction,
          currentValue,
          thresholdValue,
        };
      }
      return {
        breached: false,
        breachPercentage: 0,
        direction,
        currentValue,
        thresholdValue,
      };
    }

    throw new Error(`Unsupported threshold direction: ${direction}`);
  }
}
