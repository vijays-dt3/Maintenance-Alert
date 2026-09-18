-- ================================================================
-- COMBINED MIGRATION FILE — Predictive Maintenance Alert System
-- Generated: 2026-09-18T10:07:26.543Z
-- Apply this entire file in the Supabase SQL Editor
-- ================================================================


-- ----------------------------------------------------------------
-- 00001_create_enums.sql
-- ----------------------------------------------------------------
-- 00001_create_enums.sql
-- Enums for Predictive Maintenance Alert & Work Order System

CREATE TYPE equipment_status AS ENUM (
  'HEALTHY',
  'AT_RISK',
  'CRITICAL',
  'UNDER_MAINTENANCE'
);

CREATE TYPE equipment_criticality AS ENUM (
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW'
);

CREATE TYPE alert_priority AS ENUM (
  'CRITICAL',
  'HIGH',
  'MEDIUM'
);

CREATE TYPE alert_status AS ENUM (
  'OPEN',
  'ACKNOWLEDGED',
  'CONVERTED_TO_WORK_ORDER',
  'RESOLVED'
);

CREATE TYPE work_order_status AS ENUM (
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_PARTS',
  'COMPLETED',
  'CLOSED',
  'CANCELLED'
);

CREATE TYPE part_availability AS ENUM (
  'IN_STOCK',
  'ORDERED',
  'NOT_IN_STOCK'
);

CREATE TYPE threshold_direction AS ENUM (
  'UPPER',
  'LOWER'
);

CREATE TYPE user_role AS ENUM (
  'MAINTENANCE_ENGINEER',
  'PLANT_MANAGER'
);


-- ----------------------------------------------------------------
-- 00002_create_profiles_and_roles.sql
-- ----------------------------------------------------------------
-- 00002_create_profiles_and_roles.sql
-- Roles and User Profiles linked to Supabase auth.users

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name user_role UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed static roles
INSERT INTO roles (name, description) VALUES
  ('MAINTENANCE_ENGINEER', 'Can view, create readings, acknowledge alerts, create/manage work orders and spare parts'),
  ('PLANT_MANAGER', 'Read-only access to all modules, reports, and dashboards')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------
-- 00003_create_equipment_tables.sql
-- ----------------------------------------------------------------
-- 00003_create_equipment_tables.sql
-- Equipment Types and Equipment Tables

CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  type_id UUID NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
  criticality equipment_criticality NOT NULL DEFAULT 'MEDIUM',
  status equipment_status NOT NULL DEFAULT 'HEALTHY',
  last_service_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------
-- 00004_create_reading_tables.sql
-- ----------------------------------------------------------------
-- 00004_create_reading_tables.sql
-- Equipment Parameters and Parameter Readings Tables

CREATE TABLE IF NOT EXISTS equipment_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL CHECK (threshold_value > 0),
  direction threshold_direction NOT NULL DEFAULT 'UPPER',
  service_interval NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parameter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id UUID NOT NULL REFERENCES equipment_parameters(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------
-- 00005_create_alert_tables.sql
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- 00006_create_work_order_tables.sql
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- 00007_create_spare_parts_tables.sql
-- ----------------------------------------------------------------
-- 00007_create_spare_parts_tables.sql
-- Spare Parts and Work Order Parts Tables (v2: quantity_in_stock >= 0 CHECK constraint)

CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
  minimum_stock_level INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  storage_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE RESTRICT,
  quantity_required INTEGER NOT NULL CHECK (quantity_required > 0),
  quantity_used INTEGER NOT NULL DEFAULT 0 CHECK (quantity_used >= 0),
  availability_status part_availability NOT NULL DEFAULT 'NOT_IN_STOCK',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_work_order_spare_part UNIQUE (work_order_id, spare_part_id)
);


-- ----------------------------------------------------------------
-- 00008_create_maintenance_history.sql
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- 00009_create_audit_logs.sql
-- ----------------------------------------------------------------
-- 00009_create_audit_logs.sql
-- Audit Logs Table

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------
-- 00010_create_indexes.sql
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- 00011_create_rls_policies.sql
-- ----------------------------------------------------------------
-- 00011_create_rls_policies.sql
-- Row Level Security (RLS) Policies

-- Enable RLS on all operational tables
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch authenticated user's role name
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT r.name
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Roles: readable by authenticated users
CREATE POLICY "Roles are viewable by authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: readable by authenticated, updatable by owner
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Equipment Types: readable by all authenticated, manageable by Engineer
CREATE POLICY "Equipment types readable by authenticated"
  ON equipment_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Equipment types modifiable by engineers"
  ON equipment_types FOR ALL
  TO authenticated
  USING (current_user_role() = 'MAINTENANCE_ENGINEER')
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Equipment: readable by all, engineer can insert/update/delete
CREATE POLICY "Equipment readable by authenticated"
  ON equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Equipment modifiable by engineers"
  ON equipment FOR ALL
  TO authenticated
  USING (current_user_role() = 'MAINTENANCE_ENGINEER')
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Equipment Parameters
CREATE POLICY "Equipment parameters readable by authenticated"
  ON equipment_parameters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Equipment parameters modifiable by engineers"
  ON equipment_parameters FOR ALL
  TO authenticated
  USING (current_user_role() = 'MAINTENANCE_ENGINEER')
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Parameter Readings
CREATE POLICY "Parameter readings readable by authenticated"
  ON parameter_readings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Parameter readings insertable by engineers"
  ON parameter_readings FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Threshold Breaches: readable by all, insertable by engineers or system
CREATE POLICY "Threshold breaches readable by authenticated"
  ON threshold_breaches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Threshold breaches insertable by engineers"
  ON threshold_breaches FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Maintenance Alerts: readable by all, engineer can update
CREATE POLICY "Alerts readable by authenticated"
  ON maintenance_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Alerts insertable by engineers"
  ON maintenance_alerts FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

CREATE POLICY "Alerts updatable by engineers"
  ON maintenance_alerts FOR UPDATE
  TO authenticated
  USING (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Work Orders
CREATE POLICY "Work orders readable by authenticated"
  ON work_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Work orders modifiable by engineers"
  ON work_orders FOR ALL
  TO authenticated
  USING (current_user_role() = 'MAINTENANCE_ENGINEER')
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Work Order Parts
CREATE POLICY "Work order parts readable by authenticated"
  ON work_order_parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Work order parts modifiable by engineers"
  ON work_order_parts FOR ALL
  TO authenticated
  USING (current_user_role() = 'MAINTENANCE_ENGINEER')
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Spare Parts
CREATE POLICY "Spare parts readable by authenticated"
  ON spare_parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Spare parts modifiable by engineers"
  ON spare_parts FOR ALL
  TO authenticated
  USING (current_user_role() = 'MAINTENANCE_ENGINEER')
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Maintenance History
CREATE POLICY "Maintenance history readable by authenticated"
  ON maintenance_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Maintenance history insertable by engineers"
  ON maintenance_history FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() = 'MAINTENANCE_ENGINEER');

-- Audit Logs
CREATE POLICY "Audit logs readable by authenticated"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Audit logs insertable by authenticated"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ----------------------------------------------------------------
-- 00012_create_functions_triggers.sql
-- ----------------------------------------------------------------
-- 00012_create_functions_triggers.sql
-- Functions, Triggers, and Atomic Work Order Closure RPC

-- 1. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_equipment_parameters_updated_at BEFORE UPDATE ON equipment_parameters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_maintenance_alerts_updated_at BEFORE UPDATE ON maintenance_alerts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_work_order_parts_updated_at BEFORE UPDATE ON work_order_parts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_spare_parts_updated_at BEFORE UPDATE ON spare_parts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Trigger on auth.users to automatically create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_default_role_id UUID;
BEGIN
  -- Default to MAINTENANCE_ENGINEER or use metadata role if provided
  SELECT id INTO v_default_role_id
  FROM roles
  WHERE name = COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'MAINTENANCE_ENGINEER'::user_role);

  INSERT INTO profiles (id, full_name, email, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_default_role_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Work Order Number Generator
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq_num BIGINT;
  v_result TEXT;
BEGIN
  v_year := to_char(NOW(), 'YYYY');
  v_seq_num := nextval('work_order_seq');
  v_result := 'WO-' || v_year || '-' || LPAD(v_seq_num::TEXT, 5, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. Inventory Availability Checker
CREATE OR REPLACE FUNCTION check_inventory_availability(
  p_part_id UUID,
  p_quantity_required INTEGER
) RETURNS part_availability AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT quantity_in_stock INTO v_stock
  FROM spare_parts
  WHERE id = p_part_id;

  IF NOT FOUND THEN
    RETURN 'NOT_IN_STOCK';
  END IF;

  IF v_stock >= p_quantity_required THEN
    RETURN 'IN_STOCK';
  ELSE
    RETURN 'NOT_IN_STOCK';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Atomic Inventory Deduction with Row-Level Locking
CREATE OR REPLACE FUNCTION deduct_inventory(
  p_part_id UUID,
  p_qty INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  IF p_qty <= 0 THEN
    RETURN TRUE;
  END IF;

  SELECT quantity_in_stock INTO v_stock
  FROM spare_parts
  WHERE id = p_part_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Spare part % not found', p_part_id;
  END IF;

  IF v_stock < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock for part % (available: %, requested: %)', p_part_id, v_stock, p_qty;
  END IF;

  UPDATE spare_parts
  SET quantity_in_stock = quantity_in_stock - p_qty,
      updated_at = NOW()
  WHERE id = p_part_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Evaluate Equipment Status (Considers all active alerts/breaches)
CREATE OR REPLACE FUNCTION evaluate_equipment_status(p_equipment_id UUID)
RETURNS equipment_status AS $$
DECLARE
  v_critical_count INTEGER;
  v_at_risk_count INTEGER;
  v_new_status equipment_status;
BEGIN
  -- Count active CRITICAL alerts
  SELECT COUNT(*) INTO v_critical_count
  FROM maintenance_alerts
  WHERE equipment_id = p_equipment_id
    AND status NOT IN ('RESOLVED')
    AND priority = 'CRITICAL';

  -- Count active non-CRITICAL alerts (HIGH, MEDIUM)
  SELECT COUNT(*) INTO v_at_risk_count
  FROM maintenance_alerts
  WHERE equipment_id = p_equipment_id
    AND status NOT IN ('RESOLVED')
    AND priority IN ('HIGH', 'MEDIUM');

  IF v_critical_count > 0 THEN
    v_new_status := 'CRITICAL';
  ELSIF v_at_risk_count > 0 THEN
    v_new_status := 'AT_RISK';
  ELSE
    v_new_status := 'HEALTHY';
  END IF;

  UPDATE equipment
  SET status = v_new_status,
      updated_at = NOW()
  WHERE id = p_equipment_id;

  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atomic Work Order Closure RPC Function
CREATE OR REPLACE FUNCTION close_work_order_transaction(
  p_work_order_id UUID,
  p_user_id UUID,
  p_resolution_notes TEXT,
  p_actual_parts JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_wo RECORD;
  v_part RECORD;
  v_part_record RECORD;
  v_alert_id UUID;
  v_equipment_id UUID;
  v_parts_used_summary TEXT := '';
  v_new_status equipment_status;
BEGIN
  -- 1. Lock and fetch work order
  SELECT * INTO v_wo
  FROM work_orders
  WHERE id = p_work_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  -- 2. Validate status = COMPLETED
  IF v_wo.status != 'COMPLETED' THEN
    RAISE EXCEPTION 'Work order must be in COMPLETED status to close (current status: %)', v_wo.status;
  END IF;

  -- 3. Validate resolution notes
  IF p_resolution_notes IS NULL OR TRIM(p_resolution_notes) = '' THEN
    RAISE EXCEPTION 'Resolution notes are required to close the work order';
  END IF;

  -- 4. Validate and deduct inventory for each part with row-level locking
  IF p_actual_parts IS NOT NULL AND jsonb_array_length(p_actual_parts) > 0 THEN
    FOR v_part IN SELECT * FROM jsonb_to_recordset(p_actual_parts)
      AS (spare_part_id UUID, quantity_used INTEGER)
    LOOP
      IF v_part.quantity_used > 0 THEN
        -- Lock the spare part row and check availability
        SELECT * INTO v_part_record
        FROM spare_parts
        WHERE id = v_part.spare_part_id
        FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Spare part % not found', v_part.spare_part_id;
        END IF;

        IF v_part_record.quantity_in_stock < v_part.quantity_used THEN
          RAISE EXCEPTION 'Insufficient stock for part % (available: %, requested: %)',
            v_part_record.name, v_part_record.quantity_in_stock, v_part.quantity_used;
        END IF;

        -- Deduct inventory
        UPDATE spare_parts
        SET quantity_in_stock = quantity_in_stock - v_part.quantity_used,
            updated_at = NOW()
        WHERE id = v_part.spare_part_id;

        -- Update or insert work order parts usage
        UPDATE work_order_parts
        SET quantity_used = v_part.quantity_used,
            updated_at = NOW()
        WHERE work_order_id = p_work_order_id
          AND spare_part_id = v_part.spare_part_id;

        -- Append to summary text for history
        v_parts_used_summary := v_parts_used_summary || v_part_record.name || ' (Qty: ' || v_part.quantity_used || '); ';
      END IF;
    END LOOP;
  END IF;

  v_equipment_id := v_wo.equipment_id;
  v_alert_id := v_wo.alert_id;

  -- 5. Create maintenance history entry
  INSERT INTO maintenance_history (
    equipment_id,
    work_order_id,
    maintenance_type,
    issue_description,
    resolution,
    parts_used,
    performed_by,
    status,
    performed_at
  ) VALUES (
    v_equipment_id,
    p_work_order_id,
    'CORRECTIVE',
    v_wo.fault_description,
    p_resolution_notes,
    NULLIF(TRIM(v_parts_used_summary), ''),
    p_user_id,
    'COMPLETED',
    NOW()
  );

  -- 6. Update equipment last_service_date
  UPDATE equipment
  SET last_service_date = NOW(),
      updated_at = NOW()
  WHERE id = v_equipment_id;

  -- 7. Resolve linked alert (if exists)
  IF v_alert_id IS NOT NULL THEN
    UPDATE maintenance_alerts
    SET status = 'RESOLVED',
        updated_at = NOW()
    WHERE id = v_alert_id;
  END IF;

  -- 8. Re-evaluate equipment status based on remaining alerts
  v_new_status := evaluate_equipment_status(v_equipment_id);

  -- 9. Close work order
  UPDATE work_orders
  SET status = 'CLOSED',
      resolution_notes = p_resolution_notes,
      closed_at = NOW(),
      closed_by = p_user_id,
      updated_at = NOW()
  WHERE id = p_work_order_id;

  -- 10. Write audit log entry
  INSERT INTO audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values
  ) VALUES (
    p_user_id,
    'WORK_ORDER',
    p_work_order_id,
    'CLOSE',
    jsonb_build_object('status', v_wo.status),
    jsonb_build_object(
      'status', 'CLOSED',
      'resolution_notes', p_resolution_notes,
      'equipment_new_status', v_new_status,
      'resolved_alert_id', v_alert_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'work_order_id', p_work_order_id,
    'equipment_status', v_new_status,
    'alert_resolved', v_alert_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------
-- 00013_create_views.sql
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- SEED DATA (Demo Equipment, Parameters, Spare Parts, Sample Alert)
-- ----------------------------------------------------------------
-- supabase/seed/seed.sql
-- Demo Seed Data for Manufacturing Plants

-- 1. Ensure Roles Exist
INSERT INTO roles (name, description) VALUES
  ('MAINTENANCE_ENGINEER', 'Can view, create readings, acknowledge alerts, create/manage work orders and spare parts'),
  ('PLANT_MANAGER', 'Read-only access to all modules, reports, and dashboards')
ON CONFLICT (name) DO NOTHING;

-- 2. Equipment Types
INSERT INTO equipment_types (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111101', 'CNC Milling Centers', 'Precision multi-axis CNC machines for metal fabrication'),
  ('11111111-1111-1111-1111-111111111102', 'Hydraulic Presses', 'High tonnage stamping and forming presses'),
  ('11111111-1111-1111-1111-111111111103', 'Industrial Air Compressors', 'Screw compressors for plant pneumatic lines'),
  ('11111111-1111-1111-1111-111111111104', 'Automated Conveyors', 'Belt and roller conveyors across assembly lines')
ON CONFLICT (id) DO NOTHING;

-- 3. Spare Parts Catalog
INSERT INTO spare_parts (id, part_number, name, description, quantity_in_stock, minimum_stock_level, unit, storage_location) VALUES
  ('22222222-2222-2222-2222-222222222201', 'BRG-6205-2RS', 'Deep Groove Ball Bearing 6205', 'Sealed spindle bearing for CNC axes', 24, 10, 'PCS', 'Bin A-14'),
  ('22222222-2222-2222-2222-222222222202', 'SEAL-HYD-50', 'Hydraulic Cylinder Seal Kit 50mm', 'High pressure polyurethane seal set', 15, 5, 'SET', 'Bin B-03'),
  ('22222222-2222-2222-2222-222222222203', 'LUB-GRS-EP2', 'High-Temp EP2 Lithium Grease', '400g cartridge for high load bearings', 40, 12, 'CART', 'Cabinet C-1'),
  ('22222222-2222-2222-2222-222222222204', 'VLV-SOL-24V', '24V DC Directional Solenoid Valve', 'Pneumatic manifold pilot valve', 8, 4, 'PCS', 'Bin D-08'),
  ('22222222-2222-2222-2222-222222222205', 'FLT-CLNT-10U', 'Coolant Cartridge Filter 10 Micron', 'Spin-on filter for cutting fluid circulation', 18, 6, 'PCS', 'Bin A-22'),
  ('22222222-2222-2222-2222-222222222206', 'OIL-ISO-VG68', 'Industrial Hydraulic Fluid ISO VG 68', '20-liter drum hydraulic fluid', 6, 3, 'DRUM', 'Warehouse Bay 4')
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Equipment
INSERT INTO equipment (id, equipment_id, name, location, type_id, criticality, status, last_service_date) VALUES
  ('33333333-3333-3333-3333-333333333301', 'CNC-01', 'Haas VF-4 Spindle Center', 'Bay 1 - Machining Wing', '11111111-1111-1111-1111-111111111101', 'CRITICAL', 'HEALTHY', NOW() - INTERVAL '14 days'),
  ('33333333-3333-3333-3333-333333333302', 'CNC-02', 'Mazak VTC-800 Vertical Machining', 'Bay 1 - Machining Wing', '11111111-1111-1111-1111-111111111101', 'HIGH', 'HEALTHY', NOW() - INTERVAL '30 days'),
  ('33333333-3333-3333-3333-333333333303', 'PRESS-A1', 'Schuler 400T Hydraulic Stamping Press', 'Bay 2 - Stamping Hall', '11111111-1111-1111-1111-111111111102', 'CRITICAL', 'AT_RISK', NOW() - INTERVAL '45 days'),
  ('33333333-3333-3333-3333-333333333304', 'COMP-01', 'Atlas Copco GA75 VSD+ Screw Compressor', 'Utility Plant House', '11111111-1111-1111-1111-111111111103', 'CRITICAL', 'HEALTHY', NOW() - INTERVAL '7 days'),
  ('33333333-3333-3333-3333-333333333305', 'CONV-MAIN', 'Packaging Line Overhaul Conveyor', 'Bay 3 - Packaging Line', '11111111-1111-1111-1111-111111111104', 'MEDIUM', 'HEALTHY', NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Equipment Parameters
INSERT INTO equipment_parameters (id, equipment_id, name, unit, threshold_value, direction, service_interval, is_active) VALUES
  -- CNC-01
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'Spindle Temperature', '°C', 75.0, 'UPPER', 500, true),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'Spindle Vibration', 'mm/s', 6.0, 'UPPER', 500, true),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'Coolant Pressure', 'bar', 15.0, 'LOWER', 250, true),

  -- CNC-02
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333302', 'Bearing Vibration', 'mm/s', 6.5, 'UPPER', 500, true),
  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', 'Axis Motor Temp', '°C', 80.0, 'UPPER', 500, true),

  -- PRESS-A1
  ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333303', 'Hydraulic Oil Temperature', '°C', 65.0, 'UPPER', 350, true),
  ('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333303', 'System Oil Pressure', 'bar', 180.0, 'LOWER', 350, true),

  -- COMP-01
  ('44444444-4444-4444-4444-444444444408', '33333333-3333-3333-3333-333333333304', 'Discharge Temperature', '°C', 95.0, 'UPPER', 1000, true),
  ('44444444-4444-4444-4444-444444444409', '33333333-3333-3333-3333-333333333304', 'Outlet Air Pressure', 'bar', 7.0, 'LOWER', 500, true),

  -- CONV-MAIN
  ('44444444-4444-4444-4444-444444444410', '33333333-3333-3333-3333-333333333305', 'Motor Drive Current', 'A', 22.0, 'UPPER', 400, true)
ON CONFLICT (id) DO NOTHING;

-- 6. Sample Parameter Readings (Normal & Some Breaches)
INSERT INTO parameter_readings (id, parameter_id, equipment_id, value, unit, notes, recorded_at) VALUES
  ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 62.4, '°C', 'Normal operating shift reading', NOW() - INTERVAL '3 hours'),
  ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 4.1, 'mm/s', 'Baseline vibration within spec', NOW() - INTERVAL '3 hours'),
  ('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333303', 74.0, '°C', 'High thermal load noticed on hydraulic manifold', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- 7. Sample Threshold Breach and Alert for PRESS-A1 (Temperature 74°C > 65°C threshold: breach % = (74-65)/65 * 100 = 13.85% -> HIGH priority)
INSERT INTO threshold_breaches (id, equipment_id, parameter_id, reading_id, current_value, threshold_value, breach_percentage, breached_at) VALUES
  ('66666666-6666-6666-6666-666666666601', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444406', '55555555-5555-5555-5555-555555555503', 74.0, 65.0, 13.85, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO maintenance_alerts (id, alert_id, equipment_id, breach_id, parameter_id, current_value, threshold_value, breach_percentage, priority, status, suggested_action, created_at) VALUES
  ('77777777-7777-7777-7777-777777777701', 'ALT-2026-00001', '33333333-3333-3333-3333-333333333303', '66666666-6666-6666-6666-666666666601', '44444444-4444-4444-4444-444444444406', 74.0, 65.0, 13.85, 'HIGH', 'OPEN', 'Inspect hydraulic oil cooling circuit and heat exchanger. Check for filter clogging.', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;
