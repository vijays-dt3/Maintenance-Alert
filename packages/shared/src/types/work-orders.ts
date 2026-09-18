// packages/shared/src/types/work-orders.ts
import { AlertPriority } from '../constants/priorities.js';
import { WorkOrderStatus } from '../constants/statuses.js';
import { MaintenanceAlert } from './alerts.js';
import { Equipment } from './equipment.js';
import { PartUsageInput, WorkOrderPart } from './spare-parts.js';

export interface WorkOrder {
  id: string;
  work_order_number: string;
  equipment_id: string;
  equipment?: Equipment;
  alert_id?: string | null;
  alert?: MaintenanceAlert | null;
  fault_description: string;
  description?: string | null;
  status: WorkOrderStatus;
  priority: AlertPriority;
  assigned_to?: string | null;
  assigned_engineer_name?: string | null;
  // Enriched join: full profile of the assignee
  assignee?: { id: string; full_name: string; email: string } | null;
  due_date?: string | null;
  resolution_notes?: string | null;
  completed_at?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  parts?: WorkOrderPart[];
  created_at: string;
  updated_at: string;
}

export interface CreateWorkOrderDto {
  equipment_id: string;
  alert_id?: string | null;
  fault_description: string;
  description?: string;
  priority?: AlertPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  parts?: {
    spare_part_id: string;
    quantity_required: number;
    notes?: string;
  }[];
}

export interface UpdateWorkOrderDto {
  fault_description?: string;
  description?: string;
  priority?: AlertPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  status?: WorkOrderStatus;
  resolution_notes?: string;
}

export interface CloseWorkOrderDto {
  resolution_notes: string;
  actual_parts?: PartUsageInput[];
}
