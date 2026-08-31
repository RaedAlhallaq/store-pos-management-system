# Store POS & Management System — REST API Specification

## 1. Overview & General Standards

- **Base URL:** `http://127.0.0.1:8000/api`
- **Authentication Scheme:** HTTP Bearer Token (`Authorization: Bearer <token>`) via Laravel Sanctum
- **Content-Type:** `application/json`
- **Accept:** `application/json`

---

## 2. Standard Response Envelope

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Validation Error (HTTP 422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["البريد الإلكتروني مطلوب (Email is required)."]
  }
}
```

### Unauthorized Error (HTTP 401)
```json
{
  "message": "Unauthenticated."
}
```

---

## 3. Endpoints

### 3.1. System Health
#### `GET /health`
- **Auth Required:** No
- **Description:** Verifies API health and MySQL database connection latency.
- **Response Example:**
```json
{
  "status": "ok",
  "application": "Store POS API",
  "version": "1.0.0",
  "environment": "local",
  "database": {
    "status": "connected",
    "latency_ms": 8.47,
    "connection": "mysql"
  },
  "timestamp": "2026-08-30T07:52:01+00:00"
}
```

---

### 3.2. Authentication
#### `POST /auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "owner@storepos.local",
  "password": "password123",
  "device_name": "POS Terminal Main"
}
```
- **Response Example (HTTP 200):**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح (Login successful).",
  "token": "2|mr8kkS8Fxis0GHOwYd1qlv3my20mFgNLyMGNYsql7179d3eb",
  "user": {
    "id": 1,
    "name": "Store Owner (مدير المتجر)",
    "email": "owner@storepos.local",
    "role": "admin",
    "status": "active",
    "created_at": "2026-08-30T07:51:17+00:00"
  }
}
```

#### `GET /auth/user`
- **Auth Required:** Yes (`Bearer <token>`)
- **Description:** Retrieves currently authenticated user profile.
- **Response Example (HTTP 200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Store Owner (مدير المتجر)",
    "email": "owner@storepos.local",
    "role": "admin",
    "status": "active",
    "created_at": "2026-08-30T07:51:17+00:00"
  }
}
```

#### `POST /auth/logout`
- **Auth Required:** Yes (`Bearer <token>`)
- **Description:** Revokes current personal access token.
- **Response Example (HTTP 200):**
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح (Logout successful)."
}
```
