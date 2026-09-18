// apps/backend/src/validators/reading.validator.ts
import { z } from 'zod';

export const createReadingSchema = z.object({
  equipment_id: z.string().uuid('Invalid equipment ID'),
  parameter_id: z.string().uuid('Invalid parameter ID'),
  value: z.number({ required_error: 'Reading value is required' }),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
  recorded_at: z.string().datetime().optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
