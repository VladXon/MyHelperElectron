# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: server-api.spec.ts >> Server API smoke tests >> GET /api/health returns ok
- Location: e2e\server-api.spec.ts:6:7

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:3001
Call log:
  - → GET http://localhost:3001/api/health
    - user-agent: Playwright/1.61.1 (x64; windows 10.0) node/24.15
    - accept: */*
    - accept-encoding: gzip,deflate,br

```