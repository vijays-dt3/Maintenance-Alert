// packages/shared/src/types/maintenance-history.ts
import { Equipment } from './equipment.js';
import { WorkOrder } from './work-orders.js';

export interface MaintenanceHistory {
  id: string;
  equipment_id: string;
  equipment?: Equipment;
  work_order_id?: string | null;
  work_order?: WorkOrder | null;
  maintenance_type: string;
  issue_description: string;
  resolution: string;
  parts_used?: string | null;
  performed_by?: string | null;
  performer_name?: string | null;
  duration_minutes?: number | null;
  status: string;
  performed_at: string;
  created_at: string;
}
