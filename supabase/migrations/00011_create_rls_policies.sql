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
