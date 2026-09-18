-- 00013_create_views.sql
-- Aggregate Views for Fast Dashboard Reporting

CREATE OR REPLACE VIEW v_equipment_health_summary AS
SELECT
  status,
  COUNT(*) AS count
FROM equipment
GROUP BY status;

CREATE OR REPLACE VIEW v_alert_priority_summary AS
SELECT
  priority,
  status,
  COUNT(*) AS count
FROM maintenance_alerts
GROUP BY priority, status;

CREATE OR REPLACE VIEW v_work_order_status_summary AS
SELECT
  status,
  COUNT(*) AS count
FROM work_orders
GROUP BY status;

CREATE OR REPLACE VIEW v_active_equipment_alerts AS
SELECT
  e.id AS equipment_id,
  e.equipment_id AS equipment_code,
  e.name AS equipment_name,
  e.status AS equipment_status,
  COUNT(a.id) FILTER (WHERE a.status NOT IN ('RESOLVED')) AS active_alerts_count,
  COUNT(a.id) FILTER (WHERE a.status NOT IN ('RESOLVED') AND a.priority = 'CRITICAL') AS critical_alerts_count
FROM equipment e
LEFT JOIN maintenance_alerts a ON e.id = a.equipment_id
GROUP BY e.id, e.equipment_id, e.name, e.status;
