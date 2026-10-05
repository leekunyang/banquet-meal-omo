# Project Instructions
- App: OMO e-commerce selling wedding-banquet best-seller dishes as frozen ready-meal packs (online shop + banquet-hall on-site QR/pickup). Details: `ARCHITECTURE.md`.
- Stack: TypeScript (strict, no `any`), Next.js App Router, Tailwind CSS, shadcn/ui, Supabase (Postgres, Auth, Storage), ECPay payments, Vercel.
- Structure: routes in `app/`, UI primitives in `components/ui/`, feature components in `components/features/`, business logic and DB access in `lib/`.
- Supabase boundary: browser client `lib/supabase/client.ts`; server client `lib/supabase/server.ts`; service-role key only in Server Actions/Route Handlers. Every table has RLS.
- Domain: money is integer TWD (no floats); stock changes only via DB functions in a transaction; every order records `channel` (`online` | `qr` | `store`).
- UI text: Traditional Chinese (zh-TW, Taiwan phrasing). Code, comments, commits: English.
- Deps: use shadcn/ui and `cn()`; no new npm packages without team approval.
- Verify: `npm run lint`, `npm run test:unit`, `npx playwright test` before PRs. Never commit `.env*` or secrets.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`); atomic changes.
