// apps/backend/src/services/predictive-maintenance.service.ts
import {
  CreateReadingDto,
  ReadingProcessingResult,
  EquipmentStatus,
  MaintenanceAlert,
  ParameterReading,
} from '@maintenance/shared';
import { getSupabaseAdmin } from '../config/supabase.js';
import { ThresholdEvaluatorService } from './threshold-evaluator.service.js';
import { PriorityCalculatorService } from './priority-calculator.service.js';
import { EquipmentStatusEvaluatorService } from './equipment-status-evaluator.service.js';

export class PredictiveMaintenanceService {
  /**
   * Processes an incoming equipment parameter reading through the predictive maintenance pipeline:
   * Sensor reading -> Threshold evaluation -> Breach detection -> Alert creation -> Priority scoring -> Equipment status update
   */
  static async processReading(
    dto: CreateReadingDto,
    recordedByUserId?: string
  ): Promise<ReadingProcessingResult> {
    const supabase = getSupabaseAdmin();

    // 1. Fetch equipment parameter config
    const { data: param, error: paramErr } = await supabase
      .from('equipment_parameters')
      .select('id, name, unit, threshold_value, direction, is_active, equipment_id')
      .eq('id', dto.parameter_id)
      .single();

    if (paramErr || !param) {
      throw new Error(`Parameter with ID ${dto.parameter_id} not found`);
    }

    // 2. Fetch equipment criticality and current status
    const { data: equip, error: equipErr } = await supabase
      .from('equipment')
      .select('id, name, equipment_id, criticality, status')
      .eq('id', dto.equipment_id)
      .single();

    if (equipErr || !equip) {
      throw new Error(`Equipment with ID ${dto.equipment_id} not found`);
    }

    // 3. Store parameter reading record
    const recordedAt = dto.recorded_at || new Date().toISOString();
    const { data: reading, error: readingErr } = await supabase
      .from('parameter_readings')
      .insert({
        equipment_id: dto.equipment_id,
        parameter_id: dto.parameter_id,
        value: dto.value,
        unit: dto.unit || param.unit,
        recorded_by: recordedByUserId || null,
        notes: dto.notes || null,
        recorded_at: recordedAt,
      })
      .select()
      .single();

    if (readingErr || !reading) {
      throw new Error(`Failed to save reading: ${readingErr?.message}`);
    }

    // 4. Threshold evaluation via dedicated ThresholdEvaluatorService (v2 explicit direction logic)
    const evaluation = ThresholdEvaluatorService.evaluate(
      dto.value,
      param.threshold_value,
      param.direction
    );

    let createdAlert: MaintenanceAlert | null = null;
    let equipmentStatus: EquipmentStatus = equip.status as EquipmentStatus;

    if (evaluation.breached) {
      // 5. Calculate priority and corrective suggested action
      const priority = PriorityCalculatorService.calculate(
        evaluation.breachPercentage,
        equip.criticality
      );
      const suggestedAction = PriorityCalculatorService.generateSuggestedAction(
        param.name,
        priority
      );

      // 6. Record threshold breach entry
      const { data: breach, error: breachErr } = await supabase
        .from('threshold_breaches')
        .insert({
          equipment_id: dto.equipment_id,
          parameter_id: dto.parameter_id,
          reading_id: reading.id,
          current_value: dto.value,
          threshold_value: param.threshold_value,
          breach_percentage: Math.round(evaluation.breachPercentage * 100) / 100,
          breached_at: recordedAt,
        })
        .select()
        .single();

      if (breachErr || !breach) {
        throw new Error(`Failed to log threshold breach: ${breachErr?.message}`);
      }

      // 7. Generate alert identifier (e.g. ALT-YYYY-NNNNN)
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const alertIdCode = `ALT-${year}-${randomSuffix}`;

      // 8. Create maintenance alert (v2: NO work_order_id column)
      const { data: alertData, error: alertErr } = await supabase
        .from('maintenance_alerts')
        .insert({
          alert_id: alertIdCode,
          equipment_id: dto.equipment_id,
          breach_id: breach.id,
          parameter_id: dto.parameter_id,
          current_value: dto.value,
          threshold_value: param.threshold_value,
          breach_percentage: Math.round(evaluation.breachPercentage * 100) / 100,
          priority,
          status: 'OPEN',
          suggested_action: suggestedAction,
        })
        .select(`
          id, alert_id, equipment_id, breach_id, parameter_id,
          current_value, threshold_value, breach_percentage,
          priority, status, suggested_action, created_at, updated_at
        `)
        .single();

      if (alertErr || !alertData) {
        throw new Error(`Failed to create maintenance alert: ${alertErr?.message}`);
      }

      createdAlert = alertData as MaintenanceAlert;

      // 9. Re-evaluate and sync equipment status
      equipmentStatus = await EquipmentStatusEvaluatorService.evaluateAndSync(dto.equipment_id);
    }

    return {
      reading: reading as ParameterReading,
      breached: evaluation.breached,
      breachPercentage: Math.round(evaluation.breachPercentage * 100) / 100,
      alert: createdAlert,
      equipmentStatus,
      message: evaluation.breached
        ? `Threshold breached by ${(Math.round(evaluation.breachPercentage * 100) / 100).toFixed(2)}%! Maintenance alert ${createdAlert?.alert_id} generated.`
        : 'Reading within operational thresholds. Equipment remains Healthy.',
    };
  }
}
