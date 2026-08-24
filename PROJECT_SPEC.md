# Project Specification: Last-Mile Delivery Tracker

## 1. Executive Summary & Problem Statement

### 1.1 Executive Summary
The **Last-Mile Delivery Tracker** is a full-stack logistics management platform engineered to automate package pricing, dynamic agent dispatch, transparent end-to-end shipment tracking, and failure recovery. It provides specialized portals for **Customers**, **Delivery Agents**, and **Platform Admins**, backed by a relational data model with zero hardcoding of pricing or operational boundaries.

### 1.2 Problem Statement
Modern logistics operations encounter friction across four critical operational pillars:
1. **Complex, Rigid Pricing**: Manual rate calculations struggle with volumetric vs. actual weight trade-offs, dynamic zone boundaries, customer-type pricing tiers (B2B vs. B2C), and Cash-on-Delivery (COD) risk management.
2. **Inefficient Dispatching**: Static dispatch often results in overloaded couriers, high transit delays, and unassigned bottlenecks without visibility.
3. **Tracking Gaps & Customer Anxiety**: Inconsistent status updates and opaque delivery timelines lead to increased customer support volume.
4. **Fragile Failure Handling**: Unsuccessful delivery attempts (e.g., recipient unavailable) lack a structured self-service reschedule loop, leading to lost shipments and untracked returns.

The Last-Mile Delivery Tracker solves these challenges with a deterministic, configurable engine.

---

## 2. Stakeholders & User Personas

| Role | Target Persona | Key Responsibilities & Capabilities |
|---|---|---|
| **Customer** | E-commerce buyers, retail consumers, B2B shippers | <ul><li>Register and authenticate.</li><li>Request real-time, itemized shipping quotes before booking.</li><li>Create delivery orders and lock in quoted rates.</li><li>Track live progress across an immutable visual timeline.</li><li>Reschedule delivery dates if a delivery attempt fails.</li></ul> |
| **Delivery Agent** | Field couriers, logistics drivers | <ul><li>Log in via admin-provisioned credentials.</li><li>View assigned delivery runs filtered to their operating zone.</li><li>Advance delivery statuses sequentially (*Picked Up* $\rightarrow$ *In Transit* $\rightarrow$ *Out for Delivery* $\rightarrow$ *Delivered* / *Failed*).</li><li>Toggle on-duty availability status.</li></ul> |
| **Platform Admin** | Logistics coordinators, dispatch supervisors, pricing managers | <ul><li>Configure operational zones and pincode-to-zone mappings.</li><li>Manage dynamic B2B/B2C and Intra/Inter-zone Rate Cards and COD surcharges.</li><li>Create orders on behalf of offline customers.</li><li>Monitor fleet capacity, active workloads, and unassigned order alerts.</li><li>Trigger automated load-balanced dispatch or manually assign agents.</li><li>Execute administrative status overrides with mandatory audit logging.</li></ul> |

---

## 3. Scope of Work & Functional Requirements

### 3.1 Rate Calculation & Pre-Order Estimation
- **Inputs**: Package length, breadth, height (cm), actual weight (kg), pickup pincode, drop pincode, order type (`B2B` or `B2C`), payment type (`PREPAID` or `COD`).
- **Zone Resolution**: Automatic mapping of origin and destination pincodes to operational zones via `PincodeZoneMap` to determine movement classification (`INTRA` vs. `INTER`).
- **Volumetric Arithmetic**: Calculation using industry standard divisor $\frac{L \times B \times H}{5000}$.
- **Chargeable Weight**: Selection of $\max(\text{Actual Weight}, \text{Volumetric Weight})$.
- **Freight & Surcharge Computation**: Dynamic lookup of base fee, per-kg rate, and COD flat/percentage surcharge from database tables.
- **Pre-Persistence Quote**: Returns an itemized financial snapshot displayed to the user before an order record is persisted in the database.

### 3.2 Order Booking & Persistence
- Customers (or admins on behalf of customers) confirm orders with verified pickup/drop addresses and scheduled delivery dates.
- Atomic creation of the `Order` record, snapshotting the exact pricing breakdown to prevent historical distortions if rate cards change later.
- Automatic creation of the initial `CREATED` record in `OrderStatusHistory`.

### 3.3 Dynamic Agent Assignment
- **Automated Dispatch**:
  - Filter candidate agents operating in the pickup zone with `isAvailable = true`.
  - Enforce capacity limit: $\text{active orders} < \text{maxActiveOrders}$.
  - Select candidate with the fewest active orders (load balancing).
- **Manual Dispatch**: Admins can select any eligible agent in the pickup zone.
- **Unassigned Alerting**: Orders with no eligible agents transition to `UNASSIGNED` and appear in the admin's bottleneck dashboard.

### 3.4 Order Lifecycle & State Machine
- Sequential, guarded status progression: `ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` (Terminal) or `FAILED`.
- Elimination of illegal jumps (e.g., `DELIVERED` $\rightarrow$ `PICKED_UP`).
- Admin override capability for non-terminal states with mandatory actor tagging and justification notes.

### 3.5 Failure Recovery & Reschedule Workflow
- Flagging an order as `FAILED` triggers an automated email notification to the customer containing a self-service reschedule link.
- Customer submits a new target delivery date and reason.
- System updates status to `RESCHEDULED`, preserving all prior attempt logs, and automatically re-queues the order for agent assignment.

### 3.6 Immutable Audit Trail & Notifications
- `OrderStatusHistory` is strictly append-only; records are never updated or deleted.
- `NotificationService` sends email updates on every status transition, logged in `NotificationLog`.

---

## 4. Non-Functional Requirements (NFRs)

| Requirement | Specification & Architecture Standard |
|---|---|
| **Performance** | Rate engine quote calculation latency $< 20\text{ms}$ (pure in-memory arithmetic with indexed database lookups). |
| **Security & RBAC** | Stateless JWT authentication, role guards (`requireRole`), password hashing with `bcryptjs` (salt rounds $\ge 10$), and strict resource ownership checks (`canAccessOrder`) preventing horizontal privilege escalation. |
| **Auditability** | 100% immutable transition history tracking `order_id`, `from_status`, `to_status`, `actor_id`, `actor_role`, and `timestamp`. |
| **Decoupling** | Pure domain service layer (`rateEngine`, `assignmentService`, `orderStatusService`, `notificationService`) isolated from Express HTTP controllers to enable zero-mock unit testing. |
| **Reliability** | Asynchronous notification processing ensuring third-party email failures do not roll back database transactions. |

---

## 5. Assumptions & Deliberate Simplifications

1. **Zone Detection**: Implemented via relational `PincodeZoneMap` lookups rather than paid third-party geocoding APIs. This provides deterministic, zero-cost zone matching.
2. **Volumetric Divisor**: Fixed constant of `5000` ($\text{cm}^3/\text{kg}$) per freight industry standard. All monetary rates remain 100% database-driven.
3. **Agent Provisioning**: Agents and Admins are created via admin interfaces or seed scripts (no public self-registration for privileged roles).
