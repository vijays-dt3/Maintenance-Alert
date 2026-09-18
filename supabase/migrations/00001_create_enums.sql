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
