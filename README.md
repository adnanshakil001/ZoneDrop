# Last-Mile Delivery Tracker

**Live Demo:** [https://zone-drop.vercel.app/](https://zone-drop.vercel.app/)

A full-stack, multi-tenant logistics management platform for Customers, Delivery Agents, and Platform Admins featuring dynamic pricing calculation, intelligent capacity-aware agent dispatch, real-time visual tracking, and failure recovery.

## System Architecture

- **Frontend**: React + Vite + TailwindCSS Single Page Application (SPA).
- **Backend**: Node.js + Express (TypeScript) REST API.
- **Database & ORM**: PostgreSQL 16 managed with Prisma ORM.

## Setup Guide

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (v16+)

### 2. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
npm install
```
Configure your environment variables (see `.env.example` section below).
Initialize the database:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
Start the development server:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables (`.env.example`)

**Backend (`backend/.env`):**
```ini
DATABASE_URL="postgresql://lastmile:lastmile@localhost:5432/lastmile?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:5173"
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Last Mile Tracker <noreply@lastmile.local>"
EMAIL_ENABLED="false"
```

**Frontend (`frontend/.env`):**
```ini
VITE_API_URL=http://localhost:4000/api
```

---

## Database Schema Highlights

The core relational entities are managed via Prisma (located in `backend/prisma/schema.prisma`):

1. **User**: Central identity store (`CUSTOMER`, `AGENT`, `ADMIN`).
2. **AgentProfile**: Extension of `User` with availability, active orders, and zone location.
3. **Zone & PincodeZoneMap**: Administrative delivery regions mapped to postal codes.
4. **RateCard & CodConfig**: Configurable freight tariffs and COD surcharges.
5. **Order**: Transactional snapshot with package metrics, calculated quotes, and statuses.
6. **OrderStatusHistory**: Strictly append-only, immutable audit trail of status transitions.
7. **RescheduleRequest**: Captures retry dates and failure reasons.

---

## Rate Calculation Logic

The pricing engine (`backend/src/services/rateEngine.ts`) dynamically calculates the pre-order quote based on volumetric and actual weight, zone distance, and payment type.

### 1. Volumetric vs Chargeable Weight
The physical dimensions of a package (Length × Breadth × Height in cm) are divided by a standard volumetric divisor (`5000`) to find the **Volumetric Weight**.
```typescript
Volumetric Weight (kg) = (L × B × H) / 5000
Chargeable Weight (kg) = max(Actual Weight, Volumetric Weight)
```

### 2. Zone Type (Movement Type)
The engine determines whether the shipment is moving within the same zone or across different zones:
- **INTRA**: Pickup Zone == Drop Zone
- **INTER**: Pickup Zone != Drop Zone

### 3. Base Freight Charge
Using the appropriate `RateCard` (filtered by `OrderType` [B2B/B2C] and `ZoneType` [INTRA/INTER]), the base freight is calculated:
```typescript
Base Freight = baseFee + (Chargeable Weight × ratePerKg)
```

### 4. Cash-on-Delivery (COD) Surcharge
If the user selects `COD` as the payment method, a configurable surcharge is applied on top of the base freight:
```typescript
COD Surcharge = surchargeFlat + (Base Freight × (surchargePercent / 100))
```
If the payment is `PREPAID`, this surcharge is strictly `0.00`.

### 5. Final Total
```typescript
Total = Base Freight + COD Surcharge
```

---

## API Documentation

For full API specifications, including authentication, zone mapping, order creation, and status lifecycles, please refer to the `API_SPEC.md` file in the root directory.
