// packages/shared/src/constants/priorities.ts
export const ALERT_PRIORITIES = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
} as const;

export type AlertPriority = (typeof ALERT_PRIORITIES)[keyof typeof ALERT_PRIORITIES];

export interface PriorityConfig {
  critical: {
    breachThreshold: number; // e.g. 25% for any equipment
    criticalEquipmentThreshold: number; // e.g. 15% for equipment_criticality = CRITICAL
  };
  high: {
    breachThreshold: number; // e.g. 10% for any equipment
  };
}

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  critical: {
    breachThreshold: 25,
    criticalEquipmentThreshold: 15,
  },
  high: {
    breachThreshold: 10,
  },
};
