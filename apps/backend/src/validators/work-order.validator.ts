// apps/backend/src/validators/work-order.validator.ts
import { z } from 'zod';

export const workOrderPartItemSchema = z.object({
  spare_part_id: z.string().uuid('Invalid spare part ID'),
  quantity_required: z.number().int().positive('Quantity required must be at least 1'),
  notes: z.string().optional(),
});

export const createWorkOrderSchema = z.object({
  equipment_id: z.string().uuid('Invalid equipment ID'),
  alert_id: z.string().uuid('Invalid alert ID').nullable().optional(),
  fault_description: z.string().min(1, 'Fault description is required'),
  description: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM']).optional(),
  assigned_to: z.string().uuid('Invalid user profile ID').nullable().optional(),
  due_date: z.string().optional(),
  parts: z.array(workOrderPartItemSchema).optional(),
});

export const updateWorkOrderSchema = z.object({
  fault_description: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'COMPLETED', 'CLOSED', 'CANCELLED']).optional(),
  resolution_notes: z.string().optional(),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'COMPLETED', 'CLOSED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid work order status' }),
  }),
  notes: z.string().optional(),
});

export const actualPartUsageSchema = z.object({
  spare_part_id: z.string().uuid('Invalid spare part ID'),
  quantity_used: z.number().int().nonnegative('Quantity used must be non-negative'),
});

export const closeWorkOrderSchema = z.object({
  resolution_notes: z.string().min(1, 'Resolution notes are required to close a work order'),
  actual_parts: z.array(actualPartUsageSchema).optional().default([]),
});
