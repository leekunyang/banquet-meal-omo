---
name: qa-workflow
description: Run lint, type check, Vitest unit tests, and Playwright E2E tests, then iteratively fix failures until all pass.
---

# QA Verification and Remediation Workflow

## Workflow Steps
1. **Lint & types:** run `npm run lint` and `npx tsc --noEmit`. Fix every reported error.
2. **Unit tests (Vitest):** run `npm run test:unit`.
   - Read the stack trace to find the root cause; fix logic in `lib/` or update the spec only if requirements changed.
   - Money tests must assert integer TWD results (no floats).
3. **E2E tests (Playwright):**
   - Ensure the dev server and local Supabase (`npx supabase start`) are running.
   - Run `npx playwright test`; for failures, inspect traces and re-run only the failing spec: `npx playwright test <path>`.
   - Required journeys: online purchase, wedding QR order (`channel = 'qr'`), store pickup redemption.
4. **Re-run** the full suite once all individual fixes are in.

## Acceptance Criteria
- All commands exit with code `0`.
- Do not mark the task complete if any lint error, type error, unit test, or E2E spec fails.
