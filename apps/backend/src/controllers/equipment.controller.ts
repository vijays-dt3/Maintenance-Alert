// apps/backend/src/controllers/equipment.controller.ts
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { parsePagination } from '../utils/pagination.js';
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js';

export class EquipmentController {
  static async list(req: Request, res: Response) {
    const pagination = parsePagination(req.query);
    const { status, criticality, type_id, location } = req.query;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('equipment')
      .select('*, type:type_id(id, name), parameters:equipment_parameters(count)', {
        count: 'exact',
      });

    if (status) query = query.eq('status', status);
    if (criticality) query = query.eq('criticality', criticality);
    if (type_id) query = query.eq('type_id', type_id);
    if (location) query = query.ilike('location', `%${location}%`);
    if (pagination.search) {
      query = query.or(`name.ilike.%${pagination.search}%,equipment_id.ilike.%${pagination.search}%`);
    }

    query = query
      .order(pagination.sort || 'created_at', { ascending: pagination.order === 'asc' })
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
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        type:type_id(id, name, description),
        parameters:equipment_parameters(*),
        active_alerts:maintenance_alerts(*, parameter:parameter_id(name, unit)),
        active_work_orders:work_orders(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return sendError(res, 'NOT_FOUND', 'Equipment not found', 404);
    }

    return sendSuccess(res, data);
  }

  static async create(req: Request, res: Response) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('equipment')
      .insert(req.body)
      .select()
      .single();

    if (error) {
      return sendError(res, 'CREATE_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Equipment created successfully', 201);
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('equipment')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, 'UPDATE_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Equipment updated successfully');
  }
}
