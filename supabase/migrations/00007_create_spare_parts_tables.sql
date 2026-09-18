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
