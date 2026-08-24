# System Architecture: Last-Mile Delivery Tracker

## 1. High-Level System Architecture

The **Last-Mile Delivery Tracker** is designed with a decoupled 3-tier architecture that separates presentation, API routing, business domain logic, and data persistence:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  PRESENTATION LAYER                                     │
│                                 (React + Vite + Tailwind)                               │
│  ┌───────────────────────────┐ ┌───────────────────────────┐ ┌────────────────────────┐  │
│  │      Customer Portal      │ │    Delivery Agent Portal  │ │     Admin Dashboard    │  │
│  │ - Rate Quote Estimator    │ │ - Assigned Run-sheet      │ │ - Zone & Pincode CRUD  │  │
│  │ - Order Booking Form      │ │ - 1-Tap Status Updates    │ │ - Rate Card & COD Rules│  │
│  │ - Visual Tracking Timeline│ │ - Availability Toggle     │ │ - Dispatch & Overrides │  │
│  │ - Reschedule Form         │ │                           │ │ - Unassigned Alerts    │  │
│  └───────────────────────────┘ └───────────────────────────┘ └────────────────────────┘  │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │ HTTPS (REST API + JWT Bearer Auth)
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 API ROUTING & SECURITY                                  │
│                                (Node.js + Express + TypeScript)                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Middleware Pipeline:                                                             │  │
│  │  1. CORS & JSON Body Parser (Express)                                             │  │
│  │  2. JWT Token Verification (requireAuth)                                          │  │
│  │  3. Role-Based Access Control (requireRole('CUSTOMER' | 'AGENT' | 'ADMIN'))       │  │
│  │  4. Resource Ownership Verification (canAccessOrder - IDOR Guard)                 │  │
│  │  5. Request Schema Validation (Zod DTOs)                                          │  │
│  └─────────────────────────────────────────┬─────────────────────────────────────────┘  │
│                                            │
│                                            ▼
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Thin HTTP Controllers (Routes):                                                  │  │
│  │  /api/auth  •  /api/users  •  /api/zones  •  /api/pincodes  •  /api/rate-cards    │  │
│  │  /api/cod-config  •  /api/orders  •  /api/orders/:id/assign                       │  │
│  └─────────────────────────────────────────┬─────────────────────────────────────────┘  │
└────────────────────────────────────────────┼────────────────────────────────────────────┘
                                             │ Pure Domain Calls
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DOMAIN SERVICE LAYER                                    │
│                              (Isolated, Testable Modules)                               │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────────────┐  │
│  │   RateEngine.ts       │ │ AssignmentService.ts  │ │   OrderStatusService.ts       │  │
│  │ - Pincode Zone Match  │ │ - Zone Agent Query    │ │ - State Machine Transition    │  │
│  │ - Volumetric Divisor  │ │ - Capacity Filter     │ │ - Invariant Validation        │  │
│  │ - Chargeable Weight   │ │ - Fewest-Jobs Select  │ │ - Append-Only History Writer  │  │
│  │ - COD Surcharge Math  │ │ - Unassigned Fallback │ │ - Admin Override Logger       │  │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┬───────────────┘  │
│                                                                      │ (Async Event)    │
│                                                                      ▼                  │
│                                                      ┌───────────────────────────────┐  │
│                                                      │    NotificationService.ts     │  │
│                                                      │ - Nodemailer SMTP Dispatcher  │  │
│                                                      │ - NotificationLog Persistence │  │
│                                                      └───────────────────────────────┘  │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │ Prisma Client
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DATA PERSISTENCE LAYER                                  │
│                                  (PostgreSQL Relational DB)                             │
│  - users                    - agent_profiles        - zones                             │
│  - pincode_zone_maps        - rate_cards            - cod_configs                       │
│  - orders                   - order_status_histories- reschedule_requests               │
│  - notification_logs                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Anti-Controller Bloat & Pure Service Isolation
Placing business logic inside Express route handlers causes severe testing friction and violation of the Single Responsibility Principle. In this architecture:
- **Controllers** act strictly as thin adapters: parsing inputs, validating DTO schemas with Zod, delegating to domain services, and returning structured HTTP responses.
- **Domain Services** own 100% of the mathematical algorithms and state invariants, allowing pure unit testing via Vitest without needing to mock HTTP requests or headers.

### 2.2 Relational Data Integrity
PostgreSQL enforces foreign keys, unique constraints, and transaction atomicity across complex multi-entity workflows (e.g., creating an order + appending the initial `OrderStatusHistory` record in an atomic transaction).

### 2.3 Asynchronous Notification Decoupling
The `NotificationService` is decoupled from the primary HTTP transaction. Outbound email dispatches occur asynchronously so that network latency or SMTP downtime never delays or rolls back critical database state transitions.

---

## 3. Subsystem Breakdown

### 3.1 Rate Calculation Engine (`backend/src/services/rateEngine.ts`)
- Computes volumetric weight from dimensions ($L \times B \times H / 5000$).
- Resolves chargeable weight as $\max(\text{actual}, \text{volumetric})$.
- Matches `RateCard` by `orderType` and `zoneType` (`INTRA` vs `INTER`).
- Calculates base freight and applies COD flat/percent surcharges.
- Returns a complete, itemized calculation breakdown object.

### 3.2 Dynamic Assignment Engine (`backend/src/services/assignmentService.ts`)
- Queries active agents filtered by `currentZoneId == order.pickupZoneId` and `isAvailable == true`.
- Evaluates agent load: counts orders in active statuses (`ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`).
- Filters out saturated agents (`activeCount >= maxActiveOrders`).
- Assigns the order to the agent with the lowest active load; if none are available, transitions the order to `UNASSIGNED` and logs an alert.

### 3.3 State Machine & Order Lifecycle Engine (`backend/src/services/orderStatusService.ts`)
- Enforces strict transition matrix for agents:
  $$\text{ASSIGNED} \rightarrow \text{PICKED\_UP} \rightarrow \text{IN\_TRANSIT} \rightarrow \text{OUT\_FOR\_DELIVERY} \rightarrow \text{DELIVERED} \mid \text{FAILED}$$
- Rejects illegal state jumps (e.g., `DELIVERED` $\rightarrow$ `PICKED_UP`).
- Appends immutable tracking logs to `OrderStatusHistory` with `actorId` and optional note.
- Permits administrative override while logging `actorRole = ADMIN`.

### 3.4 Notification Subsystem (`backend/src/services/notificationService.ts`)
- Abstracted notification interface utilizing Nodemailer.
- Can be swapped to any SMTP provider (Mailtrap, Gmail, Resend) using environment variables.
- Records all delivery attempts, status (`SENT` or `FAILED`), and error details in `NotificationLog`.

---

## 4. Security Architecture & RBAC

```text
[ Incoming Request ]
        │
        ▼
[ Authentication Middleware (requireAuth) ]
  - Extracts Bearer JWT from Authorization header
  - Verifies token signature & expiration
  - Attaches decoded payload { id, role, email, name } to req.user
        │
        ▼
[ Role Guard Middleware (requireRole('ADMIN' | 'AGENT' | 'CUSTOMER')) ]
  - Checks if req.user.role is authorized for the endpoint
  - Returns 403 Forbidden on role mismatch
        │
        ▼
[ Resource Ownership Check (canAccessOrder) ]
  - For Order Detail / Status routes:
    * ADMIN: Unrestricted access.
    * AGENT: Allowed only if order.assignedAgentId === req.user.id.
    * CUSTOMER: Allowed only if order.customerId === req.user.id.
  - Returns 404 Not Found on unauthorized access to prevent IDOR leaks.
        │
        ▼
[ Route Handler / Domain Controller ]
```

---

## 5. Deployment Architecture

| Tier | Platform Target | Configuration & Strategy |
|---|---|---|
| **Frontend** | **Vercel** | Static Single-Page Application (Vite build) deployed on global edge CDN with continuous deployment from git repository. |
| **Backend API** | **Render / Railway** | Containerized Node.js service running Express with automated health checks (`/health`), CORS configuration, and environment secret injection. |
| **Database** | **Render / Railway PostgreSQL** | Managed PostgreSQL 16 instance with automated connection pooling and Prisma migration deployment on build. |
