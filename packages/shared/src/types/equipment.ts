// packages/shared/src/types/equipment.ts
import { EquipmentCriticality, EquipmentStatus } from '../constants/statuses.js';
import { EquipmentParameter } from './parameters.js';

export interface EquipmentType {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Equipment {
  id: string;
  equipment_id: string;
  name: string;
  location: string;
  type_id: string;
  type?: EquipmentType;
  criticality: EquipmentCriticality;
  status: EquipmentStatus;
  last_service_date?: string | null;
  parameters?: EquipmentParameter[];
  // Enriched fields returned by the equipment detail endpoint
  active_alerts?: any[];
  active_work_orders?: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentDto {
  equipment_id: string;
  name: string;
  location: string;
  type_id: string;
  criticality: EquipmentCriticality;
}

export interface UpdateEquipmentDto {
  name?: string;
  location?: string;
  type_id?: string;
  criticality?: EquipmentCriticality;
  status?: EquipmentStatus;
  last_service_date?: string | null;
}
