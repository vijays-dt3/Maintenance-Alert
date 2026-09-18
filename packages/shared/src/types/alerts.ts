// packages/shared/src/types/alerts.ts
import { AlertPriority } from '../constants/priorities.js';
import { AlertStatus, WorkOrderStatus } from '../constants/statuses.js';
import { Equipment } from './equipment.js';
import { EquipmentParameter } from './parameters.js';

export interface ThresholdBreach {
  id: string;
  equipment_id: string;
  parameter_id: string;
  reading_id: string;
  current_value: number;
  threshold_value: number;
  breach_percentage: number;
  breached_at: string;
  created_at: string;
}

export interface LinkedWorkOrderSummary {
  id: string;
  work_order_number: string;
  status: WorkOrderStatus;
  assigned_to?: string | null;
  created_at: string;
}

export interface MaintenanceAlert {
  id: string;
  alert_id: string;
  equipment_id: string;
  equipment?: Equipment;
  breach_id: string;
  breach?: ThresholdBreach;
  parameter_id: string;
  parameter?: EquipmentParameter;
  current_value: number;
  threshold_value: number;
  breach_percentage: number;
  priority: AlertPriority;
  status: AlertStatus;
  suggested_action?: string | null;
  created_at: string;
  updated_at: string;
  // v2: Dynamically populated from work_orders table where alert_id = alert.id
  work_order?: LinkedWorkOrderSummary | null;
}
