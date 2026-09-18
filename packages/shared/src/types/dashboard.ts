// packages/shared/src/types/dashboard.ts
import { AlertPriority } from '../constants/priorities.js';
import { EquipmentStatus, WorkOrderStatus } from '../constants/statuses.js';
import { MaintenanceAlert } from './alerts.js';
import { WorkOrder } from './work-orders.js';

export interface DashboardSummary {
  totalEquipment: number;
  healthyEquipment: number;
  atRiskEquipment: number;
  criticalEquipment: number;
  underMaintenanceEquipment: number;
  openAlerts: number;
  criticalAlerts: number;
  openWorkOrders: number;
  overdueWorkOrders: number;
  lowStockPartsCount: number;
}

export interface HealthDistributionPoint {
  status: EquipmentStatus;
  count: number;
  percentage: number;
}

export interface AlertPriorityPoint {
  priority: AlertPriority;
  count: number;
}

export interface WorkOrderStatusPoint {
  status: WorkOrderStatus;
  count: number;
}

export interface MaintenanceTrendPoint {
  date: string;
  completedCount: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  healthDistribution: HealthDistributionPoint[];
  alertPriorityDistribution: AlertPriorityPoint[];
  workOrderStatusDistribution: WorkOrderStatusPoint[];
  maintenanceTrends: MaintenanceTrendPoint[];
  recentAlerts: MaintenanceAlert[];
  recentWorkOrders: WorkOrder[];
}
