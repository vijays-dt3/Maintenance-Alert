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
