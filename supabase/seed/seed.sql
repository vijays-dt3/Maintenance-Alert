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
