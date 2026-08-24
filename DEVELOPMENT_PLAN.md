# Development & Execution Plan: Last-Mile Delivery Tracker

## 1. Phase-by-Phase Build Order & Checkpoints

```mermaid
graph TD
    P0[Phase 0: Architecture & Specs] --> P1[Phase 1: DB Schema & Migrations]
    P1 --> P2[Phase 2: Auth & RBAC Guards]
    P2 --> P3[Phase 3: Admin Zone & Rate Config]
    P3 --> P4[Phase 4: Isolated Rate Engine]
    P4 --> P5[Phase 5: Quote-First Order Flow]
    P5 --> P6[Phase 6: Dynamic Assignment Engine]
    P6 --> P7[Phase 7: Status State Machine]
    P7 --> P8[Phase 8: Failed Delivery Reschedule]
    P8 --> P9[Phase 9: Notification Subsystem]
    P9 --> P10[Phase 10: Frontend Portals]
    P10 --> P11[Phase 11: System Design & Deploy]
```

---

### Phase 0: Planning & Architecture
- **Objective**: Establish single source of truth for domain logic, schema, state machine, and API contracts.
- **Deliverables**: `AAPLAN.md`, `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API_SPEC.md`, `BUSINESS_RULES.md`, `DEVELOPMENT_PLAN.md`, `TEST_PLAN.md`.
- **Review Gate**: User review and approval before writing code.

---

### Phase 1: Database Schema & Core Models
- **Objective**: Provision PostgreSQL database, configure Prisma ORM schema, generate types, and execute deterministic seeding.
- **Deliverables**:
  - `backend/prisma/schema.prisma` covering all 10 models and enums.
  - `backend/prisma/seed.ts` seeding Admin, Customer, 2 Agents, 3 Zones, 6 Pincodes, 4 Rate Cards, and 2 COD Configs.
  - `docker-compose.yml` for local containerized PostgreSQL 16.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Initialized database tables with foreign key constraints, unique indices, and cascade rules.
  - *Why*: Relational schema ensures multi-zone lookups and append-only audit histories remain consistent without orphaned records.

---

### Phase 2: Authentication & Role-Based Access Control (RBAC)
- **Objective**: Implement secure authentication, JWT issuance, password hashing, and role middleware.
- **Deliverables**:
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
  - `backend/src/middleware/auth.ts`: `requireAuth`, `requireRole('ADMIN' | 'AGENT' | 'CUSTOMER')`, and `canAccessOrder` ownership checks.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Built stateless JWT auth with role guards and IDOR prevention.
  - *Why*: Ensures customers cannot view another customer's orders and agents can only access assigned shipments.

---

### Phase 3: Admin Configuration (Zones & Rate Cards)
- **Objective**: Admin CRUD APIs for operational zones, pincode mappings, rate cards, and COD surcharges.
- **Deliverables**:
  - `/api/zones` & `/api/pincodes` CRUD routes.
  - `/api/rate-cards` & `/api/cod-config` management routes.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Configured database-driven pricing and geographic zones.
  - *Why*: Eliminates hardcoded prices, making all rates and surcharges admin-adjustable at runtime.

---

### Phase 4: Pure Rate Calculation Engine
- **Objective**: Build pure, isolated mathematical engine for rate calculation and verify with unit tests.
- **Deliverables**:
  - `backend/src/services/rateEngine.ts` containing volumetric weight calculation, chargeable weight selection, rate card lookup, and COD surcharge calculation.
  - `backend/src/services/rateEngine.test.ts` with 100% Vitest coverage.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Implemented isolated pricing math with pure functions.
  - *Why*: Isolating calculations from HTTP controllers allows instant unit testing without mocking web servers.

---

### Phase 5: Quote-First Order Creation Flow
- **Objective**: Build pre-order pricing estimation and order booking flow.
- **Deliverables**:
  - `POST /api/orders/quote`: Returns itemized financial breakdown without writing to DB.
  - `POST /api/orders`: Locks in quoted price, creates order, and appends `CREATED` status history.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Separated price quoting from database persistence.
  - *Why*: Ensures no order is created until the customer reviews and confirms the itemized breakdown.

---

### Phase 6: Dynamic Agent Assignment Engine
- **Objective**: Automated and manual agent dispatch based on zone, capacity, and concurrency safety.
- **Deliverables**:
  - `backend/src/services/assignmentService.ts`: `autoAssignOrder` (wrapped in `prisma.$transaction` to prevent race condition over-allocations), `manualAssignOrder`, `listEligibleAgents`, `unassignedCount`.
  - `/api/orders/:id/auto-assign` & `/api/orders/:id/assign` endpoints.
  - `/api/orders/unassigned-alert` admin endpoint.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Built atomic load-balanced auto-assignment based on fewest active orders with unassigned alert fallback.
  - *Why*: Prevents courier overload, prevents concurrency race conditions, and guarantees unassigned orders are highlighted to dispatchers.

---

### Phase 7: Order Status Lifecycle & Immutable Tracking
- **Objective**: Implement sequential state machine transitions and append-only audit logging.
- **Deliverables**:
  - `backend/src/services/orderStatusService.ts`: `changeOrderStatus`, `assertAgentTransition`, `appendStatus`.
  - `PATCH /api/orders/:id/status` endpoint.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Guarded state transitions and separated `Order.status` from `OrderStatusHistory`.
  - *Why*: Prevents illegal status jumps and maintains a 100% immutable audit trail.

---

### Phase 8: Failed Delivery & Reschedule Flow
- **Objective**: Handle failed attempts, customer rescheduling with future date validation, and automated re-assignment.
- **Deliverables**:
  - `POST /api/orders/:id/reschedule` endpoint with strict temporal validation (`newDate > now()`).
  - `RescheduleRequest` table binding and transition to `RESCHEDULED`.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Built self-service reschedule loop for failed deliveries.
  - *Why*: Preserves previous failure logs while re-queuing the order for new dispatch.

---

### Phase 9: Decoupled Notification Subsystem
- **Objective**: Asynchronous email notifications on every status transition.
- **Deliverables**:
  - `backend/src/services/notificationService.ts`: `notifyStatusChange`, `sendOrderEmail`.
  - Logging to `NotificationLog`.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Abstracted email notifications behind an event listener.
  - *Why*: Prevents third-party SMTP latency or failures from interrupting database transactions.

---

### Phase 10: Unified React Frontend Portals
- **Objective**: Build responsive user portals for Customers, Delivery Agents, and Admins.
- **Deliverables**:
  - Customer Portal: Live quote preview with interactive breakdown, order creation, tracking timeline, and reschedule UI.
  - Agent Portal: Assigned orders run-sheet, 1-tap status updates, availability toggle.
  - Admin Portal: Zone/Pincode manager, Rate Card & COD editor, Dispatch table with auto-polling unassigned alert badge, status override.
- **Post-Phase Summary Checkpoint**:
  - *What happened*: Connected frontend SPA to backend APIs with live status badges and polling.
  - *Why*: Delivered an intuitive, role-scoped UI for all three personas.

---

### Phase 11: System Design Write-Up & Deployment
- **Objective**: Produce 800-word system design analysis, deployment documentation, and production deployment scripts.
- **Deliverables**:
  - `SYSTEM_DESIGN.md` (800 words max covering rate engine, zone detection, auto-assignment, failure recovery).
  - Production deployment configuration for Render / Railway and Vercel.

---

## 2. Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (for local PostgreSQL)

### Step 1: Start PostgreSQL
```powershell
docker-compose up -d
```

### Step 2: Configure & Seed Backend
```powershell
cd backend
npm install
npx prisma db push
npm run prisma:seed
```

### Step 3: Run Vitest Unit Tests
```powershell
npm run test
```

### Step 4: Start Backend API
```powershell
npm run dev
# Server running at http://localhost:5000
```

### Step 5: Start Frontend SPA
```powershell
cd ../frontend
npm install
npm run dev
# Frontend running at http://localhost:5173
```

---

## 3. Environment Variables Configuration

### Backend `.env`
```env
PORT=5000
DATABASE_URL="postgresql://lastmile:lastmile@localhost:5432/lastmile?schema=public"
JWT_SECRET="lastmile_super_secret_jwt_key_2026"
CORS_ORIGIN="http://localhost:5173"
EMAIL_ENABLED="false"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="mailtrap_user"
SMTP_PASS="mailtrap_pass"
SMTP_FROM="noreply@lastmile.local"
```

### Frontend `.env`
```env
VITE_API_URL="http://localhost:5000/api"
```
