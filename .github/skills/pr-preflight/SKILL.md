---
name: pr-preflight
description: Pre-flight checks before pushing - clean diff, no secrets, Conventional Commits, and a PR description with verification evidence.
---

# Pull Request Pre-flight Workflow

## Workflow Steps
1. **Diff sanitization:**
   - Run `git status` and `git diff --staged`.
   - Remove debug leftovers (`console.log`, commented-out dead code, temporary mocks).
   - Confirm no `.env*` (except `.env.example`), Supabase service-role key, or ECPay HashKey/HashIV is tracked.
2. **Conventional Commits:** atomic commits with `feat:`, `fix:`, `refactor:`, `test:`, or `docs:`.
3. **Docs sync:** if schema, domain rules, or stack changed, update `ARCHITECTURE.md`. Keep `.github/copilot-instructions.md` within 10 lines.
4. **PR description:**
   - Read `git log -n 5 --oneline`.
   - Write a zh-TW title and body: what changed, why, linked issue (`Fixes #<n>`), mobile screenshots for UI changes.
   - Include a checklist confirming `qa-workflow` passed.

## Acceptance Criteria
- Branch name follows `feat/<name>`, `fix/<name>`, or `docs/<name>`.
- No secrets in the diff; `qa-workflow` passed.
