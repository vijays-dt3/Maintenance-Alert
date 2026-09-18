// apps/backend/src/validators/spare-parts.validator.ts
import { z } from 'zod';

export const createSparePartSchema = z.object({
  part_number: z.string().min(1, 'Part number is required'),
  name: z.string().min(1, 'Part name is required'),
  description: z.string().optional(),
  quantity_in_stock: z.number().int().nonnegative('Quantity in stock cannot be negative'),
  minimum_stock_level: z.number().int().nonnegative('Minimum stock level cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  storage_location: z.string().optional(),
});

export const updateSparePartSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  quantity_in_stock: z.number().int().nonnegative().optional(),
  minimum_stock_level: z.number().int().nonnegative().optional(),
  unit: z.string().min(1).optional(),
  storage_location: z.string().optional(),
});
