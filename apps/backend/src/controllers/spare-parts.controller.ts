// apps/backend/src/controllers/spare-parts.controller.ts
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { parsePagination } from '../utils/pagination.js';
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js';

export class SparePartsController {
  static async list(req: Request, res: Response) {
    const pagination = parsePagination(req.query);
    const { low_stock } = req.query;

    const supabase = getSupabaseAdmin();
    let query = supabase.from('spare_parts').select('*', { count: 'exact' });

    if (pagination.search) {
      query = query.or(`name.ilike.%${pagination.search}%,part_number.ilike.%${pagination.search}%`);
    }

    query = query
      .order('part_number', { ascending: true })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, count, error } = await query;
    if (error) {
      return sendError(res, 'FETCH_FAILED', error.message, 500);
    }

    let filteredData = data || [];
    if (low_stock === 'true') {
      filteredData = filteredData.filter((p) => p.quantity_in_stock <= p.minimum_stock_level);
    }

    return sendPaginated(res, filteredData, {
      page: pagination.page,
      limit: pagination.limit,
      total: count || 0,
    });
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.from('spare_parts').select('*').eq('id', id).single();
    if (error || !data) {
      return sendError(res, 'NOT_FOUND', 'Spare part not found', 404);
    }
    return sendSuccess(res, data);
  }

  static async create(req: Request, res: Response) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('spare_parts')
      .insert(req.body)
      .select()
      .single();

    if (error) {
      return sendError(res, 'CREATE_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Spare part registered', 201);
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('spare_parts')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, 'UPDATE_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Spare part updated');
  }
}
