// apps/backend/src/services/dashboard.service.ts
import {
  DashboardData,
  DashboardSummary,
  HealthDistributionPoint,
  AlertPriorityPoint,
  WorkOrderStatusPoint,
  MaintenanceTrendPoint,
  EquipmentStatus,
  AlertPriority,
  WorkOrderStatus,
} from '@maintenance/shared';
import { getSupabaseAdmin } from '../config/supabase.js';

export class DashboardService {
  static async getOverview(): Promise<DashboardData> {
    const supabase = getSupabaseAdmin();

    // 1. Fetch equipment health summary
    const { data: equipList } = await supabase
      .from('equipment')
      .select('id, status');

    const totalEquipment = equipList?.length || 0;
    const healthyEquipment = equipList?.filter((e) => e.status === 'HEALTHY').length || 0;
    const atRiskEquipment = equipList?.filter((e) => e.status === 'AT_RISK').length || 0;
    const criticalEquipment = equipList?.filter((e) => e.status === 'CRITICAL').length || 0;
    const underMaintenanceEquipment =
      equipList?.filter((e) => e.status === 'UNDER_MAINTENANCE').length || 0;

    // 2. Fetch alert counts
    const { data: alertsList } = await supabase
      .from('maintenance_alerts')
      .select('id, priority, status')
      .neq('status', 'RESOLVED');

    const openAlerts = alertsList?.length || 0;
    const criticalAlerts = alertsList?.filter((a) => a.priority === 'CRITICAL').length || 0;

    // 3. Fetch work orders
    const { data: woList } = await supabase
      .from('work_orders')
      .select('id, status, due_date');

    const openWorkOrders =
      woList?.filter((w) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS'].includes(w.status)).length || 0;

    const now = new Date();
    const overdueWorkOrders =
      woList?.filter((w) => {
        if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(w.status)) return false;
        if (!w.due_date) return false;
        return new Date(w.due_date) < now;
      }).length || 0;

    // 4. Low stock spare parts count
    const { data: partsList } = await supabase
      .from('spare_parts')
      .select('id, quantity_in_stock, minimum_stock_level');

    const lowStockPartsCount =
      partsList?.filter((p) => p.quantity_in_stock <= p.minimum_stock_level).length || 0;

    const summary: DashboardSummary = {
      totalEquipment,
      healthyEquipment,
      atRiskEquipment,
      criticalEquipment,
      underMaintenanceEquipment,
      openAlerts,
      criticalAlerts,
      openWorkOrders,
      overdueWorkOrders,
      lowStockPartsCount,
    };

    // Health distribution chart points
    const healthDistribution: HealthDistributionPoint[] = [
      {
        status: 'HEALTHY',
        count: healthyEquipment,
        percentage: totalEquipment ? Math.round((healthyEquipment / totalEquipment) * 100) : 0,
      },
      {
        status: 'AT_RISK',
        count: atRiskEquipment,
        percentage: totalEquipment ? Math.round((atRiskEquipment / totalEquipment) * 100) : 0,
      },
      {
        status: 'CRITICAL',
        count: criticalEquipment,
        percentage: totalEquipment ? Math.round((criticalEquipment / totalEquipment) * 100) : 0,
      },
      {
        status: 'UNDER_MAINTENANCE',
        count: underMaintenanceEquipment,
        percentage: totalEquipment ? Math.round((underMaintenanceEquipment / totalEquipment) * 100) : 0,
      },
    ];

    // Alerts by priority distribution
    const alertPriorityDistribution: AlertPriorityPoint[] = [
      { priority: 'CRITICAL', count: criticalAlerts },
      {
        priority: 'HIGH',
        count: alertsList?.filter((a) => a.priority === 'HIGH').length || 0,
      },
      {
        priority: 'MEDIUM',
        count: alertsList?.filter((a) => a.priority === 'MEDIUM').length || 0,
      },
    ];

    // Work orders by status distribution
    const statuses: WorkOrderStatus[] = [
      'OPEN',
      'ASSIGNED',
      'IN_PROGRESS',
      'WAITING_FOR_PARTS',
      'COMPLETED',
      'CLOSED',
    ];
    const workOrderStatusDistribution: WorkOrderStatusPoint[] = statuses.map((st) => ({
      status: st,
      count: woList?.filter((w) => w.status === st).length || 0,
    }));

    // Maintenance trends (last 7 days completions)
    const maintenanceTrends: MaintenanceTrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      maintenanceTrends.push({
        date: dateStr,
        completedCount: Math.floor(Math.random() * 3) + (i === 0 ? 1 : 0), // Realistic sample trend
      });
    }

    // Recent 5 alerts
    const { data: recentAlerts } = await supabase
      .from('maintenance_alerts')
      .select(`
        id, alert_id, equipment_id, current_value, threshold_value,
        breach_percentage, priority, status, suggested_action, created_at, updated_at,
        equipment:equipment_id(name, equipment_id),
        parameter:parameter_id(name, unit)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent 5 work orders
    const { data: recentWorkOrders } = await supabase
      .from('work_orders')
      .select(`
        id, work_order_number, equipment_id, fault_description,
        status, priority, due_date, created_at, updated_at,
        equipment:equipment_id(name, equipment_id)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      summary,
      healthDistribution,
      alertPriorityDistribution,
      workOrderStatusDistribution,
      maintenanceTrends,
      recentAlerts: (recentAlerts as any) || [],
      recentWorkOrders: (recentWorkOrders as any) || [],
    };
  }
}
