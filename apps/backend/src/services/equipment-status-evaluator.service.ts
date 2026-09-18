// apps/backend/src/services/equipment-status-evaluator.service.ts
import { AlertPriority, AlertStatus, EquipmentStatus } from '@maintenance/shared';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface AlertSummaryItem {
  status: AlertStatus;
  priority: AlertPriority;
}

export class EquipmentStatusEvaluatorService {
  /**
   * Pure evaluation function based on an array of active/existing alert states.
   *
   * Business Rules (v2):
   * - If ANY unresolved CRITICAL alert exists -> 'CRITICAL'
   * - If ANY unresolved HIGH or MEDIUM alert exists (and no CRITICAL) -> 'AT_RISK'
   * - If ZERO unresolved alerts remain -> 'HEALTHY'
   */
  static evaluateFromAlerts(alerts: AlertSummaryItem[]): EquipmentStatus {
    const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');

    const hasCritical = activeAlerts.some((a) => a.priority === 'CRITICAL');
    if (hasCritical) {
      return 'CRITICAL';
    }

    const hasAtRisk = activeAlerts.some((a) => a.priority === 'HIGH' || a.priority === 'MEDIUM');
    if (hasAtRisk) {
      return 'AT_RISK';
    }

    return 'HEALTHY';
  }

  /**
   * Database-backed equipment re-evaluation function.
   * Calls the evaluate_equipment_status RPC function in Supabase or updates equipment directly.
   */
  static async evaluateAndSync(equipmentId: string): Promise<EquipmentStatus> {
    const supabase = getSupabaseAdmin();

    try {
      // Attempt to call RPC function created in migration 00012
      const { data, error } = await supabase.rpc('evaluate_equipment_status', {
        p_equipment_id: equipmentId,
      });

      if (!error && data) {
        return data as EquipmentStatus;
      }
    } catch {
      // Fallback to direct query if RPC is not yet applied
    }

    // Direct query fallback
    const { data: activeAlerts } = await supabase
      .from('maintenance_alerts')
      .select('status, priority')
      .eq('equipment_id', equipmentId)
      .neq('status', 'RESOLVED');

    const newStatus = this.evaluateFromAlerts((activeAlerts as any) || []);

    await supabase
      .from('equipment')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', equipmentId);

    return newStatus;
  }
}
