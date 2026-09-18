// apps/backend/src/controllers/reading.controller.ts
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { parsePagination } from '../utils/pagination.js';
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js';
import { PredictiveMaintenanceService } from '../services/predictive-maintenance.service.js';

export class ReadingController {
  static async create(req: Request, res: Response) {
    try {
      const result = await PredictiveMaintenanceService.processReading(
        req.body,
        req.user?.id
      );
      return sendSuccess(res, result, result.message, 201);
    } catch (err: any) {
      return sendError(res, 'READING_PROCESSING_FAILED', err.message, 400);
    }
  }

  static async list(req: Request, res: Response) {
    const pagination = parsePagination(req.query);
    const { equipment_id, parameter_id } = req.query;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('parameter_readings')
      .select(`
        *,
        equipment:equipment_id(name, equipment_id),
        parameter:parameter_id(name, unit, threshold_value, direction),
        recorder:recorded_by(full_name)
      `, { count: 'exact' });

    if (equipment_id) query = query.eq('equipment_id', equipment_id);
    if (parameter_id) query = query.eq('parameter_id', parameter_id);

    query = query
      .order('recorded_at', { ascending: false })
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

  static async listByEquipment(req: Request, res: Response) {
    const { id } = req.params;
    const pagination = parsePagination(req.query);
    const supabase = getSupabaseAdmin();

    const { data, count, error } = await supabase
      .from('parameter_readings')
      .select(`
        *,
        parameter:parameter_id(name, unit, threshold_value, direction),
        recorder:recorded_by(full_name)
      `, { count: 'exact' })
      .eq('equipment_id', id)
      .order('recorded_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

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
}
