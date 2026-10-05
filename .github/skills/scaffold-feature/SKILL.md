---
name: scaffold-feature
description: Scaffold a feature module (route, components, lib logic, types, tests) following the Next.js App Router + Supabase structure in ARCHITECTURE.md.
---

# Feature Module Scaffolding Workflow

## Input Parameters
- **feature_name:** kebab-case name (e.g. `cart`, `store-pickup`, `event-qr`).

## Workflow Steps
1. **Folders:** create if missing:
   - `app/<route-group>/<feature_name>/` for pages.
   - `components/features/<feature_name>/` for presentational components.
   - `lib/<feature_name>/` for business logic and Supabase queries.
   - `types/<feature_name>.ts` for interfaces (derive row types from `types/database.ts`).
2. **UI:** reuse `@/components/ui/*`; add missing primitives with `npx shadcn@latest add <component>`. Components receive data via props only. All visible text in zh-TW.
3. **Data:** read via `lib/supabase/server.ts` in Server Components; mutate via Server Actions in `app/actions/`. Never import the service-role client into client code.
4. **Schema changes:** if new tables or columns are needed, follow the `supabase-migration` skill.
5. **Tests:** create `tests/unit/<feature_name>.test.ts` and `tests/e2e/<feature_name>.spec.ts` skeletons.

## Acceptance Criteria
- No component calls Supabase directly.
- Every exported data structure has a type in `types/`.
- Money values are integers; orders created by the feature set `channel` correctly.
