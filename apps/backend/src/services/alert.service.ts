// apps/backend/src/services/alert.service.ts
import { AlertPriority, AlertStatus, MaintenanceAlert } from '@maintenance/shared';
import { getSupabaseAdmin } from '../config/supabase.js';
import { EquipmentStatusEvaluatorService } from './equipment-status-evaluator.service.js';

export class AlertService {
  /**
   * Retrieves an alert by ID, including its linked work order if one exists (v2 unidirectional query).
   */
  static async getById(id: string): Promise<MaintenanceAlert> {
    const supabase = getSupabaseAdmin();

    const { data: alert, error: alertErr } = await supabase
      .from('maintenance_alerts')
      .select(`
        id, alert_id, equipment_id, breach_id, parameter_id,
        current_value, threshold_value, breach_percentage,
        priority, status, suggested_action, created_at, updated_at,
        equipment:equipment_id(id, equipment_id, name, location, criticality, status),
        parameter:parameter_id(id, name, unit, threshold_value, direction)
      `)
      .eq('id', id)
      .single();

    if (alertErr || !alert) {
      throw new Error('Maintenance alert not found');
    }

    // Query work_orders to find linked work order via alert_id (v2 unidirectional FK)
    const { data: linkedWO } = await supabase
      .from('work_orders')
      .select('id, work_order_number, status, assigned_to, created_at')
      .eq('alert_id', id)
      .maybeSingle();

    return {
      ...(alert as any),
      work_order: linkedWO || null,
    };
  }

  /**
   * Acknowledges an open alert (OPEN -> ACKNOWLEDGED).
   */
  static async acknowledge(id: string): Promise<MaintenanceAlert> {
    const supabase = getSupabaseAdmin();

    const { data: alert, error: getErr } = await supabase
      .from('maintenance_alerts')
      .select('id, status')
      .eq('id', id)
      .single();

    if (getErr || !alert) {
      throw new Error('Maintenance alert not found');
    }

    if (alert.status !== 'OPEN') {
      throw new Error(`Only OPEN alerts can be acknowledged (current status: ${alert.status})`);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('maintenance_alerts')
      .update({
        status: 'ACKNOWLEDGED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to acknowledge alert: ${updateErr?.message}`);
    }

    return updated as MaintenanceAlert;
  }

  /**
   * Directly resolves an alert and re-evaluates equipment status.
   */
  static async resolve(id: string, notes?: string): Promise<MaintenanceAlert> {
    const supabase = getSupabaseAdmin();

    const { data: alert, error: getErr } = await supabase
      .from('maintenance_alerts')
      .select('id, equipment_id, status')
      .eq('id', id)
      .single();

    if (getErr || !alert) {
      throw new Error('Maintenance alert not found');
    }

    if (alert.status === 'RESOLVED') {
      throw new Error('Alert is already resolved');
    }

    const { data: updated, error: updateErr } = await supabase
      .from('maintenance_alerts')
      .update({
        status: 'RESOLVED',
        suggested_action: notes
          ? `Directly resolved: ${notes}`
          : 'Directly resolved by maintenance engineer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to resolve alert: ${updateErr?.message}`);
    }

    // Re-evaluate equipment status after alert resolution
    await EquipmentStatusEvaluatorService.evaluateAndSync(alert.equipment_id);

    return updated as MaintenanceAlert;
  }
}
