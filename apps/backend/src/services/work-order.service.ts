// apps/backend/src/services/work-order.service.ts
import {
  CloseWorkOrderDto,
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  WorkOrder,
  WorkOrderStatus,
} from '@maintenance/shared';
import { getSupabaseAdmin } from '../config/supabase.js';
import { generateNextLocalWorkOrderNumber } from '../utils/work-order-number.js';
import { EquipmentStatusEvaluatorService } from './equipment-status-evaluator.service.js';

export class WorkOrderService {
  /**
   * Creates a work order.
   * If alert_id is provided (v2 explicit flow):
   * 1. Validates alert exists and is in 'ACKNOWLEDGED' status.
   * 2. Validates no existing work order has already linked to this alert.
   * 3. Creates work order and transitions alert status to 'CONVERTED_TO_WORK_ORDER'.
   */
  static async create(dto: CreateWorkOrderDto, userId?: string): Promise<WorkOrder> {
    const supabase = getSupabaseAdmin();

    // If linked to an alert, validate state
    if (dto.alert_id) {
      const { data: alert, error: alertErr } = await supabase
        .from('maintenance_alerts')
        .select('id, status, equipment_id, priority, current_value, threshold_value')
        .eq('id', dto.alert_id)
        .single();

      if (alertErr || !alert) {
        throw new Error('Associated maintenance alert not found');
      }

      if (alert.status !== 'ACKNOWLEDGED') {
        throw new Error(
          `Alert must be ACKNOWLEDGED before converting to a work order (current status: ${alert.status})`
        );
      }

      // Check if a work order already exists for this alert (enforced by DB unique index as well)
      const { data: existingWO } = await supabase
        .from('work_orders')
        .select('id, work_order_number')
        .eq('alert_id', dto.alert_id)
        .maybeSingle();

      if (existingWO) {
        throw new Error(
          `Work order ${existingWO.work_order_number} has already been created for this alert`
        );
      }
    }

    // Generate work order number via DB sequence or fallback
    let workOrderNumber = '';
    try {
      const { data: numData } = await supabase.rpc('generate_work_order_number');
      if (numData) workOrderNumber = numData;
    } catch {
      // Fallback
    }
    if (!workOrderNumber) {
      workOrderNumber = generateNextLocalWorkOrderNumber();
    }

    // Insert work order
    const { data: newWO, error: woErr } = await supabase
      .from('work_orders')
      .insert({
        work_order_number: workOrderNumber,
        equipment_id: dto.equipment_id,
        alert_id: dto.alert_id || null,
        fault_description: dto.fault_description,
        description: dto.description || null,
        status: dto.assigned_to ? 'ASSIGNED' : 'OPEN',
        priority: dto.priority || 'MEDIUM',
        assigned_to: dto.assigned_to || null,
        due_date: dto.due_date || null,
      })
      .select()
      .single();

    if (woErr || !newWO) {
      throw new Error(`Failed to create work order: ${woErr?.message}`);
    }

    // Add required spare parts if supplied
    if (dto.parts && dto.parts.length > 0) {
      for (const p of dto.parts) {
        // Check part stock for initial availability indicator
        const { data: partInfo } = await supabase
          .from('spare_parts')
          .select('quantity_in_stock')
          .eq('id', p.spare_part_id)
          .single();

        const availability =
          partInfo && partInfo.quantity_in_stock >= p.quantity_required
            ? 'IN_STOCK'
            : 'NOT_IN_STOCK';

        await supabase.from('work_order_parts').insert({
          work_order_id: newWO.id,
          spare_part_id: p.spare_part_id,
          quantity_required: p.quantity_required,
          quantity_used: 0,
          availability_status: availability,
          notes: p.notes || null,
        });
      }
    }

    // If from alert, update alert status to CONVERTED_TO_WORK_ORDER
    if (dto.alert_id) {
      const { error: alertUpdateErr } = await supabase
        .from('maintenance_alerts')
        .update({
          status: 'CONVERTED_TO_WORK_ORDER',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dto.alert_id);

      if (alertUpdateErr) {
        // Attempt rollback of work order
        await supabase.from('work_orders').delete().eq('id', newWO.id);
        throw new Error(`Failed to transition alert status: ${alertUpdateErr.message}`);
      }
    }

    return newWO as WorkOrder;
  }

  /**
   * Updates work order status with state-machine transition validation.
   */
  static async updateStatus(id: string, newStatus: WorkOrderStatus): Promise<WorkOrder> {
    const supabase = getSupabaseAdmin();

    const { data: wo, error: getErr } = await supabase
      .from('work_orders')
      .select('id, status, equipment_id')
      .eq('id', id)
      .single();

    if (getErr || !wo) {
      throw new Error('Work order not found');
    }

    const currentStatus = wo.status as WorkOrderStatus;

    // Transition rules:
    // OPEN -> ASSIGNED -> IN_PROGRESS <-> WAITING_FOR_PARTS -> COMPLETED -> CLOSED
    // OPEN/ASSIGNED -> CANCELLED
    const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      OPEN: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
      ASSIGNED: ['IN_PROGRESS', 'WAITING_FOR_PARTS', 'CANCELLED', 'OPEN'],
      IN_PROGRESS: ['WAITING_FOR_PARTS', 'COMPLETED', 'CANCELLED'],
      WAITING_FOR_PARTS: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      COMPLETED: ['CLOSED', 'IN_PROGRESS'],
      CLOSED: [],
      CANCELLED: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'COMPLETED') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data: updatedWO, error: updateErr } = await supabase
      .from('work_orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updatedWO) {
      throw new Error(`Failed to update status: ${updateErr?.message}`);
    }

    // When status changes to IN_PROGRESS, set equipment status to UNDER_MAINTENANCE
    if (newStatus === 'IN_PROGRESS') {
      await supabase
        .from('equipment')
        .update({ status: 'UNDER_MAINTENANCE', updated_at: new Date().toISOString() })
        .eq('id', wo.equipment_id);
    }

    return updatedWO as WorkOrder;
  }

  /**
   * Closes a work order atomically via PostgreSQL RPC close_work_order_transaction (v2 atomic requirement).
   */
  static async close(
    id: string,
    dto: CloseWorkOrderDto,
    userId: string
  ): Promise<{ success: boolean; workOrderId: string; equipmentStatus: string }> {
    const supabase = getSupabaseAdmin();

    if (!dto.resolution_notes || dto.resolution_notes.trim() === '') {
      throw new Error('Resolution notes are required to close a work order');
    }

    // Call atomic database function close_work_order_transaction
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('close_work_order_transaction', {
      p_work_order_id: id,
      p_user_id: userId,
      p_resolution_notes: dto.resolution_notes.trim(),
      p_actual_parts: dto.actual_parts || [],
    });

    if (rpcErr) {
      throw new Error(`Atomic work order closure failed: ${rpcErr.message}`);
    }

    return {
      success: true,
      workOrderId: id,
      equipmentStatus: rpcResult?.equipment_status || 'HEALTHY',
    };
  }
}
