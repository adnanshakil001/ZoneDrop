# ZoneDrop — Last-Mile Delivery Platform

**Live Frontend Demo:** [https://zone-drop.vercel.app/](https://zone-drop.vercel.app/)  
**Backend API:** [https://zonedrop-backend.onrender.com](https://zonedrop-backend.onrender.com)

A full-stack, multi-tenant logistics management and courier dispatch platform for **Customers**, **Delivery Agents**, and **Platform Admins**. Features dynamic volumetric pricing calculation, capacity-aware automated agent dispatch, interactive Leaflet OpenStreetMap location picking, real-time visual tracking, and failure recovery.

---

## Key Features & Highlights

### 1. Interactive Map & Dual Location Picker
- **OpenStreetMap (Leaflet) Integration:** Drop a pin directly on an interactive map or switch to manual address entry.
- **Reverse Geocoding:** Automatically resolves addresses and postal codes via OpenStreetMap Nominatim with an **800ms debounce** to prevent rate-limit violations.
- **Graceful Pincode Fallbacks:** Detects when geocoding returns an unmapped boundary and prompts the user for manual confirmation while preserving exact GPS coordinates (`lat`/`lng`).
- **Coordinate Persistence:** Stores pickup and drop-off coordinates in PostgreSQL for route mapping and courier navigation.

### 2. Multi-Provider Authentication (Google OAuth + Password)
- **Google OAuth via Clerk:** One-click signup and login with Google, featuring automatic Just-In-Time (JIT) user account provisioning in PostgreSQL.
- **Stateless JWT Auth:** Fast, stateless authentication with bcrypt password hashing for seeded and system accounts.
- **Session Auto-Redirects & Recovery:** Login and Register pages automatically route active sessions to appropriate role dashboards, with built-in 1-click account switching and session reset controls.
- **Role-Based Access Control (RBAC):** Strict authorization guards (`requireRole`, `canAccessOrder`) preventing horizontal privilege escalation (IDOR).

### 3. Dynamic Rate Calculation Engine
- **Volumetric Weight Calculation:** $\text{Volumetric Weight (kg)} = \frac{L \times B \times H}{5000}$ (dimensions in cm).
- **Chargeable Weight:** Evaluated dynamically as $\max(\text{Actual Weight}, \text{Volumetric Weight})$.
- **Zone Movement Tariffs:** Automatic tariff resolution for **INTRA-zone** (same zone) vs. **INTER-zone** (cross-zone) shipments with custom base fees and per-kg rates.
- **Cash-on-Delivery (COD) Surcharges:** Configurable flat fee plus percentage surcharges applied seamlessly.

### 4. Automated Intelligent Courier Dispatch
- **Capacity-Aware Dispatch:** Matches orders to couriers online in the pickup zone who have not reached their maximum active order limit (`maxActiveOrders`).
- **Load-Balancing Heuristic:** Automatically dispatches orders to eligible couriers with the fewest active deliveries.
- **Admin Manual Override:** Provides full operational visibility with manual reassignment and immutable rationale logging.

### 5. Real-Time Visual Tracking & Order Lifecycle
- **Dynamic 4-Stage Timeline:** Real-time state machine tracking (`CREATED/ASSIGNED` → `PICKED_UP/IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED` / `FAILED`).
- **Assigned Courier Display:** Displays courier details and real-time delivery status directly on the customer dashboard.
- **Reschedule & Failure Recovery:** Permitted strictly from `FAILED` status, capturing customer retry dates and failure reasons.
- **Append-Only Status History:** Strictly immutable audit log tracking every transition and actor.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite SPA                         │
│   (TailwindCSS, React-Leaflet, Clerk React, React Router)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API (CORS Enabled)
┌──────────────────────────────▼──────────────────────────────┐
│                  Node.js + Express REST API                 │
│  (TypeScript, Clerk Express, Zod Validation, Rate Limiter)  │
├─────────────────────────────────────────────────────────────┤
│  Domain Services:                                           │
│  • rateEngine.ts        • assignmentService.ts              │
│  • orderStatusService.ts • notificationService.ts           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM (Client Pooling)
┌──────────────────────────────▼──────────────────────────────┐
│                    PostgreSQL 16 Database                   │
│   (Users, Zones, Pincode Maps, Rate Cards, Orders, History) │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: `v18+` or `v20+`
- **Docker** (optional, for local database) or a **PostgreSQL** instance

### 2. Database Setup
Start a local PostgreSQL container using Docker Compose:
```bash
docker compose up -d
```
*Or use any PostgreSQL connection string (such as Neon or Supabase).*

### 3. Backend Setup
Navigate to `backend/` and install dependencies:
```bash
cd backend
npm install
```

Configure your `backend/.env` file:
```ini
DATABASE_URL="postgresql://lastmile:lastmile@localhost:5432/lastmile?schema=public"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:5173"
EMAIL_ENABLED="false"

# Clerk Auth Keys
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

Run database migrations and seed default data:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Start the backend API server:
```bash
npm run dev
```

### 4. Frontend Setup
In a separate terminal, navigate to `frontend/`:
```bash
cd frontend
npm install
```

Configure your `frontend/.env` file:
```ini
VITE_API_URL="http://localhost:4000"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

Start the frontend Vite dev server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Default Test Accounts

All pre-seeded test accounts use the password: **`password123`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Admin** | `admin@lastmile.com` | Operations dashboard, tariff/zone config, manual courier assignment |
| **Customer** | `customer@lastmile.com` | Book deliveries, map pin location picking, live order tracking |
| **Agent (North Zone)** | `agent.north@lastmile.com` | Duty status toggle, active delivery run-sheet, status updates |
| **Agent (South Zone)** | `agent.south@lastmile.com` | Duty status toggle, active delivery run-sheet, status updates |

*(You can also click **"Continue with Google"** on the login page to register directly as a new Customer).*

---

## Automated Test Suites

The project maintains comprehensive test coverage across mathematical engines, state transitions, authentication, and frontend map components.

### Run Backend Tests (Vitest)
```bash
cd backend
npm run test
```
*Executes 70 unit tests across rate calculation, courier assignment, status transitions, quote validation, and auth middleware.*

### Run Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend
npx vitest run
```
*Tests the `LocationPickerMap` component with Leaflet mocks, geocode debounce, and manual fallback assertions.*

---

## Deployment Configuration

### Frontend (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Environment Variables**:
  - `VITE_API_URL`: URL of your deployed backend (e.g. `https://zonedrop-backend.onrender.com`)
  - `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key (`pk_test_...`)

### Backend (Render / Railway)
- **Environment**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `node dist/index.js`
- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string (Neon / Supabase)
  - `JWT_SECRET`: Random secure string
  - `FRONTEND_URL`: URL of your frontend (e.g. `https://zone-drop.vercel.app`)
  - `CLERK_PUBLISHABLE_KEY`: Clerk publishable key
  - `CLERK_SECRET_KEY`: Clerk secret key
