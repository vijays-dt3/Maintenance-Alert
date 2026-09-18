// packages/shared/src/types/spare-parts.ts
import { PartAvailability } from '../constants/statuses.js';

export interface SparePart {
  id: string;
  part_number: string;
  name: string;
  description?: string | null;
  quantity_in_stock: number;
  minimum_stock_level: number;
  unit: string;
  storage_location?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderPart {
  id: string;
  work_order_id: string;
  spare_part_id: string;
  part?: SparePart;
  // Alias returned by some API joins
  spare_part?: SparePart;
  quantity_required: number;
  quantity_used: number;
  availability_status: PartAvailability;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSparePartDto {
  part_number: string;
  name: string;
  description?: string;
  quantity_in_stock: number;
  minimum_stock_level: number;
  unit: string;
  storage_location?: string;
}

export interface UpdateSparePartDto {
  name?: string;
  description?: string;
  quantity_in_stock?: number;
  minimum_stock_level?: number;
  unit?: string;
  storage_location?: string;
}

export interface PartUsageInput {
  spare_part_id: string;
  quantity_used: number;
}
