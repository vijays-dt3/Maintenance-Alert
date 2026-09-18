# Predictive Maintenance Alert & Work Order System

A full-stack, enterprise-grade web application for manufacturing plants connecting:
```
Sensor / Manual Reading
        ↓
Parameter Analysis (UPPER / LOWER Explicit Logic)
        ↓
Threshold Breach Detection
        ↓
Maintenance Alert Queue (3-Tier Priority Waterfall)
        ↓
Work Order Management (Unidirectional Linkage)
        ↓
Spare Parts Reservation & Live Stock Check
        ↓
Maintenance Execution & Atomic Closure (PostgreSQL RPC)
        ↓
Equipment Health Re-evaluation & Service History
```

---

## Architecture Highlights (v2)
1. **Unidirectional Alert ↔ Work Order Relationship**:
   - `work_orders.alert_id → maintenance_alerts.id` with `UNIQUE` constraint (nullable).
   - Removed circular `maintenance_alerts.work_order_id` column.
2. **Atomic Work Order Closure**:
   - Executed via PostgreSQL RPC function `close_work_order_transaction()`.
   - Inventory deduction, equipment `last_service_date` update, alert resolution, maintenance history insertion, and audit logging succeed or roll back together.
3. **Inventory Concurrency Protection**:
   - Row-level locking (`SELECT ... FOR UPDATE`) prevents concurrent overselling.
   - Database constraint `CHECK (quantity_in_stock >= 0)`.
4. **Full Equipment Re-evaluation**:
   - `evaluate_equipment_status()` checks all active, unresolved alerts for the machine (CRITICAL if critical alert remains, AT_RISK if high/medium remain, HEALTHY if none).
5. **Pure Mathematical Threshold & Priority Algorithms**:
   - `ThresholdEvaluatorService`: Direction-specific formulas for `UPPER` and `LOWER`; equal-to-boundary is SAFE.
   - `PriorityCalculatorService`: 3-tier waterfall without overlapping rules.

---

## Tech Stack
- **Monorepo**: npm workspaces (`packages/*`, `apps/*`)
- **Backend**: Node.js, Express, TypeScript, Zod, Supabase JS Client
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, TanStack Query v5, Recharts, Lucide React
- **Database**: PostgreSQL (Supabase), Row Level Security (RLS), Functions & Triggers
- **Testing**: Vitest (58 passing unit tests)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```

### 3. Run Database Migrations
Apply SQL files in `supabase/migrations/` sequentially (00001 through 00013) to your Supabase project, followed by `supabase/seed/seed.sql`.

### 4. Run Locally
Run both backend and frontend concurrently:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

### 5. Run Unit Tests
```bash
npm run test:unit
```

---

## Demo Personas
The application includes a built-in instant **Persona Switcher** in the sidebar:
- **Alex Rivera (Maintenance Engineer)**: Full access to log readings, configure parameters, acknowledge alerts, issue work orders, and perform atomic closures.
- **Marcus Vance (Plant Manager)**: Supervisory oversight, read-only analytics, health distribution charts, and audit histories.

---

## 35-Step End-to-End Acceptance Test
1. Go to **Equipment** -> click **Register Equipment**.
2. Register `CNC-03` ("CNC Machine 03") with `HIGH` criticality.
3. Configure `Temperature` (UPPER, 80°C) and `Vibration` (UPPER, 7 mm/s).
4. Go to **Log Readings** -> select CNC Machine 03.
5. Record Temperature = `65°C` -> Green banner: Safe, machine remains `HEALTHY`.
6. Record Temperature = `95°C` -> Red banner: Breach detected (+18.75%), Alert generated (`HIGH` priority), Machine condition updates to `AT_RISK`.
7. Go to **Maintenance Alerts** -> Inspect alert.
8. Click **Acknowledge Alert** -> status transitions `OPEN → ACKNOWLEDGED`.
9. Click **Create Work Order** -> modal opens (alert remains `ACKNOWLEDGED`).
10. Submit Work Order -> WO created (`WO-YYYY-NNNNN`), alert status updates to `CONVERTED_TO_WORK_ORDER`.
11. In Work Order Detail, click **Add Spare Part** -> select `Deep Groove Ball Bearing 6205` (Qty: 1) -> verify availability is `IN_STOCK`.
12. Click **Start Work** -> status transitions to `IN_PROGRESS` (Machine marked `UNDER_MAINTENANCE`).
13. Click **Complete Work** -> status transitions to `COMPLETED`.
14. Click **Close Work Order (Atomic)** -> enter resolution notes and confirm parts used.
15. Submit closure -> Atomic RPC function runs: inventory deducted, last service date updated, alert marked `RESOLVED`, equipment re-evaluated to `HEALTHY`, service history recorded.
16. Open **Dashboard** & **Service History** -> verify all graphs, KPIs, and logs reflect the closure.
