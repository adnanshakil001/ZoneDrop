# AGENTS.md

## Project: Last-Mile Delivery Tracker

A full-stack, multi-tenant logistics management platform for Customers, Delivery Agents, and Platform Admins featuring dynamic pricing calculation, intelligent capacity-aware agent dispatch, real-time visual tracking, and failure recovery.

---

## Architecture

- **Stack**: Decoupled 3-Tier Web Architecture:
  - **Frontend**: React + Vite + TailwindCSS Single Page Application (SPA).
  - **Backend**: Node.js + Express (TypeScript) REST API.
  - **Database & ORM**: PostgreSQL 16 managed with Prisma ORM.
- **Layer Decoupling & Anti-Controller Bloat**:
  - **Controllers**: Thin HTTP adapters strictly responsible for request parsing, Zod DTO schema validation, delegating to domain services, and returning structured HTTP responses.
  - **Domain Services**: Pure, testable business logic modules (`rateEngine.ts`, `assignmentService.ts`, `orderStatusService.ts`, `notificationService.ts`) isolated from HTTP req/res objects.
- **Security & Authorization**:
  - Stateless JWT bearer authentication.
  - Centralized middleware: `requireAuth` $\rightarrow$ `requireRole('CUSTOMER' | 'AGENT' | 'ADMIN')`.
  - Resource Ownership Validation (`canAccessOrder`) preventing horizontal privilege escalation (IDOR).
- **Asynchronous Decoupling**:
  - `NotificationService` triggered as an asynchronous side effect of order status transitions, preventing third-party email failures from rolling back database transactions.

---

## Backend

- **Directory Layout**:
  ```text
  backend/
  ├── src/
  │   ├── config/             # Environment, constants
  │   ├── lib/prisma.ts       # Prisma Client singleton
  │   ├── middleware/auth.ts  # JWT verification, RBAC, ownership checks
  │   ├── routes/             # Thin route controllers (auth, users, zones, pincodes, rate-cards, cod-config, orders)
  │   └── services/           # Pure business logic:
  │       ├── rateEngine.ts        # Volumetric & freight calculations
  │       ├── assignmentService.ts # Agent discovery & load-balanced dispatch
  │       ├── orderStatusService.ts# State machine & append-only history logger
  │       └── notificationService.ts # Asynchronous email dispatcher
  ├── prisma/
  │   ├── schema.prisma       # Relational models & enums
  │   └── seed.ts             # Deterministic test data seed
  └── test/                   # Vitest unit test suites
  ```
- **Validation**: Strict schema validation on all inputs using Zod.
- **Testing**: Unit tests in Vitest for mathematical engines and state transitions.

---

## Database

- **Engine**: PostgreSQL 16 with Prisma ORM.
- **Core Relational Entities**:
  1. `User`: Central identity store (`CUSTOMER`, `AGENT`, `ADMIN`).
  2. `AgentProfile`: 1:1 extension of `User` with `currentZoneId`, `isAvailable`, and `maxActiveOrders`.
  3. `Zone`: Administrative delivery regions (`code`, `name`).
  4. `PincodeZoneMap`: Postal code mapping table enabling $O(1)$ zone resolution without paid geocoding APIs.
  5. `RateCard`: Configurable freight tariffs by `orderType` (`B2B`/`B2C`), `zoneType` (`INTRA`/`INTER`), and optional zone pairs.
  6. `CodConfig`: Configurable Cash-on-Delivery flat fees and percentage surcharges per order type.
  7. `Order`: Transactional order snapshot with package metrics, locked-in pricing snapshot, and operational status cache.
  8. `OrderStatusHistory`: Strictly append-only, immutable audit trail of every status transition.
  9. `RescheduleRequest`: Captures retry delivery dates and customer-provided failure reasons.
  10. `NotificationLog`: Audit trail of outbound customer notifications (`channel`, `status`, `error`).

---

## Important Business Rules

1. **Rate Calculation Engine**:
   - $\text{Volumetric Weight (kg)} = \frac{L \times B \times H}{5000}$ (dimensions in cm).
   - $\text{Chargeable Weight (kg)} = \max(\text{Actual Weight}, \text{Volumetric Weight})$.
   - $\text{Movement Type} = \text{INTRA}$ if $\text{pickupZoneId} == \text{dropZoneId}$, else $\text{INTER}$.
   - $\text{Base Freight} = \text{baseFee} + (\text{Chargeable Weight} \times \text{ratePerKg})$.
   - If `COD`: $\text{COD Surcharge} = \text{surchargeFlat} + \left(\text{Base Freight} \times \frac{\text{surchargePercent}}{100}\right)$. If `PREPAID`: Surcharge is strictly $0.00$.
   - Pre-order quote must be calculated and displayed to the customer before database persistence.
2. **Nearest Available Agent Auto-Assignment**:
   - Filter agents where `role === 'AGENT'`, `isAvailable === true`, `currentZoneId === order.pickupZoneId`, and $\text{active orders} < \text{maxActiveOrders}$.
   - Active orders include: `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`.
   - Dispatch to the eligible agent with the **fewest active orders** (load-balancing).
   - If zero agents are eligible, update status to `UNASSIGNED` and trigger an alert for Admin dispatch.
3. **Order Lifecycle & State Machine**:
   - Allowed agent sequence: $\text{ASSIGNED} \rightarrow \text{PICKED\_UP} \rightarrow \text{IN\_TRANSIT} \rightarrow \text{OUT\_FOR\_DELIVERY} \rightarrow \text{DELIVERED} \mid \text{FAILED}$.
   - `DELIVERED` is an immutable terminal state.
   - Rescheduling is only permitted from `FAILED` status (`FAILED` $\rightarrow$ `RESCHEDULED` $\rightarrow$ `ASSIGNED`).
   - Admin override is allowed for non-terminal states, strictly logging `actorRole = 'ADMIN'` with a mandatory reason note.

---

## Never:

- ❌ **Never hardcode rate cards, zone names, or COD surcharges** in application code — all pricing must be dynamically retrieved from the database.
- ❌ **Never bypass or overwrite status history** — `OrderStatusHistory` is strictly append-only; never update or delete history rows.
- ❌ **Never modify pricing or assignment logic without corresponding unit tests** in Vitest.
- ❌ **Never expose secrets, private keys, or plain-text passwords** — always use `bcryptjs` hashing and environment variables.
- ❌ **Never change the database schema without creating a proper Prisma migration / schema synchronization**.
- ❌ **Never place business logic directly in Express route controllers** — always encapsulate logic in domain services.

---

## Before Implementing Any Feature / Phase:

1. **Explain the Plan**: Summarize what will be built, why it is designed that way, and any trade-offs or assumptions.
2. **Identify Affected Files**: Explicitly list all new and modified files before writing code.
3. **Implement**: Write clean, modular, typed TypeScript code following the architecture standards.
4. **Run Tests**: Execute test suites (`npm run test`, `npx prisma validate`, typechecks) to verify correctness.
5. **Report Changes**: Provide a concise plain-language summary of what was accomplished and verified.
