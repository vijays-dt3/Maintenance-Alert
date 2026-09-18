// apps/backend/src/controllers/maintenance-history.controller.ts
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { parsePagination } from '../utils/pagination.js';
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js';

export class MaintenanceHistoryController {
  static async list(req: Request, res: Response) {
    const pagination = parsePagination(req.query);
    const { equipment_id } = req.query;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('maintenance_history')
      .select(`
        *,
        equipment:equipment_id(name, equipment_id, location),
        work_order:work_order_id(work_order_number),
        performer:performed_by(full_name, email)
      `, { count: 'exact' });

    if (equipment_id) query = query.eq('equipment_id', equipment_id);

    query = query
      .order('performed_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, count, error } = await query;
    if (error) {
      return sendError(res, 'FETCH_FAILED', error.message, 500);
    }

    return sendPaginated(res, data || [], {
      page: pagination.page,
      limit: pagination.limit,
      total: count || 0,
    });
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('maintenance_history')
      .select(`
        *,
        equipment:equipment_id(*),
        work_order:work_order_id(*),
        performer:performed_by(full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return sendError(res, 'NOT_FOUND', 'Maintenance record not found', 404);
    }

    return sendSuccess(res, data);
  }
}
