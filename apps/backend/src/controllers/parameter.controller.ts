// apps/backend/src/controllers/parameter.controller.ts
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { sendError, sendSuccess } from '../utils/response.js';

export class ParameterController {
  static async listByEquipment(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('equipment_parameters')
      .select('*')
      .eq('equipment_id', id)
      .order('name', { ascending: true });

    if (error) {
      return sendError(res, 'FETCH_FAILED', error.message, 500);
    }
    return sendSuccess(res, data || []);
  }

  static async create(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const payload = { ...req.body, equipment_id: id };
    const { data, error } = await supabase
      .from('equipment_parameters')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return sendError(res, 'CREATE_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Parameter created successfully', 201);
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('equipment_parameters')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, 'UPDATE_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Parameter updated successfully');
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    // Soft-deactivate parameter
    const { data, error } = await supabase
      .from('equipment_parameters')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, 'DELETE_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Parameter deactivated');
  }
}
