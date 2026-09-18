// apps/backend/src/test/equipment-status-evaluation.test.ts
import { describe, it, expect } from 'vitest';
import {
  EquipmentStatusEvaluatorService,
  AlertSummaryItem,
} from '../services/equipment-status-evaluator.service.js';

describe('EquipmentStatusEvaluatorService (v2 multi-alert re-evaluation logic)', () => {
  it('No active alerts -> HEALTHY', () => {
    const alerts: AlertSummaryItem[] = [];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(alerts)).toBe('HEALTHY');
  });

  it('All existing alerts are RESOLVED -> HEALTHY', () => {
    const alerts: AlertSummaryItem[] = [
      { status: 'RESOLVED', priority: 'CRITICAL' },
      { status: 'RESOLVED', priority: 'HIGH' },
    ];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(alerts)).toBe('HEALTHY');
  });

  it('Active CRITICAL alert -> CRITICAL', () => {
    const alerts: AlertSummaryItem[] = [
      { status: 'OPEN', priority: 'CRITICAL' },
    ];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(alerts)).toBe('CRITICAL');
  });

  it('Active HIGH alert (no CRITICAL) -> AT_RISK', () => {
    const alerts: AlertSummaryItem[] = [
      { status: 'OPEN', priority: 'HIGH' },
    ];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(alerts)).toBe('AT_RISK');
  });

  it('Active MEDIUM alert (no CRITICAL) -> AT_RISK', () => {
    const alerts: AlertSummaryItem[] = [
      { status: 'ACKNOWLEDGED', priority: 'MEDIUM' },
    ];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(alerts)).toBe('AT_RISK');
  });

  it('Mix of CRITICAL and HIGH active alerts -> CRITICAL', () => {
    const alerts: AlertSummaryItem[] = [
      { status: 'OPEN', priority: 'HIGH' },
      { status: 'ACKNOWLEDGED', priority: 'CRITICAL' },
    ];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(alerts)).toBe('CRITICAL');
  });

  it('Closure resolves only active alert -> transitions from AT_RISK/CRITICAL to HEALTHY', () => {
    // Before: open high alert -> AT_RISK
    const before: AlertSummaryItem[] = [{ status: 'CONVERTED_TO_WORK_ORDER', priority: 'HIGH' }];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(before)).toBe('AT_RISK');

    // After WO closure: alert marked RESOLVED -> HEALTHY
    const after: AlertSummaryItem[] = [{ status: 'RESOLVED', priority: 'HIGH' }];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(after)).toBe('HEALTHY');
  });

  it('Closure resolves CRITICAL alert, but a HIGH alert remains active -> AT_RISK', () => {
    const alerts: AlertSummaryItem[] = [
      { status: 'RESOLVED', priority: 'CRITICAL' }, // Just resolved by WO closure
      { status: 'OPEN', priority: 'HIGH' }, // Still active!
    ];
    expect(EquipmentStatusEvaluatorService.evaluateFromAlerts(alerts)).toBe('AT_RISK');
  });
});
