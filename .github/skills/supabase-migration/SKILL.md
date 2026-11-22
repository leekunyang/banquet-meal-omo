---
name: supabase-migration
description: Safely add or change Supabase tables, RLS policies, and stock/order DB functions with a migration, regenerated types, and policy tests.
---

# Supabase Migration Workflow

## Workflow Steps
1. **Review:** read the data model in `docs/ARCHITECTURE.md` section 4 and domain rules in section 5 before changing schema.
2. **Create migration:** `npx supabase migration new <description>`; write SQL in the generated file under `supabase/migrations/`.
   - Money columns: `integer` (TWD). Never `numeric` with decimals or `float`.
   - Enable RLS on every new table: `alter table <t> enable row level security;`
   - Write least-privilege policies (owner via `auth.uid()`, staff/admin via role claim). `using (true)` for write is banned.
   - Stock changes go through `security definer` functions (`reserve_stock`, `commit_stock`, `release_stock`) that lock rows (`select ... for update`) inside one transaction.
3. **Apply locally:** `npx supabase db reset` (re-runs migrations and `seed.sql`).
4. **Regenerate types:** `npx supabase gen types typescript --local > types/database.ts`.
5. **Test policies:** add tests proving an anonymous user and a different member cannot read or modify another member's orders or profile, and that concurrent orders cannot oversell stock.
6. **Docs:** update the table list in `docs/ARCHITECTURE.md` if tables or columns changed.

## Acceptance Criteria
- Migration applies cleanly on a fresh `db reset`.
- `types/database.ts` is regenerated and the project type-checks.
- RLS and oversell tests pass.
