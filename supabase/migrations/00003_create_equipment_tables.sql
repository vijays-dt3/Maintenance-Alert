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
