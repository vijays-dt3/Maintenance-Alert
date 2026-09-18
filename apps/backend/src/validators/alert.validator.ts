// apps/backend/src/validators/alert.validator.ts
import { z } from 'zod';

export const acknowledgeAlertSchema = z.object({
  notes: z.string().optional(),
});

export const resolveAlertSchema = z.object({
  resolution_notes: z.string().min(1, 'Resolution notes are required to resolve an alert'),
});
