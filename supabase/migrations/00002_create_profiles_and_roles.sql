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
