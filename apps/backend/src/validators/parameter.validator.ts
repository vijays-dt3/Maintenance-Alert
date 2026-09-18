// apps/backend/src/validators/parameter.validator.ts
import { z } from 'zod';

export const createParameterSchema = z.object({
  equipment_id: z.string().uuid('Invalid equipment ID'),
  name: z.string().min(1, 'Parameter name is required'),
  unit: z.string().min(1, 'Unit is required'),
  threshold_value: z.number().positive('Threshold value must be strictly positive'),
  direction: z.enum(['UPPER', 'LOWER'], {
    errorMap: () => ({ message: 'Direction must be UPPER or LOWER' }),
  }),
  service_interval: z.number().positive().nullable().optional(),
});

export const updateParameterSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  threshold_value: z.number().positive().optional(),
  direction: z.enum(['UPPER', 'LOWER']).optional(),
  service_interval: z.number().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});
