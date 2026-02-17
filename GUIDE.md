# Video 2 — Identity Domain: Step-by-Step Recording Guide

## Prerequisites
```bash
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt
```

---

## Phase 1: Database Setup

### 1.1 Create migration files
Create files manually in `src/migrations/` with this naming convention:
```
src/migrations/20260214_001_create_users_table.ts
src/migrations/20260214_002_create_password_resets_table.ts
src/migrations/20260214_003_create_customer_addresses_table.ts
```

### 1.2 Write migration: users table
File: `src/migrations/<timestamp>_create_users_table.ts`
- Raw SQL via `knex.raw()`
- Columns: id (SERIAL PK), email (TEXT UNIQUE), phone, name, password_hash, system_role (VARCHAR + CHECK), deleted_at, created_at, updated_at
- Indexes: idx_users_email, idx_users_system_role

### 1.3 Write migration: password_resets table
File: `src/migrations/<timestamp>_create_password_resets_table.ts`
- Raw SQL via `knex.raw()`
- Columns: id (SERIAL PK), user_id (BIGINT FK → users), otp_hash, expires_at, consumed_at, created_at
- Index: idx_password_resets_user_id

### 1.4 Write migration: customer_addresses table
File: `src/migrations/<timestamp>_create_customer_addresses_table.ts`
- Raw SQL via `knex.raw()`
- Columns: id (SERIAL PK), user_id (BIGINT FK → users), label, text, lat (DECIMAL 10,7), lng (DECIMAL 10,7), is_default (BOOLEAN DEFAULT FALSE), created_at
- Index: idx_customer_addresses_user_id

### 1.5 Create migrate script
File: `src/scripts/migrate.ts`
- Imports `db` from common knex config
- Accepts command argument: `latest`, `rollback`, or `status`
- Runs `db.migrate.latest()`, `db.migrate.rollback()`, or `db.migrate.list()` accordingly
- Logs results and destroys connection

### 1.6 Add migration npm scripts
File: `package.json`
```json
"migrate:latest": "tsx src/scripts/migrate.ts latest",
"migrate:rollback": "tsx src/scripts/migrate.ts rollback",
"migrate:status": "tsx src/scripts/migrate.ts status"
```

### 1.7 Run migrations
```bash
npm run migrate:latest
```

---

## Phase 2: Environment & Common Layer

### 2.1 Update .env
Add to `.env`:
```
ACCESS_SECRET=your-access-secret-change-me
REFRESH_SECRET=your-refresh-secret-change-me
ACCESS_EXPIRES_IN=1h
REFRESH_EXPIRES_IN=7d
```

### 2.2 Update env config
File: `src/common/config/env.ts`
- Add ACCESS_SECRET, REFRESH_SECRET, ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN to Zod schema
- Add `jwt` object to exported env

### 2.3 Create Express type augmentation
File: `src/common/types/express.d.ts`
- Augment Express.Request with `correlationId?: string` and `user?: { userId: number, email: string, role: string }`

### 2.4 Update correlationId middleware
File: `src/common/correlation/correlationId.ts`
- Use `req.correlationId` directly (no more type casting), reuse same UUID for request and response header

### 2.5 Update error handler
File: `src/common/error/errorHandler.ts`
- Use `req.correlationId` directly (no more type casting)

### 2.6 Create dummy email sender
File: `src/common/email/email.ts`
- `sendEmail(to, subject, body)` — logs via logger with `logger.info('Email sent (dummy)', { to, subject, body })`

### 2.7 Create pagination utility
File: `src/common/pagination/pagination.ts`
- `paginationSchema` — Zod schema: page (coerce number, min 1, default 1), limit (coerce number, min 1, max 100, default 10)
- `parsePagination(req)` — parses `req.query` against the schema
- `paginationMeta(page, limit, total)` — returns `{ page, limit, total, totalPages }`

### 2.8 Create auth middleware
File: `src/common/middleware/auth.ts`
- `authenticate` middleware: extract Bearer token → `verifyAccessToken()` → attach `req.user = { userId, email, role }`
- Throws AppError 401 if missing/invalid

---

## Phase 3: Auth Module

### 3.1 Create auth errors
File: `src/app/auth/auth.errors.ts`
- UserAlreadyExistsError (409) — "User with this email already exists"
- IncorrectCredentialsError (401) — "Incorrect email or password"
- InvalidOtpError (400) — "Invalid OTP"
- ExpiredOtpError (400) — "OTP has expired"

### 3.2 Create auth utilities
File: `src/app/auth/auth.utils.ts`
- `JwtPayload` interface: `{ userId: number, email: string, role: string }`
- `createAccessToken(payload)` / `createRefreshToken(payload)` — jwt.sign with env secrets/expiry
- `verifyAccessToken(token)` / `verifyRefreshToken(token)` — jwt.verify, returns JwtPayload
- `hashPassword(password)` — bcrypt.hash with 10 rounds
- `comparePassword(password, hash)` — bcrypt.compare
- `generateOtp()` — crypto.randomInt 6-digit string
- `hashOtp(otp)` — sha256 hex digest

### 3.3 Create auth DTOs
File: `src/app/auth/dto/auth.dto.ts`
- `registerDto`: email (z.email), phone (min 1), name (min 1), password (min 6)
- `loginDto`: email, password
- `forgotPasswordDto`: email
- `resetPasswordDto`: email, otp (length 6), newPassword (min 6)
- `refreshDto`: refreshToken (min 1)

### 3.4 Create auth repository
File: `src/app/auth/repo/auth.repo.ts`
- Only handles `password_resets` table — user queries live in users.repo
- `PasswordResetRow` interface (matches password_resets table columns)
- Define `PASSWORD_RESET_COLUMNS` array for explicit selects (never use `*`)
- `createPasswordReset(data)` — INSERT RETURNING columns
- `findLatestPasswordReset(userId)` — SELECT columns WHERE user_id + consumed_at IS NULL, ORDER BY created_at DESC
- `consumePasswordReset(resetId)` — UPDATE consumed_at = now()

### 3.5 Create auth service
File: `src/app/auth/service/auth.service.ts`
- Imports user queries (`findUserByEmail`, `createUser`, `updateUserPassword`) from `users/repo/users.repo.ts`
- Imports password reset queries from `auth/repo/auth.repo.ts`
- `register`: check exists → hash password → insert user (role=customer) → generate tokens → return `{ accessToken, refreshToken, user: { id, email, phone, name, systemRole, createdAt } }`
- `login`: find user → compare password → generate tokens → return `{ accessToken, refreshToken, user: { id, email, phone, name, systemRole } }`
- `forgotPassword`: find user (silent if not found) → generate OTP → hash → store in password_resets (10 min expiry) → send email
- `resetPassword`: find user → find latest non-consumed reset → verify OTP hash → check expiry → hash new password → update user → consume reset
- `refresh`: verify refresh token → create new access token → return `{ accessToken }`

### 3.6 Create auth controller
File: `src/app/auth/controller/auth.controller.ts`
- `register`: parse registerDto → call service → 201 `{ message: "Registered successfully", accessToken, refreshToken, user }`
- `login`: parse loginDto → call service → 200 `{ message: "Login successful", accessToken, refreshToken, user }`
- `logout`: 200 `{ message: "Logged out successfully" }`
- `forgotPassword`: parse forgotPasswordDto → call service → 200 `{ message: "Reset email sent if account exists" }`
- `resetPassword`: parse resetPasswordDto → call service → 200 `{ message: "Password reset successful" }`
- `refresh`: parse refreshDto → call service → 200 `{ accessToken }`

### 3.7 Create auth routes
File: `src/app/auth/auth.routes.ts`
- POST /register, /login, /forgot-password, /reset-password, /refresh — no auth
- POST /logout — with authenticate middleware

---

## Phase 4: Users Module

### 4.1 Create users errors
File: `src/app/users/users.errors.ts`
- UserNotFoundError (404) — "User not found"

### 4.2 Create users DTO
File: `src/app/users/dto/users.dto.ts`
- `updateMeDto`: name (optional, min 1), phone (optional, min 1)

### 4.3 Create users repository
File: `src/app/users/repo/users.repo.ts`
- `UserRow` interface (matches users table columns) — single source of truth, used by auth too
- Define `USER_COLUMNS` array for explicit selects (never use `*`)
- `findUserById(id)` — SELECT columns WHERE id + deleted_at IS NULL
- `findUserByEmail(email)` — SELECT columns WHERE email + deleted_at IS NULL
- `createUser(data)` — INSERT RETURNING columns
- `updateUser(id, data)` — UPDATE { ...data, updated_at } RETURNING columns
- `updateUserPassword(userId, passwordHash)` — UPDATE password_hash + updated_at

### 4.4 Create users service
File: `src/app/users/service/users.service.ts`
- `getMe(userId)`: find user → return `{ id, email, phone, name, systemRole }`
- `updateMe(userId, data)`: find user → update → return `{ id, email, phone, name, systemRole }`

### 4.5 Create users controller
File: `src/app/users/controller/users.controller.ts`
- `getMe`: call service → 200 `{ id, email, phone, name, systemRole }`
- `updateMe`: parse updateMeDto → call service → 200 `{ message: "Profile updated", user }`

### 4.6 Create users routes
File: `src/app/users/users.routes.ts`
- `router.use(authenticate)` — all routes require auth
- GET /me, PATCH /me

---

## Phase 5: Customer Address Module

### 5.1 Create address errors
File: `src/app/customer-address/address.errors.ts`
- AddressNotFoundError (404) — "Address not found"
- AddressLimitReachedError (400) — "Maximum number of addresses reached (10)"

### 5.2 Create address DTOs
File: `src/app/customer-address/dto/address.dto.ts`
- `createAddressDto`: label, addressText, lat, lng, isDefault (optional, default false)
- `updateAddressDto`: all fields optional (label, addressText, lat, lng, isDefault)

### 5.3 Create address repository
File: `src/app/customer-address/repo/address.repo.ts`
- `AddressRow` interface (DB snake_case: user_id, is_default, etc.)
- Define `ADDRESS_COLUMNS` array for explicit selects (never use `*`)
- `findAddressesByUserId(userId, offset, limit)` — SELECT columns, paginated query
- `findAddressById(id, userId)` — SELECT columns, scoped to user
- `countAddressesByUserId(userId)` — COUNT for pagination + limit check
- `createAddress(data)` — INSERT RETURNING columns
- `updateAddress(id, userId, data)` — UPDATE RETURNING columns
- `deleteAddress(id, userId)` — DELETE scoped to user
- `clearDefaultAddress(userId)` — set is_default=false for all user addresses

### 5.4 Create address service
File: `src/app/customer-address/service/address.service.ts`
- `formatAddress(row)` — maps DB snake_case to camelCase: `{ id, label, addressText, lat, lng, isDefault }`
- `listAddresses(userId, pagination)` — paginated query → return `{ data: [...], pagination: { page, limit, total, totalPages } }`
- `addAddress(userId, data)` — check count < 10, clear default if needed, create → return formatted
- `editAddress(userId, addressId, data)` — check exists, clear default if needed, map camelCase→snake_case, update → return formatted
- `removeAddress(userId, addressId)` — check exists, delete

### 5.5 Create address controller
File: `src/app/customer-address/controller/address.controller.ts`
- `listAddresses`: parsePagination(req) → call service → 200 `{ data, pagination }`
- `createAddress`: parse createAddressDto → call service → 201 `{ message: "Address added", address }`
- `updateAddress`: parse params.addressId + updateAddressDto → call service → 200 `{ message: "Address updated", address }`
- `deleteAddress`: parse params.addressId → call service → 200 `{ message: "Address deleted" }`

### 5.6 Create address routes
File: `src/app/customer-address/address.routes.ts`
- `router.use(authenticate)` — all routes require auth
- GET /, POST /, PATCH /:addressId, DELETE /:addressId

---

## Phase 6: Wire Everything

### 6.1 Update routes.ts
File: `src/routes.ts`
- Import authRouter, usersRouter, addressRouter
- Mount: `/auth`, `/users`, `/customer/addresses`

---

## Phase 7: Verify

```bash
# Type check
npx tsc --noEmit

# Start server
npm run dev

# Test register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","phone":"1234567890","name":"Test User","password":"password123"}'
# → 201 { message, accessToken, refreshToken, user: { id, email, phone, name, systemRole, createdAt } }

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
# → 200 { message, accessToken, refreshToken, user: { id, email, phone, name, systemRole } }

# Test /me (use accessToken from login)
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>"
# → 200 { id, email, phone, name, systemRole }

# Test update /me
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"name":"Updated Name"}'
# → 200 { message: "Profile updated", user: { id, email, phone, name, systemRole } }

# Test create address
curl -X POST http://localhost:3000/api/customer/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"label":"Home","addressText":"123 Main St","lat":25.1234567,"lng":55.1234567,"isDefault":true}'
# → 201 { message: "Address added", address: { id, label, addressText, lat, lng, isDefault } }

# Test list addresses (paginated)
curl "http://localhost:3000/api/customer/addresses?page=1&limit=10" \
  -H "Authorization: Bearer <accessToken>"
# → 200 { data: [...], pagination: { page, limit, total, totalPages } }

# Test update address
curl -X PATCH http://localhost:3000/api/customer/addresses/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"label":"Work"}'
# → 200 { message: "Address updated", address: { ... } }

# Test delete address
curl -X DELETE http://localhost:3000/api/customer/addresses/1 \
  -H "Authorization: Bearer <accessToken>"
# → 200 { message: "Address deleted" }

# Test forgot password
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
# → 200 { message: "Reset email sent if account exists" }

# Test refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
# → 200 { accessToken }

# Test logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <accessToken>"
# → 200 { message: "Logged out successfully" }
```

---

## Architecture Pattern (per module)

```
errors       → custom AppError subclasses (at module root)
utils        → pure helper functions — hashing, tokens, etc. (at module root)
dto/         → Zod validation schemas (input validation)
repo/        → Knex DB queries (data access layer, snake_case)
service/     → business logic (orchestrates repo + utils, maps snake→camelCase)
controller/  → HTTP layer (parse DTO + query params → call service → send response)
routes       → Express Router (maps HTTP methods/paths → controller, at module root)
```

**Data flow:** `routes` → `controller` → `service` → `repo` → `database`

**Repo rules:**
- Each repo owns ONE table — never query another module's table directly
- Always use explicit column lists (define a `COLUMNS` constant) — never `SELECT *` or `.returning("*")`
- Cross-module data access: service calls the other module's repo (e.g., auth.service imports from users.repo)

---

## Final File Tree

```
src/
├── app/
│   ├── auth/
│   │   ├── auth.errors.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.utils.ts
│   │   ├── controller/
│   │   │   └── auth.controller.ts
│   │   ├── dto/
│   │   │   └── auth.dto.ts
│   │   ├── repo/
│   │   │   └── auth.repo.ts
│   │   └── service/
│   │       └── auth.service.ts
│   ├── customer-address/
│   │   ├── address.errors.ts
│   │   ├── address.routes.ts
│   │   ├── controller/
│   │   │   └── address.controller.ts
│   │   ├── dto/
│   │   │   └── address.dto.ts
│   │   ├── repo/
│   │   │   └── address.repo.ts
│   │   └── service/
│   │       └── address.service.ts
│   ├── health/
│   │   └── health.routes.ts
│   └── users/
│       ├── users.errors.ts
│       ├── users.routes.ts
│       ├── controller/
│       │   └── users.controller.ts
│       ├── dto/
│       │   └── users.dto.ts
│       ├── repo/
│       │   └── users.repo.ts
│       └── service/
│           └── users.service.ts
├── common/
│   ├── config/
│   │   └── env.ts
│   ├── correlation/
│   │   └── correlationId.ts
│   ├── email/
│   │   └── email.ts
│   ├── error/
│   │   ├── AppError.ts
│   │   └── errorHandler.ts
│   ├── knex/
│   │   └── knex.ts
│   ├── logger/
│   │   └── logger.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── pagination/
│   │   └── pagination.ts
│   └── types/
│       └── express.d.ts
├── migrations/
│   ├── 20260214_001_create_users_table.ts
│   ├── 20260214_002_create_password_resets_table.ts
│   └── 20260214_003_create_customer_addresses_table.ts
├── scripts/
│   └── migrate.ts
├── app.ts
├── routes.ts
└── server.ts
```
