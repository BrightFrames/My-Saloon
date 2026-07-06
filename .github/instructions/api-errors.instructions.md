---
description: "Standard API error handling, validation, and JSON response formatting."
applyTo: ["backend/**/*.js", "backend/**/*.ts"]
---

# API Error Handling & Formats

When creating or modifying backend API logic, follow these standards for generating error responses and handling failures uniformly.

## Error Response Format
Always format error responses consistently using this JSON structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_UPPERCASE",
    "message": "Human-readable description of what went wrong.",
    "details": [] // Optional array for validation specifics
  }
}
```

## Guidelines
- Avoid crashing the server. Wrap asynchronous route logic in try/catch blocks or use an async wrapper utility.
- Return appropriate HTTP status codes:
  - `400 Bad Request` for validation failures.
  - `401 Unauthorized` for authentication issues.
  - `403 Forbidden` for authorization checks.
  - `404 Not Found` when a requested resource doesn't exist.
  - `500 Internal Server Error` for unhandled exceptions or database connection issues.
- Never leak sensitive database error traces (e.g., SQL constraints, stack traces) to the client in production. Log these internally instead.
