// apps/backend/src/validators/equipment.validator.ts
import { z } from 'zod';

export const createEquipmentSchema = z.object({
  equipment_id: z.string().min(1, 'Equipment code/ID is required'),
  name: z.string().min(1, 'Equipment name is required'),
  location: z.string().min(1, 'Location is required'),
  type_id: z.string().uuid('Invalid equipment type ID'),
  criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], {
    errorMap: () => ({ message: 'Criticality must be CRITICAL, HIGH, MEDIUM, or LOW' }),
  }),
});

export const updateEquipmentSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  type_id: z.string().uuid().optional(),
  criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['HEALTHY', 'AT_RISK', 'CRITICAL', 'UNDER_MAINTENANCE']).optional(),
  last_service_date: z.string().datetime().nullable().optional(),
});
