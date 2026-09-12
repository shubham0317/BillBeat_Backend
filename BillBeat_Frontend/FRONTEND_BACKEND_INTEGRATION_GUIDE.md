# BillBeat Frontend and Backend Integration Guide

This document is the backend handoff for building the BillBeat frontend. It describes the available REST API, authentication model, data contracts, UI workflows, response formats, configuration, and current backend behavior.

The frontend should treat the backend as the source of truth. Do not infer unsupported operations or silently substitute client-side business rules.

## 1. Application Overview

BillBeat is a newspaper vendor management system. The backend supports:

- Vendor registration and login
- JWT-based authentication
- Newspaper catalog management
- Delivery beat management
- Paper boy management
- Customer management
- Newspaper subscriptions and weekly delivery schedules
- Daily delivery generation and status tracking
- Monthly bill generation
- Payment collection and bill balance updates
- WhatsApp bill notifications and delivery status tracking
- WhatsApp webhook integration

Backend base URL during local development:

```text
http://localhost:8080
```

All application endpoints use this prefix:

```text
/api/v1
```

Example API URL:

```text
http://localhost:8080/api/v1/customers
```

Swagger UI is available at:

```text
http://localhost:8080/swagger-ui.html
```

## 2. Authentication

### 2.1 Login

Endpoint:

```http
POST /api/v1/auth/login
Content-Type: application/json
```

Request:

```json
{
  "username": "vendor_username",
  "password": "password"
}
```

Validation:

- `username` is required and must not be blank.
- `password` is required and must not be blank.

Successful response data:

```json
{
  "token": "jwt-token",
  "tokenType": "Bearer",
  "userId": 1,
  "username": "vendor_username",
  "role": "VENDOR",
  "vendorId": 1,
  "businessName": "Example Newspapers",
  "paperBoyId": null
}
```

The frontend must send the token on protected requests:

```http
Authorization: Bearer <token>
```

JWT expiration is normally 24 hours. The frontend should clear the session and redirect to login when a protected request returns `401`.

### 2.2 Vendor registration

Endpoint:

```http
POST /api/v1/auth/register-vendor
Content-Type: application/json
```

Request:

```json
{
  "username": "vendor_username",
  "password": "password123",
  "businessName": "Example Newspapers",
  "ownerName": "Owner Name",
  "phone": "9876543210",
  "email": "owner@example.com",
  "address": "Business address"
}
```

Validation:

- `username`: required, 3 to 50 characters.
- `password`: required, minimum 6 characters.
- `businessName`: required.
- `ownerName`: required.
- `phone`: required.
- `email`: optional, but must be a valid email when supplied.
- `address`: optional.

The successful response returns authentication information. The frontend can store the returned JWT and take the user directly into the authenticated application.

### 2.3 Current user

Endpoint:

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

Use this during application startup when a token exists. It restores the current user and vendor context without requiring a new login.

### 2.4 Roles

Supported roles:

- `VENDOR`
- `PAPER_BOY`
- `ADMIN`

Current backend behavior:

- Vendor users have a vendor context.
- Paper boy users have an associated vendor context.
- Admin is defined, but most service methods require a vendor context and may reject admin requests.
- There are no controller-level role restrictions. A paper boy can currently reach more vendor endpoints than a frontend might expect.
- Do not use the role alone as a security boundary. The backend remains authoritative.

## 3. Standard Response Format

Most application responses use this wrapper:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-09-07T10:30:00"
}
```

For errors:

```json
{
  "success": false,
  "message": "A readable error message",
  "data": null,
  "timestamp": "2026-09-07T10:30:00"
}
```

Validation errors may contain field-level messages in `data`:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "name": "must not be blank",
    "copies": "must be greater than or equal to 1"
  },
  "timestamp": "2026-09-07T10:30:00"
}
```

The frontend API client should consistently unwrap `data` for successful calls and preserve `message` and field errors for failed calls.

Dates use `YYYY-MM-DD` unless otherwise stated. Date-time fields are returned as ISO-style `LocalDateTime` values. Enum values are uppercase strings.

## 4. HTTP Error Handling

Expected status codes:

- `400`: invalid request, validation failure, invalid business operation, or missing required query filter.
- `401`: missing, expired, or invalid authentication, or invalid login credentials.
- `403`: forbidden resource or failed WhatsApp webhook verification.
- `404`: requested entity does not exist or is not accessible to the current vendor.
- `409`: duplicate resource or duplicate bill generation.
- `500`: unexpected server error.

Recommended frontend behavior:

- `400`: show the backend message and field-level validation errors.
- `401`: clear authentication state and navigate to login.
- `403`: show a permission or access error.
- `404`: show a not-found state.
- `409`: show the conflict message and refresh the affected resource if appropriate.
- `500`: show a retryable server error state.

## 5. Master Data APIs

### 5.1 Beats

Beats represent delivery areas.

```http
GET    /api/v1/beats
GET    /api/v1/beats/{id}
POST   /api/v1/beats
PUT    /api/v1/beats/{id}
DELETE /api/v1/beats/{id}
```

Create/update request:

```json
{
  "name": "North Area",
  "code": "NORTH",
  "description": "Customers in the north area",
  "defaultPaperBoyId": 3
}
```

- `name` is required.
- `code`, `description`, and `defaultPaperBoyId` are optional.
- `DELETE` soft-deactivates the beat rather than necessarily removing its database record.

Response data:

```json
{
  "id": 1,
  "name": "North Area",
  "code": "NORTH",
  "description": "Customers in the north area",
  "defaultPaperBoyId": 3,
  "defaultPaperBoyName": "Paper Boy Name",
  "customerCount": 25,
  "paidCount": 18,
  "dueCount": 7,
  "active": true,
  "createdAt": "2026-09-07T10:30:00"
}
```

Useful screens:

- Beat list with customer, paid, and due counts.
- Beat create/edit form.
- Beat detail or assignment view.

### 5.2 Newspapers

```http
GET  /api/v1/newspapers
GET  /api/v1/newspapers/{id}
POST /api/v1/newspapers
PUT  /api/v1/newspapers/{id}
```

Create/update request:

```json
{
  "name": "Daily News",
  "code": "DN",
  "defaultPrice": 6.5,
  "language": "English"
}
```

- `name` is required.
- `defaultPrice` is required and must be at least `0.01`.
- `code` and `language` are optional.

Response data:

```json
{
  "id": 1,
  "name": "Daily News",
  "code": "DN",
  "defaultPrice": 6.5,
  "language": "English",
  "active": true,
  "createdAt": "2026-09-07T10:30:00"
}
```

### 5.3 Paper boys

```http
GET  /api/v1/paper-boys
GET  /api/v1/paper-boys/{id}
POST /api/v1/paper-boys
PUT  /api/v1/paper-boys/{id}
```

Create/update request:

```json
{
  "name": "Delivery Person",
  "phone": "9876543210",
  "createLoginUser": true,
  "username": "delivery_user",
  "password": "password123"
}
```

- `name` and `phone` are required.
- Login fields are optional.
- When `createLoginUser` is `true` and `username` is nonblank, a `PAPER_BOY` login account is created.
- If the password is omitted, the backend currently defaults it to `123456`.
- If `createLoginUser` is true without a username, no login account is created.

Response data:

```json
{
  "id": 3,
  "name": "Delivery Person",
  "phone": "9876543210",
  "active": true,
  "userId": 8,
  "username": "delivery_user",
  "createdAt": "2026-09-07T10:30:00"
}
```

## 6. Customer APIs

### 6.1 List and filter customers

```http
GET /api/v1/customers
```

Optional query parameters:

- `beatId`: filter by beat.
- `billStatus`: `PAID`, `UNPAID`, `DUE`, or `ALL`.
- `search`: search customer information.
- `page`: zero-based page number, default `0`.
- `size`: page size, default `20`.

Example:

```text
/api/v1/customers?beatId=1&billStatus=DUE&search=Rahul&page=0&size=20
```

Response data:

```json
{
  "content": [],
  "pageNumber": 0,
  "pageSize": 20,
  "totalElements": 0,
  "totalPages": 0,
  "last": true
}
```

Customer sorting is by name ascending.

### 6.2 Customer CRUD

```http
GET   /api/v1/customers/{id}
POST  /api/v1/customers
PUT   /api/v1/customers/{id}
PATCH /api/v1/customers/{id}?active=true&whatsAppEnabled=false
```

Create/update request:

```json
{
  "name": "Customer Name",
  "mobileNumber": "9876543210",
  "alternateMobile": "9123456780",
  "address": "Customer address",
  "beatId": 1,
  "paperBoyId": 3,
  "notes": "Leave at the gate",
  "whatsAppEnabled": true
}
```

Required fields:

- `name`
- `mobileNumber`
- `address`
- `beatId`

Optional fields:

- `alternateMobile`
- `paperBoyId`
- `notes`
- `whatsAppEnabled`, which defaults to `true` when omitted.

The patch endpoint updates `active` and/or `whatsAppEnabled` through query parameters. The frontend should only send values that need changing.

Customer response:

```json
{
  "id": 10,
  "name": "Customer Name",
  "mobileNumber": "9876543210",
  "alternateMobile": "9123456780",
  "address": "Customer address",
  "beatId": 1,
  "beatName": "North Area",
  "paperBoyId": 3,
  "paperBoyName": "Delivery Person",
  "notes": "Leave at the gate",
  "whatsAppEnabled": true,
  "active": true,
  "activeSubscriptionsCount": 2,
  "currentBillAmount": 500.0,
  "dueAmount": 200.0,
  "billStatus": "DUE",
  "createdAt": "2026-09-07T10:30:00"
}
```

Useful screens:

- Customer table with search, beat filter, bill-status filter, and pagination.
- Customer profile with subscriptions, bills, payments, and delivery history.
- Create/edit customer form.
- Active and WhatsApp consent toggles.

## 7. Subscription APIs

### 7.1 List subscriptions

```http
GET /api/v1/subscriptions
GET /api/v1/subscriptions?customerId=10
GET /api/v1/subscriptions/{id}
```

`customerId` is optional. Without it, the backend returns subscriptions for the vendor context.

### 7.2 Create and update subscriptions

```http
POST /api/v1/subscriptions
PUT  /api/v1/subscriptions/{id}
```

Request:

```json
{
  "customerId": 10,
  "newspaperId": 1,
  "copies": 2,
  "pricePerCopy": 6.5,
  "startDate": "2026-09-01",
  "endDate": null,
  "deliverySchedule": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": true,
    "sunday": false
  }
}
```

Validation and defaults:

- `customerId`, `newspaperId`, and `startDate` are required.
- `copies` is required and must be at least `1`.
- `pricePerCopy` is optional, but must be at least `0.01` when supplied.
- When `pricePerCopy` is omitted, the newspaper default price is used.
- When `deliverySchedule` is omitted, all seven days default to `true`.
- `endDate` is optional.

Response data:

```json
{
  "id": 20,
  "customerId": 10,
  "customerName": "Customer Name",
  "newspaperId": 1,
  "newspaperName": "Daily News",
  "copies": 2,
  "pricePerCopy": 6.5,
  "startDate": "2026-09-01",
  "endDate": null,
  "status": "ACTIVE",
  "deliverySchedule": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": true,
    "sunday": false
  },
  "createdAt": "2026-09-07T10:30:00"
}
```

Subscription statuses:

- `ACTIVE`
- `PAUSED`
- `CANCELLED`
- `EXPIRED`

Change status:

```http
PATCH /api/v1/subscriptions/{id}/status?status=PAUSED
```

The frontend should show the schedule as a seven-day selector and make the status transition explicit.

## 8. Daily Delivery APIs

### 8.1 Load today’s deliveries

```http
GET /api/v1/deliveries/today
GET /api/v1/deliveries/today?beatId=1
GET /api/v1/deliveries/today?paperBoyId=3
```

Both `beatId` and `paperBoyId` can be supplied together.

Important behavior: loading today’s deliveries can generate today’s delivery records. Treat this as a backend operation with side effects, not a purely read-only query.

### 8.2 Explicitly generate today’s deliveries

```http
POST /api/v1/deliveries/generate-today
```

Response data is a list of delivery records.

### 8.3 Update delivery status

```http
PATCH /api/v1/deliveries/{id}/status
Content-Type: application/json
```

Request:

```json
{
  "status": "DELIVERED"
}
```

Supported statuses:

- `DELIVERED`
- `NOT_DELIVERED`
- `SKIPPED`

Delivery response:

```json
{
  "id": 100,
  "subscriptionId": 20,
  "customerId": 10,
  "customerName": "Customer Name",
  "customerAddress": "Customer address",
  "beatId": 1,
  "beatName": "North Area",
  "paperBoyId": 3,
  "paperBoyName": "Delivery Person",
  "newspaperName": "Daily News",
  "copiesDelivered": 2,
  "deliveryDate": "2026-09-07",
  "status": "DELIVERED"
}
```

Current backend behavior: newly generated delivery records default to `DELIVERED`. The UI should not assume that newly generated records begin as pending until the backend behavior is changed.

Suggested screens:

- Today’s delivery list.
- Beat/paper-boy filters.
- Customer address and newspaper details.
- Quick actions for delivered, not delivered, and skipped.

## 9. Billing APIs

### 9.1 List bills

```http
GET /api/v1/bills
```

Optional query parameters:

- `customerId`
- `status`: `UNPAID`, `PARTIALLY_PAID`, or `PAID`
- `billingPeriod`: `YYYY-MM`
- `page`: zero-based, default `0`
- `size`: default `20`

Example:

```text
/api/v1/bills?status=UNPAID&billingPeriod=2026-08&page=0&size=20
```

Bills are sorted by billing period descending and then ID descending.

### 9.2 Get a bill

```http
GET /api/v1/bills/{id}
```

Bill response:

```json
{
  "id": 50,
  "customerId": 10,
  "customerName": "Customer Name",
  "customerMobileNumber": "9876543210",
  "vendorId": 1,
  "billingPeriod": "2026-08",
  "startDate": "2026-08-01",
  "endDate": "2026-08-31",
  "currentAmount": 600.0,
  "previousOutstanding": 100.0,
  "totalAmount": 700.0,
  "paidAmount": 200.0,
  "dueAmount": 500.0,
  "status": "PARTIALLY_PAID",
  "billItems": [],
  "whatsAppStatus": "QUEUED",
  "whatsAppProviderMessageId": null,
  "createdAt": "2026-09-07T10:30:00"
}
```

Each `billItems` item contains:

```json
{
  "id": 1,
  "newspaperName": "Daily News",
  "copies": 2,
  "unitPrice": 6.5,
  "daysCount": 26,
  "amount": 338.0
}
```

### 9.3 Generate bills

```http
POST /api/v1/bills/generate
Content-Type: application/json
```

Request for one customer:

```json
{
  "customerId": 10,
  "billingPeriod": "2026-08"
}
```

Request for all customers:

```json
{
  "billingPeriod": "2026-08"
}
```

- `billingPeriod` is required and must use `YYYY-MM`.
- Omitting `customerId` generates bills for all vendor customers.
- The endpoint returns a list of generated bill responses.
- Existing customer/period bills are skipped in bulk generation.
- Duplicate single-customer generation may return `409`.

Billing behavior:

- The default strategy calculates charges from scheduled subscription days.
- Active subscriptions contribute bill items.
- Previous outstanding balances are included in the total.
- A generated bill normally queues one WhatsApp bill notification unless WhatsApp is disabled for that customer.

Bill statuses:

- `UNPAID`
- `PARTIALLY_PAID`
- `PAID`

Suggested screens:

- Billing-period selector.
- Bill list with status and customer filters.
- Bill detail with item breakdown and balances.
- Generate-bills action with confirmation, especially for all customers.

## 10. Payment APIs

### 10.1 Record a payment

```http
POST /api/v1/payments
Content-Type: application/json
```

Request:

```json
{
  "billId": 50,
  "amount": 200.0,
  "paymentMethod": "UPI",
  "transactionRef": "UPI-REFERENCE-123",
  "notes": "Paid at office"
}
```

Validation:

- `billId` is required.
- `amount` is required and must be greater than `0`.
- `paymentMethod` is required.
- `transactionRef` and `notes` are optional.
- Payment amount cannot exceed the current bill due amount.

Payment methods:

- `CASH`
- `UPI`
- `BANK_TRANSFER`
- `OTHER`

Response data:

```json
{
  "id": 90,
  "billId": 50,
  "customerId": 10,
  "customerName": "Customer Name",
  "amount": 200.0,
  "paymentDate": "2026-09-07T10:30:00",
  "paymentMethod": "UPI",
  "transactionRef": "UPI-REFERENCE-123",
  "notes": "Paid at office",
  "remainingBillDueAmount": 300.0
}
```

Payment creation updates the bill balance and status transactionally. After recording a payment, refresh the bill detail.

### 10.2 Payment history

```http
GET /api/v1/payments?billId=50
GET /api/v1/payments?customerId=10
```

At least one of `billId` or `customerId` is required. Calling the endpoint without either filter returns `400`.

## 11. WhatsApp APIs

### 11.1 Send or resend a bill notification

```http
POST /api/v1/bills/{id}/send-whatsapp
```

This queues or sends the bill message according to the configured provider. The default local provider is `MOCK`.

The frontend should disable or explain this action when the customer has WhatsApp notifications disabled.

### 11.2 Read WhatsApp status

```http
GET /api/v1/bills/{id}/whatsapp-status
```

Response data:

```json
{
  "id": 200,
  "billId": 50,
  "customerId": 10,
  "customerName": "Customer Name",
  "phoneNumber": "9876543210",
  "messageType": "BILL_NOTIFICATION",
  "providerMessageId": "provider-id",
  "templateName": "monthly_bill_notification",
  "status": "SENT",
  "attemptCount": 1,
  "lastError": null,
  "queuedAt": "2026-09-07T10:30:00",
  "sentAt": "2026-09-07T10:30:05",
  "deliveredAt": null,
  "readAt": null,
  "failedAt": null
}
```

Message types:

- `BILL_NOTIFICATION`
- `PAYMENT_RECEIPT`
- `REMINDER`

Message statuses:

- `CREATED`
- `QUEUED`
- `SENDING`
- `SENT`
- `DELIVERED`
- `READ`
- `FAILED`
- `RETRY_PENDING`

WhatsApp delivery is asynchronous. The UI can refresh or poll the status after sending. In production, status may advance through Meta webhook callbacks.

## 12. WhatsApp Webhook

These endpoints are for the WhatsApp provider, not normal frontend use:

```http
GET  /api/v1/webhooks/whatsapp
POST /api/v1/webhooks/whatsapp
```

GET verification query parameters:

- `hub.mode`
- `hub.verify_token`
- `hub.challenge`

A valid verification returns the challenge text. An invalid verification returns `403`.

The POST endpoint accepts Meta status event payloads and returns `200`. It supports `sent`, `delivered`, `read`, and `failed` status updates.

## 13. Recommended Frontend Application Structure

A practical frontend can organize the product into these areas:

### Authentication

- Login
- Vendor registration
- Session restoration
- Logout
- Unauthorized/expired-session handling

### Dashboard

Use existing API data to show:

- Customer count
- Active subscriptions
- Today’s delivery state
- Paid and due bill totals
- Recent payments
- WhatsApp message failures

There is no dedicated dashboard endpoint in the backend, so dashboard metrics must be composed from the available APIs or added as a backend feature.

### Operations

- Today’s deliveries
- Beat and paper-boy filters
- Delivery status actions

### Customers

- Search and filter
- Customer profile
- Subscription management
- Bills and payments
- WhatsApp consent

### Billing and collections

- Billing period selection
- Bill generation
- Bill list and detail
- Payment entry
- Payment history
- WhatsApp notification status

### Administration

- Beats
- Paper boys
- Newspapers

## 14. Recommended API Client Behavior

Implement one shared API client with:

- Base URL from an environment variable.
- Automatic JSON serialization.
- Automatic `Authorization: Bearer` header injection.
- Response wrapper unwrapping.
- Consistent parsing of `message` and field-level validation errors.
- Automatic logout on `401`.
- Request cancellation for rapidly changing search filters.
- Separate handling for paginated and list responses.

Use the backend enum strings exactly as returned. Do not send display labels such as `Partially paid` where the API expects `PARTIALLY_PAID`.

Use `YYYY-MM-DD` for dates and `YYYY-MM` for billing periods.

## 15. CORS and Local Development

The backend allows these frontend origins by default:

- `http://localhost:3000`
- `http://localhost:5173`

Allowed methods:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS`

Allowed request headers include:

- `Authorization`
- `Content-Type`
- `X-Requested-With`
- `Accept`

Credentials are enabled. Configure the frontend development server to run on port `3000` or `5173`, or update the backend `CORS_ALLOWED_ORIGINS` environment variable.

## 16. Current Backend Limitations to Respect

These are current implementation facts, not frontend requirements to work around silently:

1. There is no dedicated dashboard endpoint.
2. Paper boy role restrictions are incomplete; the backend currently permits access to many vendor endpoints.
3. Admin users may fail operations requiring a vendor context.
4. Login currently looks up username even though some wording suggests username or mobile login.
5. The documented `ACTUAL_DELIVERIES` billing strategy is not implemented in the visible source; scheduled-days billing is the available strategy.
6. Loading today’s deliveries may create records.
7. Newly generated deliveries currently default to `DELIVERED`.
8. `PAID` customer filtering represents no outstanding balance according to backend logic; it should not be treated as an exact latest-bill status without checking bill data.
9. Authentication failures generated by the security framework may not use the normal application response wrapper.
10. A paper boy login may be created with the backend default password `123456` when no password is supplied. The frontend should require an explicit password where possible.
11. WhatsApp sending is asynchronous and status can change after the initial request.
12. The API does not provide a separate endpoint for deleting customers, newspapers, paper boys, or subscriptions. Use the available active/status controls.

## 17. End-to-End User Flows

### New vendor setup

1. Register with `/auth/register-vendor`.
2. Store the returned JWT and user metadata.
3. Call `/auth/me` on startup or after refresh.
4. Create newspapers.
5. Create paper boys.
6. Create beats and assign default paper boys.
7. Add customers and assign beats/paper boys.
8. Add customer subscriptions.

### Daily delivery operation

1. Call `/deliveries/today` with optional beat or paper-boy filters.
2. Render customer address, newspaper, copies, and status.
3. Update each record through `/deliveries/{id}/status`.
4. Refresh the list after updates.

### Monthly billing

1. Select a billing period in `YYYY-MM` format.
2. Call `/bills/generate` for one customer or all customers.
3. Display generated bill items and balances.
4. Show WhatsApp status when a message is queued.
5. Refresh bill and WhatsApp status as needed.

### Payment collection

1. Open the customer or bill detail.
2. Load payment history with `billId` or `customerId`.
3. Submit a payment with method and amount.
4. Refresh bill totals and status.
5. Optionally show WhatsApp receipt support only if the backend endpoint is added; no dedicated receipt endpoint currently exists.

## 18. Frontend Acceptance Checklist

The frontend is correctly integrated when it can:

- Register a vendor and log in.
- Persist and restore a JWT session.
- Display backend errors and field validation messages.
- Manage newspapers, beats, and paper boys.
- Create, search, filter, paginate, edit, and deactivate customers.
- Create and update subscriptions with weekly schedules.
- Display and update today’s delivery statuses.
- Generate and browse monthly bills.
- Display bill item breakdowns and outstanding balances.
- Record payments using all supported payment methods.
- Display payment history by bill and customer.
- Send a bill through WhatsApp and display asynchronous status.
- Handle expired sessions, forbidden responses, missing records, conflicts, and server errors.
- Work from `http://localhost:3000` or `http://localhost:5173` without CORS failures.
