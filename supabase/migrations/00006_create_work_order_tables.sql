-- 00006_create_work_order_tables.sql
-- Work Orders Table with alert_id UNIQUE (nullable) and Auto Numbering Sequence

CREATE SEQUENCE IF NOT EXISTS work_order_seq START 1;

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT UNIQUE NOT NULL,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  alert_id UUID UNIQUE REFERENCES maintenance_alerts(id) ON DELETE SET NULL,
  fault_description TEXT NOT NULL,
  description TEXT,
  status work_order_status NOT NULL DEFAULT 'OPEN',
  priority alert_priority NOT NULL DEFAULT 'MEDIUM',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  resolution_notes TEXT,
  completed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
