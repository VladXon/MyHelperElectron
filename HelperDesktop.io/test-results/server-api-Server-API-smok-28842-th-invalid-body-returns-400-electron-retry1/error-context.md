# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: server-api.spec.ts >> Server API smoke tests >> POST /api/auth with invalid body returns 400
- Location: e2e\server-api.spec.ts:13:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:3001
Call log:
  - → POST http://localhost:3001/api/auth/login
    - user-agent: Playwright/1.61.1 (x64; windows 10.0) node/24.15
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 2

```