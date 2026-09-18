// packages/shared/src/types/parameters.ts
import { ThresholdDirection } from '../constants/statuses.js';

export interface EquipmentParameter {
  id: string;
  equipment_id: string;
  name: string;
  unit: string;
  threshold_value: number;
  direction: ThresholdDirection;
  service_interval?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateParameterDto {
  equipment_id: string;
  name: string;
  unit: string;
  threshold_value: number;
  direction: ThresholdDirection;
  service_interval?: number | null;
}

export interface UpdateParameterDto {
  name?: string;
  unit?: string;
  threshold_value?: number;
  direction?: ThresholdDirection;
  service_interval?: number | null;
  is_active?: boolean;
}
