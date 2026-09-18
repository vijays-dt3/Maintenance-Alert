// apps/backend/src/services/priority-calculator.service.ts
import {
  AlertPriority,
  EquipmentCriticality,
  PriorityConfig,
  DEFAULT_PRIORITY_CONFIG,
} from '@maintenance/shared';

export class PriorityCalculatorService {
  /**
   * Calculates the maintenance alert priority based on breach percentage and equipment criticality.
   *
   * Decision Waterfall (first match wins):
   * 1. CRITICAL:
   *    - breach_percentage >= 25 (Any equipment)
   *    - OR (equipment_criticality = 'CRITICAL' AND breach_percentage >= 15)
   * 2. HIGH:
   *    - breach_percentage >= 10 (Any equipment)
   * 3. MEDIUM:
   *    - All other positive breaches (0% < breach_percentage < 10%)
   */
  static calculate(
    breachPercentage: number,
    equipmentCriticality: EquipmentCriticality,
    config: PriorityConfig = DEFAULT_PRIORITY_CONFIG
  ): AlertPriority {
    if (breachPercentage <= 0) {
      return 'MEDIUM';
    }

    // 1. CRITICAL tier
    if (breachPercentage >= config.critical.breachThreshold) {
      return 'CRITICAL';
    }

    if (
      equipmentCriticality === 'CRITICAL' &&
      breachPercentage >= config.critical.criticalEquipmentThreshold
    ) {
      return 'CRITICAL';
    }

    // 2. HIGH tier
    if (breachPercentage >= config.high.breachThreshold) {
      return 'HIGH';
    }

    // 3. MEDIUM tier
    return 'MEDIUM';
  }

  /**
   * Generates industrial suggested corrective action based on parameter context and priority.
   */
  static generateSuggestedAction(parameterName: string, priority: AlertPriority): string {
    const lower = parameterName.toLowerCase();

    if (lower.includes('temp')) {
      if (priority === 'CRITICAL') {
        return 'Emergency shutdown inspection: Check coolant flow, heat exchangers, and thermal thermal cut-offs immediately.';
      }
      return 'Inspect cooling circuit, verify coolant levels and check for heat exchanger blockages.';
    }

    if (lower.includes('vib')) {
      if (priority === 'CRITICAL') {
        return 'Severe mechanical vibration: Check spindle/rotor bearings, dynamic balance, and structural mounting bolts.';
      }
      return 'Inspect bearings and shaft alignment. Schedule vibration spectrum analysis.';
    }

    if (lower.includes('press')) {
      if (priority === 'CRITICAL') {
        return 'Critical pressure anomaly: Inspect relief valves, hydraulic pumps, and check for high-pressure line rupture.';
      }
      return 'Inspect pneumatic/hydraulic lines for seal wear, filter clogging, or pressure regulator drift.';
    }

    if (lower.includes('curr') || lower.includes('motor') || lower.includes('volt')) {
      return 'Inspect motor electrical insulation, inverter drive parameters, and mechanical load resistance.';
    }

    if (lower.includes('runtime') || lower.includes('hour') || lower.includes('cycle')) {
      return 'Scheduled PM interval reached: Perform routine lubrication, component inspection, and calibration.';
    }

    return `Inspect equipment parameter "${parameterName}" and conduct immediate diagnostic review.`;
  }
}
