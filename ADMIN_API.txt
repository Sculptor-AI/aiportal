# Admin API Documentation

## Overview

The Admin API provides administrative functions for managing users, models, and system configuration. All admin endpoints require authentication with an admin token and are rate-limited for security.

## Authentication

### Admin Token Authentication

Admin endpoints require either:
- `X-Admin-Token` header with the admin token
- `Authorization: Bearer <admin-token>` header

### Admin Login

**Endpoint:** `POST /api/admin/auth/login`

**Description:** Authenticate as an admin and receive an admin token.

**Request Body:**
```json
{
  "username": "admin_username",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin_username",
      "role": "admin"
    },
    "adminToken": "at_abcd1234..."
  }
}
```

**Error Responses:**
- `401`: Invalid credentials or user is not an admin
- `403`: User does not have admin privileges

### Admin Logout

**Endpoint:** `POST /api/admin/auth/logout`

**Headers:** `X-Admin-Token: <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Admin logged out successfully"
}
```

## User Management

### Get All Users

**Endpoint:** `GET /api/admin/users`

**Headers:** `X-Admin-Token: <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "user1",
        "email": "user1@example.com",
        "status": "active",
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z",
        "last_login": "2025-01-01T00:00:00.000Z",
        "is_active": 1
      }
    ]
  }
}
```

### Get User by ID

**Endpoint:** `GET /api/admin/users/:userId`

**Headers:** `X-Admin-Token: <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com",
      "status": "active",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "last_login": "2025-01-01T00:00:00.000Z",
      "is_active": 1
    }
  }
}
```

**Error Responses:**
- `404`: User not found

### Update User Status

**Endpoint:** `PUT /api/admin/users/:userId/status`

**Headers:** `X-Admin-Token: <admin-token>`

**Request Body:**
```json
{
  "status": "active"
}
```

**Valid Status Values:**
- `pending`: User is awaiting approval
- `active`: User has normal access
- `admin`: User has administrative privileges

**Response:**
```json
{
  "success": true,
  "message": "User status updated successfully"
}
```

### Update User Details

**Endpoint:** `PUT /api/admin/users/:userId`

**Headers:** `X-Admin-Token: <admin-token>`

**Request Body:** (all fields optional)
```json
{
  "username": "new_username",
  "email": "new_email@example.com",
  "password": "new_password123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

**Notes:**
- Password must meet complexity requirements (8+ chars, number, special character)
- Passwords are hashed and cannot be retrieved by admins
- Username and email must be unique

## Model Management

### Get All Models

**Endpoint:** `GET /api/admin/models`

**Headers:** `X-Admin-Token: <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "openai/gpt-4",
        "originalId": "gpt-4",
        "displayName": "GPT-4",
        "provider": "openai",
        "apiModel": "gpt-4",
        "enabled": true,
        "capabilities": {
          "vision": false,
          "function_calling": true
        },
        "globalRateLimit": {
          "requests": 1000,
          "window": {
            "amount": 1,
            "unit": "hour"
          }
        },
        "userRateLimit": {
          "requests": 50,
          "window": {
            "amount": 6,
            "unit": "hours"
          }
        },
        "_loadedAt": 1704067200000
      }
    ]
  }
}
```

### Get Model by ID

**Endpoint:** `GET /api/admin/models/:modelId`

**Headers:** `X-Admin-Token: <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "model": {
      "id": "openai/gpt-4",
      "displayName": "GPT-4",
      "provider": "openai",
      "apiModel": "gpt-4",
      "enabled": true,
      "capabilities": {},
      "globalRateLimit": {},
      "userRateLimit": {}
    }
  }
}
```

**Error Responses:**
- `404`: Model not found

### Create New Model

**Endpoint:** `POST /api/admin/models`

**Headers:** `X-Admin-Token: <admin-token>`

**Request Body:**
```json
{
  "id": "custom-model",
  "displayName": "Custom Model",
  "provider": "custom",
  "apiModel": "custom-model-api",
  "enabled": true,
  "capabilities": {
    "vision": false,
    "function_calling": true
  },
  "globalRateLimit": {
    "requests": 500,
    "window": {
      "amount": 1,
      "unit": "hour"
    }
  },
  "userRateLimit": {
    "requests": 25,
    "window": {
      "amount": 6,
      "unit": "hours"
    }
  }
}
```

**Required Fields:**
- `id`: Unique identifier for the model
- `displayName`: Human-readable name
- `provider`: Provider name (creates directory structure)
- `apiModel`: Model identifier for API calls

**Response:**
```json
{
  "success": true,
  "data": {
    "modelId": "custom/custom-model"
  },
  "message": "Model created successfully"
}
```

### Update Model

**Endpoint:** `PUT /api/admin/models/:modelId`

**Headers:** `X-Admin-Token: <admin-token>`

**Request Body:** (partial update supported)
```json
{
  "displayName": "Updated Model Name",
  "enabled": false,
  "globalRateLimit": {
    "requests": 200,
    "window": {
      "amount": 1,
      "unit": "hour"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Model updated successfully"
}
```

### Delete Model

**Endpoint:** `DELETE /api/admin/models/:modelId`

**Headers:** `X-Admin-Token: <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Model deleted successfully"
}
```

## Dashboard Statistics

### Get Dashboard Stats

**Endpoint:** `GET /api/admin/dashboard/stats`

**Headers:** `X-Admin-Token: <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 100,
      "pendingUsers": 5,
      "activeUsers": 90,
      "adminUsers": 5,
      "totalApiKeys": 150
    }
  }
}
```

## Rate Limiting

All admin endpoints are rate-limited to 100 requests per 15-minute window to prevent abuse.

## Security Features

1. **Admin Token Expiration**: Admin tokens expire after 24 hours
2. **User Status Enforcement**: Pending users cannot access API or generate keys
3. **Password Security**: Passwords are hashed with bcrypt (12 rounds)
4. **Admin Verification**: Admin status is verified on each request
5. **Token Revocation**: Admin tokens can be revoked on logout
6. **Secure Admin List**: Admin users are stored in a separate JSON file

## User Status Flow

1. **New Registration**: Users start with `pending` status
2. **Admin Approval**: Admin changes status to `active` 
3. **API Access**: Only `active` and `admin` users can use the API
4. **Admin Promotion**: Admin can change status to `admin`

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Admin User Management

Admin users are managed through a combination of:
1. JSON file (`admin/admin-users.json`) for the admin list
2. Database user status field
3. Admin token system for authentication

Initial admin users should be added to the JSON file manually, then can be managed through the API.