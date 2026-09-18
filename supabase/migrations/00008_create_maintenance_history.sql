-- 00008_create_maintenance_history.sql
-- Maintenance History Table

CREATE TABLE IF NOT EXISTS maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  maintenance_type TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  resolution TEXT NOT NULL,
  parts_used TEXT,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
