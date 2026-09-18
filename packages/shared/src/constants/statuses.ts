// packages/shared/src/constants/statuses.ts
export const EQUIPMENT_STATUSES = {
  HEALTHY: 'HEALTHY',
  AT_RISK: 'AT_RISK',
  CRITICAL: 'CRITICAL',
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
} as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[keyof typeof EQUIPMENT_STATUSES];

export const EQUIPMENT_CRITICALITIES = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type EquipmentCriticality = (typeof EQUIPMENT_CRITICALITIES)[keyof typeof EQUIPMENT_CRITICALITIES];

export const ALERT_STATUSES = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  CONVERTED_TO_WORK_ORDER: 'CONVERTED_TO_WORK_ORDER',
  RESOLVED: 'RESOLVED',
} as const;

export type AlertStatus = (typeof ALERT_STATUSES)[keyof typeof ALERT_STATUSES];

export const WORK_ORDER_STATUSES = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_PARTS: 'WAITING_FOR_PARTS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[keyof typeof WORK_ORDER_STATUSES];

export const PART_AVAILABILITIES = {
  IN_STOCK: 'IN_STOCK',
  ORDERED: 'ORDERED',
  NOT_IN_STOCK: 'NOT_IN_STOCK',
} as const;

export type PartAvailability = (typeof PART_AVAILABILITIES)[keyof typeof PART_AVAILABILITIES];

export const THRESHOLD_DIRECTIONS = {
  UPPER: 'UPPER',
  LOWER: 'LOWER',
} as const;

export type ThresholdDirection = (typeof THRESHOLD_DIRECTIONS)[keyof typeof THRESHOLD_DIRECTIONS];
