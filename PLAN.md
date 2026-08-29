# Last-Mile Delivery Tracker — PLAN.md (Phase 0)

This document is the architecture source of truth. Pricing lives in PostgreSQL (admin-configured). Application code never hardcodes zone names, rupee rates, or COD surcharges.

---

## 1. Product (plain language)

Three roles share one platform:

| Role | What they do |
|---|---|
| **Customer** | Registers, gets a live quote, confirms an order, tracks a timeline, reschedules after a failed attempt. |
| **Delivery agent** | Logs in (admin-created account), sees assigned jobs, advances status with one tap. |
| **Admin** | Owns zones, pincode maps, rate cards, and COD rules; assigns agents; overrides status; sees unassigned orders. |

No order row exists until the customer (or admin on their behalf) has seen and confirmed the quoted price.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| API | Node.js + Express + TypeScript | Easy to follow; isolated service files instead of NestJS modules. |
| Database | PostgreSQL | Relational fit for zones, rate cards, FKs, audit tables. |
| ORM | Prisma | Typed schema, migrations, seed. |
| UI | React + Vite + TailwindCSS | One SPA with role-based portals. |
| Auth | JWT + role middleware + ownership checks | Role is not enough: customers cannot open another customer’s order by ID. |
| Email | Nodemailer behind `NotificationService` | Swap Mailtrap / Resend / Gmail without touching order logic. |
| Rate-engine tests | Vitest | Pure functions, no HTTP. |

**Assumptions (flagged, not silent):**

- Zone detection is **pincode → `PincodeZoneMap`**, not a paid geocoding API.
- Auto-assignment is **pickup zone + availability + fewest active orders**, not live GPS/Haversine. `currentLat` / `currentLng` exist on `AgentProfile` for a later nearest-agent upgrade.
- Volumetric divisor **5000** is the only formula constant (industry standard cm³→kg). Prices are never constants.
- Leaflet maps are **not** in v1.
- Agents and admins do **not** self-register; they are seeded or created by an admin.

---

## 3. Architecture

```text
  ┌─────────────────────────────────────────────────────────────┐
  │  React + Vite (Customer / Agent / Admin portals)            │
  │  JWT in localStorage → Authorization: Bearer …              │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ HTTPS JSON
  ┌──────────────────────────────▼──────────────────────────────┐
  │  Express routers                                            │
  │    requireAuth → requireRole → ownership (order ID)         │
  │                                                             │
  │  Isolated services (never inlined in handlers):             │
  │    rateEngine.ts                                            │
  │    assignmentService.ts                                     │
  │    orderStatusService.ts  ──side effect──► notification     │
  │    notificationService.ts ──► SMTP + NotificationLog        │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ Prisma
  ┌──────────────────────────────▼──────────────────────────────┐
  │  PostgreSQL                                                 │
  │  User, AgentProfile, Zone, PincodeZoneMap, RateCard,        │
  │  CodConfig, Order, OrderStatusHistory, RescheduleRequest,   │
  │  NotificationLog                                            │
  └─────────────────────────────────────────────────────────────┘
```

Frontend never computes prices. It posts dimensions/addresses and displays the breakdown the API returns.

---

## 4. Deployment: why these apps

**Target: Render (API + Postgres) + Vercel (frontend).** Railway is the all-in-one alternative.

### Vercel (frontend)

- Fits a Vite SPA: build → static files on a CDN.
- Preview URLs per git push.
- Not a home for a long-running Express process or Postgres — that is why the API is elsewhere.

### Render (backend + database)

- Web service for Express (process, env vars, health checks).
- Managed PostgreSQL and a `DATABASE_URL` for Prisma.
- Free web services may sleep; document that for demos.

### Railway (optional)

- One vendor for API + Postgres + static frontend; faster for a class demo, weaker CDN story than Vercel.

Local email: Mailtrap or Ethereal. Production SMTP still only inside `NotificationService`.

---

## 5. Rate calculation (plain language)

1. **`detectZone(pincode)`** — lookup in `PincodeZoneMap`. Unknown pincode → error (admin must map it). No guessed zone.
2. **`calculateVolumetricWeight(L, B, H)`** — `(L × B × H) / 5000` (cm → kg).
3. **`getChargeableWeight(actual, volumetric)`** — `max(actual, volumetric)`.
4. **`lookupRate(orderType, pickupZone, dropZone)`** — INTRA if same zone else INTER. Prefer a zone-pair `RateCard`; else generic INTRA/INTER for that order type.
5. **`applyCODSurcharge(baseCharge, paymentType, orderType)`** — if COD, add `CodConfig` flat and/or percent of the pre-COD subtotal. Prepaid → 0.
6. **`calculateOrderCharge(...)`** — orchestrates all of the above and returns a **breakdown object** (not only a total).

**Charge formula (data from DB):**

`subtotal = baseFee + chargeableWeight × ratePerKg`  
`codSurcharge = (COD) ? surchargeFlat + subtotal × (surchargePercent / 100) : 0`  
`total = subtotal + codSurcharge`

**Worked example** (seed numbers, not code constants): 20×15×10 cm, actual 0.4 kg, B2C, COD, same zone.

| Step | Result |
|---|---|
| Volumetric | 20×15×10 / 5000 = **0.6 kg** |
| Chargeable | max(0.4, 0.6) = **0.6 kg** |
| Intra B2C card | baseFee 50, ratePerKg 20 → 50 + 0.6×20 = **62** |
| COD 10 flat + 5% | 10 + 0.05×62 = **13.1** |
| Total | **75.1** |

Quote is calculated **before** persistence so no order exists until the customer confirms the price.

---

## 6. Zone detection vs auto-assignment

- **Pricing:** pincode map maintained by admin. Production upgrade: geocoding + polygon zones.
- **Agents:** `AgentProfile.currentZoneId` is their operating zone. Auto-assign: agents in the **pickup zone**, `isAvailable = true`, active order count `< maxActiveOrders`, pick the one with **fewest active orders**. If none: status **UNASSIGNED** and a visible admin alert — never silently stuck.
- **Active orders:** statuses `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`.

---

## 7. Why `Order.status` and `OrderStatusHistory` both exist

- **`Order.status`** — current cached state for list filters and dashboards.
- **`OrderStatusHistory`** — append-only source of truth / audit trail (who, when, note). App code never updates or deletes history rows. Failed attempts stay forever; a reschedule **appends** a new cycle.

---

## 8. Prisma schema draft

See `backend/prisma/schema.prisma` after Phase 1. Entities:

- **User** — name, email, passwordHash, role `CUSTOMER | AGENT | ADMIN`, phone
- **AgentProfile** (1:1 with User) — currentZoneId, optional lat/lng, isAvailable, maxActiveOrders
- **Zone** — name, code
- **PincodeZoneMap** — unique pincode → zone, optional areaName
- **RateCard** — orderType, zoneType INTRA/INTER, optional fromZoneId/toZoneId, baseFee, ratePerKg
- **CodConfig** — orderType, surchargeFlat, surchargePercent
- **Order** — addresses, pincodes, zones, dimensions, weights, types, calculatedCharge, quoteSnapshot JSON, status, assignedAgentId, scheduledDate
- **OrderStatusHistory** — append-only
- **RescheduleRequest**
- **NotificationLog** — channel EMAIL, sent status

**Status enum:** `CREATED` → `UNASSIGNED` | `ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED` | `FAILED`. After fail: `RESCHEDULED` then assignment again.

**Agent-valid transitions:**

```
ASSIGNED → PICKED_UP
PICKED_UP → IN_TRANSIT
IN_TRANSIT → OUT_FOR_DELIVERY
OUT_FOR_DELIVERY → DELIVERED | FAILED
```

Admin may override (still logged with actor = admin). Invalid jumps (e.g. DELIVERED → PICKED_UP) are rejected for agents.

---

## 9. API route map

| Group | Method | Path | Who |
|---|---|---|---|
| Auth | POST | `/api/auth/register` | Public (customer) |
| Auth | POST | `/api/auth/login` | Public |
| Auth | GET | `/api/auth/me` | Any logged-in |
| Users | POST | `/api/users/agents` | Admin (create agent) |
| Zones | CRUD | `/api/zones` | Admin write; authenticated read |
| Pincodes | CRUD | `/api/pincodes` | Admin write; authenticated read |
| Rate cards | CRUD | `/api/rate-cards` | Admin |
| COD | GET/PUT | `/api/cod-config` | Admin |
| Orders | POST | `/api/orders/quote` | Customer, Admin |
| Orders | POST | `/api/orders` | Customer, Admin (confirm) |
| Orders | GET | `/api/orders` | Scoped by role |
| Orders | GET | `/api/orders/:id` | Owner / assigned agent / admin |
| Orders | GET | `/api/orders/unassigned-alert` | Admin |
| Assign | POST | `/api/orders/:id/assign` | Admin |
| Assign | POST | `/api/orders/:id/auto-assign` | Admin |
| Status | PATCH | `/api/orders/:id/status` | Agent (own) / Admin |
| Reschedule | POST | `/api/orders/:id/reschedule` | Customer (FAILED only) |
| Notifications | GET | `/api/orders/:id/notifications` | Owner / admin |

---

## 10. Repo layout

```text
PLAN.md
SYSTEM_DESIGN.md
README.md
docker-compose.yml          # local Postgres
backend/                   # Express + Prisma
frontend/                   # Vite React
```

---

## 11. Phase order

0. This file  
1. Schema, migration, seed  
2. Auth + RBAC + ownership  
3. Admin config APIs  
4. Rate engine + tests + quote  
5. Order create (quote then persist)  
6. Assignment  
7. Status state machine  
8. Fail + reschedule  
9. Notifications as status side effect  
10. Frontend  
11. Docs + deploy notes  

---

## 12. Working rules

- Rate engine and assignment are isolated modules.
- Notifications fire from the status/reschedule service, not from scattered controllers.
- No hardcoded zone, rate, or surcharge values in application code (seed data is database data).
