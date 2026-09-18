-- 00005_create_alert_tables.sql
-- Threshold Breaches and Maintenance Alerts Tables (v2: No work_order_id on maintenance_alerts)

CREATE TABLE IF NOT EXISTS threshold_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL REFERENCES equipment_parameters(id) ON DELETE CASCADE,
  reading_id UUID NOT NULL REFERENCES parameter_readings(id) ON DELETE CASCADE,
  current_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  breach_percentage NUMERIC NOT NULL CHECK (breach_percentage > 0),
  breached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT UNIQUE NOT NULL,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  breach_id UUID NOT NULL REFERENCES threshold_breaches(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL REFERENCES equipment_parameters(id) ON DELETE CASCADE,
  current_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  breach_percentage NUMERIC NOT NULL,
  priority alert_priority NOT NULL,
  status alert_status NOT NULL DEFAULT 'OPEN',
  suggested_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
