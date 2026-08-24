# REST API Specification: Last-Mile Delivery Tracker

## 1. Global Conventions & Standards

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token in HTTP Header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Standard Error Response**:
  ```json
  {
    "error": "Descriptive error message or validation breakdown"
  }
  ```

---

## 2. Authentication & User Management

### 2.1 Customer Registration
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "password": "securePassword123",
    "phone": "+919876543210"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1f7a4e0-3912-4c22-b054-0e3b97b0a881",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "role": "CUSTOMER",
      "phone": "+919876543210"
    }
  }
  ```
- **Errors**: `400 Bad Request` (Validation error), `409 Conflict` (Email already registered).

### 2.2 User Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "ada@example.com",
    "password": "securePassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1f7a4e0-3912-4c22-b054-0e3b97b0a881",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "role": "CUSTOMER",
      "phone": "+919876543210"
    }
  }
  ```
- **Errors**: `401 Unauthorized` (Invalid credentials).

### 2.3 Get Current Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated
- **Response `200 OK`**:
  ```json
  {
    "id": "c1f7a4e0-3912-4c22-b054-0e3b97b0a881",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "CUSTOMER",
    "phone": "+919876543210",
    "agentProfile": null
  }
  ```

### 2.4 Toggle Agent Availability
- **Endpoint**: `PATCH /api/auth/availability`
- **Access**: `AGENT`
- **Request Body**:
  ```json
  {
    "isAvailable": true
  }
  ```
- **Response `200 OK`**: Updated `AgentProfile` record.

### 2.5 Provision Delivery Agent (Admin Only)
- **Endpoint**: `POST /api/users/agents`
- **Access**: `ADMIN`
- **Request Body**:
  ```json
  {
    "name": "Ravi Kumar",
    "email": "ravi.agent@lastmile.com",
    "password": "password123",
    "phone": "+919876500001",
    "currentZoneId": "8f3b2a1c-9901-4c11-9a22-3b4c5d6e7f80",
    "maxActiveOrders": 5,
    "isAvailable": true
  }
  ```
- **Response `201 Created`**: Returns created User with nested `AgentProfile`.

---

## 3. Zones & Pincode Mapping (Admin)

### 3.1 List All Zones
- **Endpoint**: `GET /api/zones`
- **Access**: Authenticated
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "8f3b2a1c-9901-4c11-9a22-3b4c5d6e7f80",
      "name": "North Zone",
      "code": "NORTH",
      "pincodes": [
        { "id": "p-1", "pincode": "110001", "areaName": "Connaught Place", "zoneId": "8f3b2a1c..." }
      ]
    }
  ]
  ```

### 3.2 Create Zone
- **Endpoint**: `POST /api/zones`
- **Access**: `ADMIN`
- **Request Body**: `{ "name": "East Zone", "code": "EAST" }`
- **Response `201 Created`**: Returns newly created Zone.

### 3.3 Map Pincode to Zone
- **Endpoint**: `POST /api/pincodes`
- **Access**: `ADMIN`
- **Request Body**:
  ```json
  {
    "pincode": "110021",
    "zoneId": "8f3b2a1c-9901-4c11-9a22-3b4c5d6e7f80",
    "areaName": "Chanakyapuri"
  }
  ```
- **Response `201 Created`**: Returns created `PincodeZoneMap` with zone relation.

---

## 4. Rate Cards & COD Surcharges (Admin)

### 4.1 List Rate Cards
- **Endpoint**: `GET /api/rate-cards`
- **Access**: `ADMIN`
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "rc-01",
      "orderType": "B2C",
      "zoneType": "INTRA",
      "fromZoneId": null,
      "toZoneId": null,
      "baseFee": "50.00",
      "ratePerKg": "20.00"
    }
  ]
  ```

### 4.2 Create Rate Card
- **Endpoint**: `POST /api/rate-cards`
- **Access**: `ADMIN`
- **Request Body**:
  ```json
  {
    "orderType": "B2C",
    "zoneType": "INTRA",
    "fromZoneId": null,
    "toZoneId": null,
    "baseFee": 50,
    "ratePerKg": 20
  }
  ```
- **Response `201 Created`**.

### 4.3 Configure COD Surcharge
- **Endpoint**: `PUT /api/cod-config/:orderType` (`B2B` or `B2C`)
- **Access**: `ADMIN`
- **Request Body**:
  ```json
  {
    "surchargeFlat": 10,
    "surchargePercent": 5
  }
  ```
- **Response `200 OK`**.

---

## 5. Orders & Rate Engine Quote

### 5.1 Pre-Order Itemized Quote Estimation
- **Endpoint**: `POST /api/orders/quote`
- **Access**: `CUSTOMER`, `ADMIN`
- **Request Body**:
  ```json
  {
    "pickupPincode": "110001",
    "dropPincode": "110021",
    "lengthCm": 20,
    "breadthCm": 15,
    "heightCm": 10,
    "actualWeight": 0.4,
    "orderType": "B2C",
    "paymentType": "COD"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "pickupPincode": "110001",
    "dropPincode": "110021",
    "pickupZone": { "id": "z-north", "name": "North Zone", "code": "NORTH" },
    "dropZone": { "id": "z-north", "name": "North Zone", "code": "NORTH" },
    "zoneType": "INTRA",
    "orderType": "B2C",
    "paymentType": "COD",
    "lengthCm": 20,
    "breadthCm": 15,
    "heightCm": 10,
    "actualWeight": 0.4,
    "volumetricWeight": 0.6,
    "chargeableWeight": 0.6,
    "volumetricDivisor": 5000,
    "rateCardId": "rc-01",
    "baseFee": 50,
    "ratePerKg": 20,
    "weightCharge": 12,
    "subtotal": 62,
    "codSurchargeFlat": 10,
    "codSurchargePercent": 5,
    "codSurcharge": 13.1,
    "total": 75.1
  }
  ```

### 5.2 Create and Confirm Order
- **Endpoint**: `POST /api/orders`
- **Access**: `CUSTOMER`, `ADMIN`
- **Request Body**:
  ```json
  {
    "pickupAddress": "Flat 4B, Barakhamba Road, CP",
    "dropAddress": "Plot 12, Diplomatic Enclave, Chanakyapuri",
    "pickupPincode": "110001",
    "dropPincode": "110021",
    "lengthCm": 20,
    "breadthCm": 15,
    "heightCm": 10,
    "actualWeight": 0.4,
    "orderType": "B2C",
    "paymentType": "COD",
    "scheduledDate": "2026-08-25T10:00:00.000Z",
    "autoAssign": true,
    "customerId": "c1f7a4e0-3912..." 
  }
  ```
  *(Note: `customerId` is only permitted when invoked by an `ADMIN` creating an order on behalf of a customer)*.
- **Response `201 Created`**: Returns full persisted Order with relations and initial status `ASSIGNED` or `UNASSIGNED`.

### 5.3 List Orders
- **Endpoint**: `GET /api/orders`
- **Access**: Scoped by Role
  - `ADMIN`: Returns all orders. Query filters: `?status=UNASSIGNED&zoneId=uuid&agentId=uuid`.
  - `AGENT`: Returns orders assigned to `req.user.id`.
  - `CUSTOMER`: Returns orders placed by `req.user.id`.
- **Response `200 OK`**: Array of Orders.

### 5.4 Get Order Details & Tracking Timeline
- **Endpoint**: `GET /api/orders/:id`
- **Access**: Owner (`CUSTOMER`), Assigned Agent (`AGENT`), or `ADMIN` (Guarded by `canAccessOrder`).
- **Response `200 OK`**: Full Order object including `statusHistory`, `reschedules`, `notifications`, and `assignedAgent`.

---

## 6. Dispatch & Agent Assignment (Admin)

### 6.1 List Eligible Agents for Order
- **Endpoint**: `GET /api/orders/:id/eligible-agents`
- **Access**: `ADMIN`
- **Response `200 OK`**: Array of agents operating in the order's pickup zone with current active order counts and capacity status.

### 6.2 Manual Agent Assignment
- **Endpoint**: `POST /api/orders/:id/assign`
- **Access**: `ADMIN`
- **Request Body**: `{ "agentId": "agent-uuid" }`
- **Response `200 OK`**: `{ "assigned": true, "agentId": "uuid", "agentName": "Ravi Kumar" }`

### 6.3 Trigger Auto-Assignment
- **Endpoint**: `POST /api/orders/:id/auto-assign`
- **Access**: `ADMIN`
- **Response `200 OK`**: Returns assignment result or unassigned alert status.

---

## 7. Status Lifecycle & Reschedule

### 7.1 Update Order Status
- **Endpoint**: `PATCH /api/orders/:id/status`
- **Access**: `AGENT` (assigned order only) or `ADMIN` (override)
- **Request Body**:
  ```json
  {
    "status": "PICKED_UP",
    "note": "Package received from sender"
  }
  ```
- **Allowed Statuses**: `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`.
- **Response `200 OK`**: Updated Order object.

### 7.2 Reschedule Failed Delivery
- **Endpoint**: `POST /api/orders/:id/reschedule`
- **Access**: Owner (`CUSTOMER`) or `ADMIN`
- **Prerequisite**: Order current status must be `FAILED`.
- **Validation**: `newDate` must be an ISO timestamp strictly in the future (`newDate > now()`). Historical dates return `400 Bad Request`.
- **Request Body**:
  ```json
  {
    "newDate": "2026-08-26T14:00:00.000Z",
    "reason": "Recipient was out of office on first attempt"
  }
  ```
- **Response `200 OK`**: Returns updated Order (status `RESCHEDULED`), newly logged `RescheduleRequest`, and triggered auto-assignment result.
- **Errors**: `400 Bad Request` (Order is not FAILED or newDate is in the past), `404 Not Found` (Order not found or unauthorized).

