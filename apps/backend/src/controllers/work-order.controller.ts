// apps/backend/src/controllers/work-order.controller.ts
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { WorkOrderService } from '../services/work-order.service.js';
import { parsePagination } from '../utils/pagination.js';
import { sendError, sendPaginated, sendSuccess } from '../utils/response.js';

export class WorkOrderController {
  static async list(req: Request, res: Response) {
    const pagination = parsePagination(req.query);
    const { status, priority, equipment_id, assigned_to } = req.query;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('work_orders')
      .select(`
        *,
        equipment:equipment_id(name, equipment_id, location),
        assignee:assigned_to(full_name, email),
        parts:work_order_parts(count)
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (equipment_id) query = query.eq('equipment_id', equipment_id);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (pagination.search) {
      query = query.or(`work_order_number.ilike.%${pagination.search}%,fault_description.ilike.%${pagination.search}%`);
    }

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
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        equipment:equipment_id(*),
        alert:alert_id(*),
        assignee:assigned_to(id, full_name, email),
        closed_by_user:closed_by(id, full_name),
        parts:work_order_parts(*, spare_part:spare_part_id(*))
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return sendError(res, 'NOT_FOUND', 'Work order not found', 404);
    }

    return sendSuccess(res, data);
  }

  static async create(req: Request, res: Response) {
    try {
      const wo = await WorkOrderService.create(req.body, req.user?.id);
      return sendSuccess(res, wo, 'Work order created successfully', 201);
    } catch (err: any) {
      return sendError(res, 'CREATE_FAILED', err.message, 400);
    }
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('work_orders')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendError(res, 'UPDATE_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Work order updated');
  }

  static async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    try {
      const updated = await WorkOrderService.updateStatus(id, status);
      return sendSuccess(res, updated, `Status transitioned to ${status}`);
    } catch (err: any) {
      return sendError(res, 'STATUS_UPDATE_FAILED', err.message, 400);
    }
  }

  static async close(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const result = await WorkOrderService.close(id, req.body, req.user?.id || '00000000-0000-0000-0000-000000000001');
      return sendSuccess(res, result, 'Work order closed successfully');
    } catch (err: any) {
      return sendError(res, 'CLOSE_FAILED', err.message, 400);
    }
  }

  static async addPart(req: Request, res: Response) {
    const { id } = req.params;
    const { spare_part_id, quantity_required, notes } = req.body;
    const supabase = getSupabaseAdmin();

    // Check availability
    const { data: part } = await supabase
      .from('spare_parts')
      .select('quantity_in_stock')
      .eq('id', spare_part_id)
      .single();

    const availability =
      part && part.quantity_in_stock >= quantity_required ? 'IN_STOCK' : 'NOT_IN_STOCK';

    const { data, error } = await supabase
      .from('work_order_parts')
      .insert({
        work_order_id: id,
        spare_part_id,
        quantity_required,
        availability_status: availability,
        notes: notes || null,
      })
      .select('*, spare_part:spare_part_id(*)')
      .single();

    if (error) {
      return sendError(res, 'ADD_PART_FAILED', error.message, 400);
    }
    return sendSuccess(res, data, 'Part added to work order', 201);
  }

  static async removePart(req: Request, res: Response) {
    const { id, partId } = req.params;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('work_order_parts')
      .delete()
      .eq('work_order_id', id)
      .eq('id', partId);

    if (error) {
      return sendError(res, 'REMOVE_PART_FAILED', error.message, 400);
    }
    return sendSuccess(res, { removed: true }, 'Part removed from work order');
  }
}
