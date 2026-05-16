# API Standard

## Base URL

`/api`

## Success Response

```json
{
  "success": true,
  "message": "Request completed",
  "data": {}
}
```

## Error Response

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": "ERROR_CODE"
}
```

## Authentication

Use `Authorization: Bearer <accessToken>`.

All API responses include an `X-Request-Id` response header. Include this id when reporting production issues.

## Auth Endpoints

### `POST /api/auth/login`

```json
{
  "email": "admin@sinsoftware.in",
  "password": "your-secure-password"
}
```

Returns user, access token, refresh token, and token type.

### `POST /api/auth/refresh`

```json
{
  "refreshToken": "refresh-token"
}
```

Rotates the refresh token and returns a new access token and refresh token.

### `POST /api/auth/logout`

```json
{
  "refreshToken": "refresh-token"
}
```

Revokes the refresh token.

### `GET /api/auth/me`

Requires `Authorization: Bearer <accessToken>`.

Auth mutation endpoints are rate-limited.

## Super Admin Company Endpoints

All routes require a `SUPER_ADMIN` access token.

### `POST /api/admin/companies`

Creates a transport company and optionally its first Company Admin user.

```json
{
  "companyName": "Shree Balaji Transport",
  "companyCode": "SBT001",
  "ownerName": "Ramesh Kumar",
  "ownerPhone": "9876543210",
  "ownerEmail": "owner@example.com",
  "city": "Nagpur",
  "state": "Maharashtra",
  "address": "Transport Nagar",
  "gstNumber": "27ABCDE1234F1Z5",
  "planName": "Starter",
  "maxVehicles": 25,
  "maxUsers": 5,
  "subscriptionStartDate": "2026-05-16",
  "subscriptionEndDate": "2026-06-16",
  "status": "TRIAL",
  "adminUser": {
    "name": "Company Admin",
    "email": "admin@example.com",
    "phone": "9876543210",
    "temporaryPassword": "StrongTemp123"
  }
}
```

### `GET /api/admin/companies`

Supports pagination, search, and status filter:

`/api/admin/companies?page=1&limit=20&search=balaji&status=TRIAL`

### `GET /api/admin/companies/:id`

Returns one company.

### `PATCH /api/admin/companies/:id`

Updates editable company, owner, and subscription fields.

### `PATCH /api/admin/companies/:id/status`

```json
{
  "status": "ACTIVE"
}
```

## Audit Log Endpoints

Audit logs are created for successful create/update/delete/status mutations across vehicles, drivers, clients, trips, diesel, expenses, payments, and company status changes.

### `GET /api/admin/audit-logs`

Requires a `SUPER_ADMIN` access token.

Supports:

`/api/admin/audit-logs?page=1&limit=50&module=vehicles&action=CREATE&companyId=<companyId>`

### `GET /api/company/audit-logs`

Requires a `COMPANY_ADMIN` or `USER` access token. Results are scoped to the authenticated user's company.

Supports:

`/api/company/audit-logs?page=1&limit=50&module=payments&action=DELETE`

## Company Vehicle Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token. The backend resolves `companyId` from the authenticated user and never trusts a client-supplied company id.

### `POST /api/company/vehicles`

```json
{
  "vehicleNumber": "MH31AB1234",
  "vehicleType": "TRUCK_10_WHEEL",
  "make": "Tata",
  "model": "Signa",
  "manufacturingYear": 2024,
  "fuelType": "DIESEL",
  "ownershipType": "OWNED",
  "capacityTon": 16,
  "status": "ACTIVE",
  "rcNumber": "MH31AB1234",
  "insuranceExpiryDate": "2027-05-16",
  "fitnessExpiryDate": "2027-05-16",
  "permitExpiryDate": "2027-05-16",
  "pollutionExpiryDate": "2027-05-16",
  "gpsDeviceId": "GPS-001",
  "notes": "Main route vehicle"
}
```

### `GET /api/company/vehicles`

Supports pagination, search, status filter, and vehicle type filter:

`/api/company/vehicles?page=1&limit=20&search=mh31&status=ACTIVE&vehicleType=TRUCK_10_WHEEL`

### `GET /api/company/vehicles/:id`

Returns one vehicle from the authenticated user's company.

### `PATCH /api/company/vehicles/:id`

Updates editable vehicle fields.

### `PATCH /api/company/vehicles/:id/status`

```json
{
  "status": "MAINTENANCE"
}
```

### `DELETE /api/company/vehicles/:id`

Soft deletes the vehicle by setting `deletedAt` and `INACTIVE` status.

## Company Driver Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token and use authenticated `companyId`.

### `POST /api/company/drivers`

```json
{
  "name": "Ravi Kumar",
  "phone": "9876543210",
  "alternatePhone": "9876500000",
  "licenseNumber": "MH123456789",
  "licenseExpiryDate": "2027-05-16",
  "aadhaarNumber": "123412341234",
  "address": "Nagpur",
  "joiningDate": "2026-05-16",
  "salaryType": "FIXED",
  "salaryAmount": 25000,
  "status": "ACTIVE",
  "notes": "Senior driver"
}
```

### `GET /api/company/drivers`

Supports pagination, search, and status filter:

`/api/company/drivers?page=1&limit=20&search=ravi&status=ACTIVE`

### `GET /api/company/drivers/:id`

Returns one driver from the authenticated user's company.

### `PATCH /api/company/drivers/:id`

Updates editable driver fields.

### `PATCH /api/company/drivers/:id/status`

```json
{
  "status": "ON_TRIP"
}
```

### `DELETE /api/company/drivers/:id`

Soft deletes the driver by setting `deletedAt` and `INACTIVE` status.

## Company Client Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token and use authenticated `companyId`.

### `POST /api/company/clients`

```json
{
  "clientName": "ABC Cement",
  "contactPerson": "Amit Sharma",
  "phone": "9876543210",
  "alternatePhone": "9876500000",
  "email": "billing@example.com",
  "gstNumber": "27ABCDE1234F1Z5",
  "billingAddress": "Industrial Area",
  "city": "Nagpur",
  "state": "Maharashtra",
  "paymentTerms": "15 days",
  "status": "ACTIVE",
  "notes": "Priority client"
}
```

### `GET /api/company/clients`

Supports pagination, search, and status filter:

`/api/company/clients?page=1&limit=20&search=cement&status=ACTIVE`

### `GET /api/company/clients/:id`

Returns one client from the authenticated user's company.

### `PATCH /api/company/clients/:id`

Updates editable client fields.

### `PATCH /api/company/clients/:id/status`

```json
{
  "status": "BLOCKED"
}
```

### `DELETE /api/company/clients/:id`

Soft deletes the client by setting `deletedAt` and `INACTIVE` status.

## Company Trip Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token and use authenticated `companyId`.

### `POST /api/company/trips`

Creates a trip connecting one vehicle, driver, and client from the same company. `tripNumber` is generated automatically.

```json
{
  "vehicleId": "uuid",
  "driverId": "uuid",
  "clientId": "uuid",
  "sourceLocation": "Nagpur",
  "destinationLocation": "Mumbai",
  "loadingDate": "2026-05-16",
  "unloadingDate": "2026-05-18",
  "materialName": "Cement",
  "quantity": 16,
  "quantityUnit": "TON",
  "freightAmount": 45000,
  "advanceAmount": 10000,
  "rateType": "FIXED",
  "distanceKm": 820,
  "status": "BOOKED",
  "notes": "Night loading"
}
```

### `GET /api/company/trips`

Supports pagination, search, status/date/vehicle/driver/client filters:

`/api/company/trips?page=1&limit=20&search=mumbai&status=IN_TRANSIT&vehicleId=uuid&driverId=uuid&clientId=uuid&fromDate=2026-05-01&toDate=2026-05-31`

### `GET /api/company/trips/:id`

Returns one trip from the authenticated user's company.

### `PATCH /api/company/trips/:id`

Updates editable trip fields and recalculates balance.

### `PATCH /api/company/trips/:id/status`

```json
{
  "status": "DELIVERED"
}
```

### `DELETE /api/company/trips/:id`

Soft deletes the trip by setting `deletedAt`, marks the trip `CANCELLED`, and releases the vehicle/driver.

## Company Diesel Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token and use authenticated `companyId`.

### `POST /api/company/diesel`

Creates a diesel entry. `totalAmount` is calculated by the backend as `liters * ratePerLiter`.

```json
{
  "tripId": "uuid",
  "vehicleId": "uuid",
  "driverId": "uuid",
  "dieselDate": "2026-05-16",
  "fuelStationName": "HP Transport Nagar",
  "liters": 120,
  "ratePerLiter": 92.5,
  "paymentMode": "CASH",
  "billNumber": "HP-102",
  "odometerReading": 45210,
  "notes": "Full tank",
  "receiptImageUrl": "https://example.com/receipt.jpg"
}
```

### `GET /api/company/diesel`

Supports pagination, search, trip/vehicle/driver filters, and date filters:

`/api/company/diesel?page=1&limit=20&search=hp&tripId=uuid&vehicleId=uuid&driverId=uuid&fromDate=2026-05-01&toDate=2026-05-31`

Returns `items`, `pagination`, and summary totals for total diesel amount, diesel liters, trip diesel amount, and vehicle diesel amount.

### `GET /api/company/diesel/:id`

Returns one diesel entry from the authenticated user's company.

### `PATCH /api/company/diesel/:id`

Updates editable diesel fields and recalculates `totalAmount` when liters or rate changes.

### `DELETE /api/company/diesel/:id`

Soft deletes the diesel entry by setting `deletedAt`.

## Company Expense Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token and use authenticated `companyId`.

### `POST /api/company/expenses`

Creates a trip-specific, vehicle-specific, driver-related, or general company expense.

```json
{
  "tripId": "uuid",
  "vehicleId": "uuid",
  "driverId": "uuid",
  "expenseDate": "2026-05-16",
  "expenseType": "TOLL",
  "amount": 1250,
  "paymentMode": "UPI",
  "paidTo": "Highway Toll",
  "billNumber": "TOLL-88",
  "notes": "Nagpur route toll",
  "receiptImageUrl": "https://example.com/receipt.jpg"
}
```

Supported `expenseType` values: `TOLL`, `REPAIR`, `CHALLAN`, `LOADING`, `UNLOADING`, `DRIVER_ADVANCE`, `HELPER`, `FOOD`, `PARKING`, `TYRE`, `MAINTENANCE`, `OTHER`.

### `GET /api/company/expenses`

Supports pagination, search, type/trip/vehicle/driver filters, and date filters:

`/api/company/expenses?page=1&limit=20&search=toll&expenseType=TOLL&tripId=uuid&vehicleId=uuid&driverId=uuid&fromDate=2026-05-01&toDate=2026-05-31`

Returns `items`, `pagination`, and summary totals for total expense amount, trip expenses, vehicle expenses, and company expenses.

### `GET /api/company/expenses/:id`

Returns one expense from the authenticated user's company.

### `PATCH /api/company/expenses/:id`

Updates editable expense fields.

### `DELETE /api/company/expenses/:id`

Soft deletes the expense by setting `deletedAt`.

## Company Payment Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token and use authenticated `companyId`.

### `POST /api/company/payments`

Creates a client-level or trip-specific payment. Trip-specific payments update trip `receivedAmount` and `balanceAmount`.

```json
{
  "clientId": "uuid",
  "tripId": "uuid",
  "paymentDate": "2026-05-16",
  "amount": 15000,
  "paymentMode": "BANK_TRANSFER",
  "referenceNumber": "UTR123456",
  "notes": "Part payment",
  "receiptImageUrl": "https://example.com/payment.jpg"
}
```

Supported `paymentMode` values: `CASH`, `UPI`, `CARD`, `BANK_TRANSFER`, `CHEQUE`, `CREDIT`, `OTHER`.

### `GET /api/company/payments`

Supports pagination, search, client/trip filters, date filters, and payment mode filter:

`/api/company/payments?page=1&limit=20&search=utr&clientId=uuid&tripId=uuid&fromDate=2026-05-01&toDate=2026-05-31&paymentMode=BANK_TRANSFER`

Returns `items`, `pagination`, and summary totals for total received, pending outstanding, today received, and payment count.

### `GET /api/company/payments/:id`

Returns one payment from the authenticated user's company.

### `PATCH /api/company/payments/:id`

Updates editable payment fields and recalculates old/new trip totals when the trip link or amount changes.

### `DELETE /api/company/payments/:id`

Soft deletes the payment by setting `deletedAt` and recalculates trip totals for trip-specific payments.

## Company Report Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token and use authenticated `companyId`.

Date-based reports default to the last 30 days when `fromDate` and `toDate` are omitted.

### `GET /api/company/reports/dashboard`

Returns practical dashboard analytics:

- fleet counts by status
- trip counts by status
- total freight/income
- received amount
- pending payment
- diesel cost
- other expense
- net profit
- expiring documents count
- recent trips
- top clients by revenue
- vehicle profit summary

`/api/company/reports/dashboard?fromDate=2026-05-01&toDate=2026-05-31`

### `GET /api/company/reports/vehicle-profit`

Returns vehicle-wise trips, freight, received, diesel, expense, net profit, and pending amount.

`/api/company/reports/vehicle-profit?fromDate=2026-05-01&toDate=2026-05-31&vehicleId=uuid&page=1&limit=50`

### `GET /api/company/reports/driver-performance`

Returns driver-wise total trips, delivered trips, cancelled trips, freight, diesel, and expense totals.

`/api/company/reports/driver-performance?fromDate=2026-05-01&toDate=2026-05-31&driverId=uuid&page=1&limit=50`

### `GET /api/company/reports/client-ledger`

Returns client-wise total trips, total freight, received amount, outstanding amount, and trip breakdown.

`/api/company/reports/client-ledger?clientId=uuid&fromDate=2026-05-01&toDate=2026-05-31&page=1&limit=50`

### `GET /api/company/reports/document-expiry`

Returns vehicles with insurance, fitness, permit, or pollution expiring soon and drivers with licenses expiring soon.

`/api/company/reports/document-expiry?days=30&page=1&limit=50`

### `GET /api/company/reports/outstanding`

Returns client-wise and trip-wise outstanding balances. Supports quick search:

`/api/company/reports/outstanding?search=cement`

### `GET /api/company/reports/trip-profit/:tripId`

Returns one trip's profit summary:

- `freightAmount`
- `receivedAmount`
- `balanceAmount`
- `dieselTotal`
- `expenseTotal`
- `netProfit`

### `GET /api/company/reports/client-summary/:clientId`

Returns client totals for freight, received, balance, payment amount, trip count, payment count, and outstanding trips.

## Company Export Endpoints

All routes require a `COMPANY_ADMIN` or `USER` access token and use authenticated `companyId`. Export endpoints return files directly, not the standard JSON envelope.

All responses include:

- `Content-Disposition: attachment`
- safe generated filenames
- `Cache-Control: private, no-store`
- an `EXPORT` audit log row under module `exports`

### `GET /api/company/exports/trip-invoice/:tripId.pdf`

Downloads a PDF invoice for one company-owned trip.

### `GET /api/company/exports/client-statement/:clientId.pdf`

Downloads a PDF statement for one company-owned client.

### `GET /api/company/exports/vehicle-profit.xlsx`

Downloads vehicle profit rows. Supports `fromDate`, `toDate`, and `vehicleId`.

### `GET /api/company/exports/driver-performance.xlsx`

Downloads driver performance rows. Supports `fromDate`, `toDate`, and `driverId`.

### `GET /api/company/exports/client-ledger.xlsx`

Downloads client ledger rows. Supports `fromDate`, `toDate`, and `clientId`.

### `GET /api/company/exports/outstanding.xlsx`

Downloads outstanding trip rows. Supports `search`.
