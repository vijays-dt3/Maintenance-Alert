// packages/shared/src/types/readings.ts
import { EquipmentStatus } from '../constants/statuses.js';
import { MaintenanceAlert } from './alerts.js';

export interface ParameterReading {
  id: string;
  parameter_id: string;
  equipment_id: string;
  value: number;
  unit: string;
  recorded_by?: string | null;
  notes?: string | null;
  recorded_at: string;
  created_at: string;
}

export interface CreateReadingDto {
  equipment_id: string;
  parameter_id: string;
  value: number;
  unit: string;
  notes?: string;
  recorded_at?: string;
}

export interface ReadingProcessingResult {
  reading: ParameterReading;
  breached: boolean;
  breachPercentage: number;
  alert?: MaintenanceAlert | null;
  equipmentStatus: EquipmentStatus;
  message: string;
}
