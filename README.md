# BillBeat — Newspaper Vendor Management System (Backend V1)

BillBeat is a production-ready **Modular Monolith** Spring Boot backend designed for Newspaper Vendor Management. It powers customer administration, Beat distribution areas, newspaper subscriptions, daily delivery lists, transactional month-end billing, automated payment tracking, and WhatsApp Business API bill notification dispatching.

---

## Technical Stack

- **Framework**: Java 17 / Spring Boot 3.3.2
- **Build System**: Maven
- **Database**: MySQL (`billbeat_db`) with Spring Data JPA & Hibernate
- **Security**: Spring Security + JWT authentication
- **Validation**: Jakarta Validation (`@Valid`, `@NotBlank`, `@Positive`, etc.)
- **Documentation**: OpenAPI / Swagger UI (`springdoc-openapi-starter-webmvc-ui`)
- **Utilities**: Lombok, Jackson JSON
- **Testing**: JUnit 5, Mockito, Spring Boot Test

---

## Environment Variables

| Variable Name | Description | Default / Local Fallback |
| :--- | :--- | :--- |
| `DB_URL` | MySQL JDBC connection string | `jdbc:mysql://localhost:3306/billbeat_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DB_USERNAME` | Database username | `root` |
| `DB_PASSWORD` | Database password | *(empty)* |
| `JWT_SECRET` | Secret key for signing JWT tokens | `billbeat_secret_key_for_jwt_signing_must_be_at_least_256_bits_long_for_hs256` |
| `WHATSAPP_PROVIDER` | WhatsApp Integration Provider (`MOCK` or `META_CLOUD_API`) | `MOCK` |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Cloud API access token | `placeholder_access_token` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Phone Number ID | `placeholder_phone_number_id` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta WhatsApp Business Account ID | `placeholder_business_account_id` |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token | `billbeat_webhook_verify_token` |
| `WHATSAPP_API_BASE_URL` | Meta Graph API Base URL | `https://graph.facebook.com/v19.0` |
| `BILLING_STRATEGY` | Calculation strategy (`SCHEDULED_DAYS` vs `ACTUAL_DELIVERIES`) | `SCHEDULED_DAYS` |
| `MONTHLY_BILLING_CRON` | Cron expression for automated month-end billing job | `0 0 2 1 * ?` |

---

## Core Features & Architecture Design

### 1. Multi-Tenant Vendor Data Isolation
Every API request authenticates the user via JWT. Repositories enforce vendor isolation using `SecurityUtils.getCurrentVendorId()`. Vendors can never inspect or modify another vendor's Beats, Customers, Subscriptions, Deliveries, Bills, or Payments.

### 2. Billing Idempotency & Strategy Abstraction
- **Unique Constraint**: Unique index on `bills(customer_id, billing_period)` guarantees duplicate bills cannot be generated.
- **Strategy Pattern**: Isolated behind `BillingCalculationStrategy` interface (`StandardScheduledDaysBillingStrategy` default V1).

### 3. WhatsApp Outbox & Status Webhook Engine
- **Outbox Pattern**: Bill generation creates a `WhatsAppMessage` in status `QUEUED` with unique constraint `(bill_id, message_type)`.
- **Scheduled Queue Worker**: `@Scheduled` job processes outbox messages asynchronously.
- **Provider Abstraction**: Isolated behind `WhatsAppProvider` (`MockWhatsAppProvider` for testing and `MetaWhatsAppCloudApiProvider` for production).
- **Webhook Callback**: `POST /api/v1/webhooks/whatsapp` updates status (`SENT` -> `DELIVERED` -> `READ` / `FAILED`).

---

## API Catalogue

### Authentication
- `POST /api/v1/auth/login` — Login and receive JWT bearer token
- `POST /api/v1/auth/register-vendor` — Register new newspaper vendor account
- `GET /api/v1/auth/me` — Current user context

### Beats (Areas)
- `GET /api/v1/beats` — List vendor Beats with customer/paid/due counts
- `POST /api/v1/beats` — Create new Beat
- `PUT /api/v1/beats/{id}` — Update Beat details
- `DELETE /api/v1/beats/{id}` — Deactivate Beat

### Customers
- `GET /api/v1/customers?beatId=5&billStatus=UNPAID&search=Rahul&page=0&size=20` — Search/filter customers with pagination
- `POST /api/v1/customers` — Create customer profile
- `GET /api/v1/customers/{id}` — Get customer details
- `PUT /api/v1/customers/{id}` — Update customer profile
- `PATCH /api/v1/customers/{id}` — Patch customer active/WhatsApp status

### Newspapers Catalog
- `GET /api/v1/newspapers` — List newspaper catalog
- `POST /api/v1/newspapers` — Add newspaper to catalog
- `PUT /api/v1/newspapers/{id}` — Update newspaper catalog entry

### Subscriptions
- `GET /api/v1/subscriptions` — List subscriptions
- `POST /api/v1/subscriptions` — Add subscription with weekly schedule
- `PUT /api/v1/subscriptions/{id}` — Update subscription
- `PATCH /api/v1/subscriptions/{id}/status` — Update status (`ACTIVE`, `PAUSED`, `CANCELLED`, `EXPIRED`)

### Paper Boys
- `GET /api/v1/paper-boys` — List Paper Boys
- `POST /api/v1/paper-boys` — Add Paper Boy
- `PUT /api/v1/paper-boys/{id}` — Update Paper Boy

### Deliveries
- `GET /api/v1/deliveries/today` — Today's delivery list for Paper Boy/Vendor
- `POST /api/v1/deliveries/generate-today` — Trigger today's delivery list generation
- `PATCH /api/v1/deliveries/{id}/status` — Mark status (`DELIVERED`, `NOT_DELIVERED`, `SKIPPED`)

### Bills
- `GET /api/v1/bills` — Query customer bills
- `POST /api/v1/bills/generate` — Generate monthly bill (single or batch)
- `GET /api/v1/bills/{id}` — Get bill details and WhatsApp status

### Payments
- `POST /api/v1/payments` — Record payment & update bill balance transactionally
- `GET /api/v1/payments?billId=10` — View payment history

### WhatsApp
- `POST /api/v1/bills/{id}/send-whatsapp` — Trigger/resend WhatsApp bill notification
- `GET /api/v1/bills/{id}/whatsapp-status` — Get delivery lifecycle status

### Webhook
- `GET /api/v1/webhooks/whatsapp` — Verify challenge token
- `POST /api/v1/webhooks/whatsapp` — Handle delivery/read status updates

---

## How to Run BillBeat Backend

### Prerequisites
- JDK 17 or JDK 21
- MySQL server running locally on port `3306` with database `billbeat_db` (or auto-created)

### Command Line Instructions
```bash
# 1. Run Unit and Integration Tests
mvn clean test

# 2. Package Executable Application
mvn clean package

# 3. Launch Spring Boot Server
java -jar target/billbeat-1.0.0-SNAPSHOT.jar
```

### OpenAPI / Swagger UI
Once running, open Swagger UI in your browser to inspect and interact with the REST API:
`http://localhost:8080/swagger-ui.html`

---

## Unresolved Business Decisions (Isolated via Configuration)

As per business requirements, the following policies are intentionally isolated behind configurable strategies:

1. **Billing Model & Basis**: Default strategy `SCHEDULED_DAYS` calculates charges based on weekly delivery schedules in active subscriptions. Swappable via `BILLING_STRATEGY=ACTUAL_DELIVERIES`.
2. **WhatsApp Integration**: Default provider `MOCK` simulates provider message IDs without external HTTP calls. Swappable to `META_CLOUD_API` via `WHATSAPP_PROVIDER`.
