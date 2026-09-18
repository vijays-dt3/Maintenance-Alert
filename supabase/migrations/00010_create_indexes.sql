-- 00010_create_indexes.sql
-- Performance Indexes and Partial Unique Indexes

-- Equipment
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_criticality ON equipment(criticality);

-- Equipment Parameters
CREATE INDEX IF NOT EXISTS idx_equipment_parameters_equipment_id ON equipment_parameters(equipment_id);

-- Parameter Readings
CREATE INDEX IF NOT EXISTS idx_readings_equipment_param_time ON parameter_readings(equipment_id, parameter_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_recorded_at ON parameter_readings(recorded_at DESC);

-- Threshold Breaches
CREATE INDEX IF NOT EXISTS idx_breaches_equipment_id ON threshold_breaches(equipment_id);
CREATE INDEX IF NOT EXISTS idx_breaches_breached_at ON threshold_breaches(breached_at DESC);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_status_priority ON maintenance_alerts(status, priority);
CREATE INDEX IF NOT EXISTS idx_alerts_equipment ON maintenance_alerts(equipment_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON maintenance_alerts(created_at DESC);

-- Work Orders
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment ON work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders(due_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_orders_alert_id ON work_orders(alert_id) WHERE alert_id IS NOT NULL;

-- Work Order Parts
CREATE INDEX IF NOT EXISTS idx_work_order_parts_wo ON work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_part ON work_order_parts(spare_part_id);

-- Spare Parts
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_number ON spare_parts(part_number);

-- Maintenance History
CREATE INDEX IF NOT EXISTS idx_maintenance_history_equipment ON maintenance_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_performed_at ON maintenance_history(performed_at DESC);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
