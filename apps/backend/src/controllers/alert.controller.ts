// apps/backend/src/controllers/alert.controller.ts
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { AlertService } from '../services/alert.service.js';
import { parsePagination } from '../utils/pagination.js';
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js';

export class AlertController {
  static async list(req: Request, res: Response) {
    const pagination = parsePagination(req.query);
    const { priority, status, equipment_id } = req.query;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('maintenance_alerts')
      .select(`
        *,
        equipment:equipment_id(id, equipment_id, name, location, criticality),
        parameter:parameter_id(id, name, unit, threshold_value, direction)
      `, { count: 'exact' });

    if (priority) query = query.eq('priority', priority);
    if (status) query = query.eq('status', status);
    if (equipment_id) query = query.eq('equipment_id', equipment_id);

    query = query
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, count, error } = await query;
    if (error) {
      return sendError(res, 'FETCH_FAILED', error.message, 500);
    }

    return sendPaginated(
      res,
      data || [],
      {
        page: pagination.page,
        limit: pagination.limit,
        total: count || 0,
      }
    );
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const alert = await AlertService.getById(id);
      return sendSuccess(res, alert);
    } catch (err: any) {
      return sendError(res, 'NOT_FOUND', err.message, 404);
    }
  }

  static async acknowledge(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const alert = await AlertService.acknowledge(id);
      return sendSuccess(res, alert, 'Alert acknowledged successfully');
    } catch (err: any) {
      return sendError(res, 'ACKNOWLEDGE_FAILED', err.message, 400);
    }
  }

  static async resolve(req: Request, res: Response) {
    const { id } = req.params;
    const { resolution_notes } = req.body;
    try {
      const alert = await AlertService.resolve(id, resolution_notes);
      return sendSuccess(res, alert, 'Alert resolved successfully');
    } catch (err: any) {
      return sendError(res, 'RESOLVE_FAILED', err.message, 400);
    }
  }
}
