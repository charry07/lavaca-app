# La Vaca — Master Roadmap

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement any phase task-by-task.

**Goal:** Transform La Vaca from a local SQLite prototype into a production-ready, deployed app with Supabase backend, professional UI, Vercel hosting, and Stripe payments.

**Architecture:** Supabase replaces the entire Express backend (DB + Auth + Realtime + Storage + Edge Functions). The Expo mobile app and Expo web export share one codebase. Vercel hosts the web export + thin Stripe webhook serverless function. Each phase is independently executable without conflicting with other phases.

**Tech Stack:** Expo SDK 54, React Native, Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions), Vercel, Stripe, pnpm monorepo, TypeScript, GitHub Actions.

## Plan Hygiene (Anti-Basura)

- Cada cambio real de codigo debe reflejarse el mismo dia en todos los `.md` de `docs/plans/`.
- No se agregan archivos, dependencias, scripts o componentes sin uso comprobable.
- Antes de crear algo nuevo, se debe intentar reutilizar o simplificar lo existente.
- Cada fase debe incluir limpieza de codigo innecesario como tarea obligatoria.

## Shared Change Log (2026-03-05)

- Se creo `packages/supabase/` con cliente base y scripts de typecheck/build.
- Se creo `supabase/migrations/202603050001_initial_schema.sql` como baseline.
- Se creo `supabase/functions/README.md` para estructura de Edge Functions.
- Se agregaron/normalizaron planes de fase 2, 3 y 4.
- Se agrego checklist de operaciones humanas: `2026-03-05-human-ops-checklist.md`.
- Se valido estado tecnico con `pnpm -r typecheck` en verde.
- Estado actual: Fase 2 en progreso; Fases 1, 3 y 4 pendientes.

Last sync: 2026-03-05

---

## Phase Dependency Map

```
Phase 1: Frontend Redesign  ──────────────────────────────► (no deps, start anytime)
Phase 2: Supabase Migration ──────────────────────────────► (no deps, start anytime)
Phase 3: Vercel Deployment  ──── depends on Phase 2 ──────► (after Phase 2)
Phase 4: Stripe Integration ──── depends on Phase 2+3 ────► (after Phase 2+3)
```

**Phase 1 and Phase 2 can run in parallel.** Phase 3 needs Phase 2 complete. Phase 4 needs Phase 2+3.

---

## Phase Overview

| Phase | File | Owner | Depends On | Status |
|-------|------|-------|------------|--------|
| 1 — Frontend Redesign | [phase-1-frontend-redesign.md](./2026-03-05-phase-1-frontend-redesign.md) | AI Agent A | none | ⬜ pending |
| 2 — Supabase Migration | [phase-2-supabase-migration.md](./2026-03-05-phase-2-supabase-migration.md) | AI Agent B | none | 🟨 in-progress |
| 3 — Vercel Deployment | [phase-3-vercel-deployment.md](./2026-03-05-phase-3-vercel-deployment.md) | AI Agent C | Phase 2 | ⬜ pending |
| 4 — Stripe Integration | [phase-4-stripe-integration.md](./2026-03-05-phase-4-stripe-integration.md) | AI Agent D | Phase 2+3 | ⬜ pending |

Human-only operations checklist: [2026-03-05-human-ops-checklist.md](./2026-03-05-human-ops-checklist.md)

---

## Conflict Prevention Rules

These rules prevent agents from stepping on each other:

### Phase 1 (Frontend) — ONLY touches:
- `apps/mobile/app/**/*.tsx` — screen files
- `apps/mobile/src/components/**` — UI components
- `apps/mobile/src/constants/theme.ts` — design tokens only
- `apps/mobile/src/i18n/translations.ts` — new UI strings only
- `package.json` of `@lavaca/mobile` — new UI deps only (`react-native-reanimated`)

### Phase 1 — NEVER touches:
- `apps/api/**` — backend
- `apps/mobile/src/services/api.ts` — API client
- `apps/mobile/src/auth/**` — auth logic
- `packages/shared/**` — shared types

### Phase 2 (Supabase) — ONLY touches:
- `packages/supabase/**` — new workspace (create it)
- `apps/mobile/src/services/api.ts` — swap to Supabase client
- `apps/mobile/src/auth/AuthContext.tsx` — swap to Supabase Auth
- `apps/mobile/src/hooks/useSocket.ts` — swap to Supabase Realtime
- `supabase/**` — Supabase config, migrations, edge functions
- `apps/api/**` — mark for deletion at end of phase

### Phase 2 — NEVER touches:
- `apps/mobile/app/**/*.tsx` — screen UI
- `apps/mobile/src/components/**` — UI components
- `apps/mobile/src/constants/theme.ts`

### Phase 3 (Vercel) — ONLY touches:
- `vercel.json` — root
- `.github/workflows/**` — CI/CD
- `apps/vercel-functions/**` — new serverless functions
- `.env.example` files
- Root `package.json` — build scripts only

### Phase 3 — NEVER touches:
- `apps/mobile/**` — any mobile code
- `supabase/**` — Supabase config
- `packages/**`

### Phase 4 (Stripe) — ONLY touches:
- `supabase/migrations/**` — new stripe tables only
- `supabase/functions/stripe-*/**` — new edge functions
- `apps/mobile/app/(tabs)/premium.tsx` — new screen
- `apps/mobile/src/services/stripe.ts` — new service
- `apps/vercel-functions/api/stripe-webhook.ts` — webhook handler

### Phase 4 — NEVER touches:
- Existing screens (except adding premium badge to profile)
- Existing Supabase functions
- `vercel.json`

---

## Environment Variables Required

Every agent must know these exist. Set them in Vercel dashboard and local `.env`:

```bash
# Supabase (Phase 2)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Stripe (Phase 4)
STRIPE_SECRET_KEY=sk_live_...          # server-side only (Vercel Functions)
STRIPE_WEBHOOK_SECRET=whsec_...        # server-side only
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # client-side safe

# App
EXPO_PUBLIC_APP_ENV=production
```

---

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `apps/mobile/src/constants/theme.ts` | All design tokens — colors, spacing, typography |
| `apps/mobile/src/i18n/translations.ts` | All strings in es/en/pt |
| `apps/mobile/src/services/api.ts` | API client (Phase 2 replaces this) |
| `apps/mobile/src/auth/AuthContext.tsx` | Auth state (Phase 2 replaces internals) |
| `packages/shared/src/types.ts` | Shared TypeScript types |
| `supabase/migrations/` | DB schema (Phase 2 creates this) |
| `supabase/functions/` | Edge Functions (Phase 2 creates this) |
| `vercel.json` | Vercel config (Phase 3 creates this) |
| `.github/workflows/ci.yml` | CI/CD (Phase 3 updates this) |

---

## Rule: Every Agent Must Update the Docs

**This is mandatory — not optional.** After completing each task:

1. **Mark the task as done** in the phase plan file (`- [x]` instead of `- [ ]`)
2. **Update the phase status** in this roadmap's Phase Overview table (`🟩 done`, `🟨 in-progress`, `⬜ pending`)
3. **Log what changed** in the phase file's last section (append a "## Changelog" block at the bottom if it doesn't exist yet)
4. **If a file path or behavior changes from the plan**, update the plan — future agents must not follow outdated instructions

No exceptions. A phase is not done until the docs reflect reality.

---

## Rule: Delete Unused Files and Dependencies

**Every phase must clean up after itself.** Before marking a phase complete:

### Remove unused dependencies
```bash
# Check for unused packages before and after your phase
pnpm --filter <workspace> list --depth 0
```

Remove any package that is no longer imported anywhere in the workspace:
```bash
pnpm --filter @lavaca/<workspace> remove <package-name>
```

### Delete dead files
- If a file was replaced by a new implementation, delete the old one — do not leave it with "// legacy" comments
- If a config file (like `apps/api/`) gets migrated, delete the entire directory
- If a hook or utility is no longer used, delete it and grep to confirm zero remaining imports:
  ```bash
  grep -r "useSocket\|socket\.io" apps/mobile/src --include="*.ts" --include="*.tsx"
  ```

### Phase-specific cleanup checklist

**Phase 1 cleanup:**
- Remove any inline style objects that duplicate `StyleSheet.create` entries
- Remove unused imports in every modified screen
- Check for any hardcoded hex colors introduced during redesign: `grep -r "#[0-9a-fA-F]" apps/mobile/app`

**Phase 2 cleanup:**
- Delete `apps/api/` entirely (entire Express backend)
- Remove `socket.io-client` from `apps/mobile/package.json`
- Remove `apps/api` from `pnpm-workspace.yaml`
- Remove `dev:api`, `build:api` scripts from root `package.json`
- Delete `apps/mobile/src/utils/baseUrl.ts` (only needed for Express URL detection)
- Delete `apps/mobile/src/hooks/useSocket.ts` singleton (replaced by Supabase Realtime)

**Phase 3 cleanup:**
- Remove any test/debug console.log statements from serverless functions
- Confirm `.gitignore` excludes `apps/mobile/dist/` and `.vercel/`

**Phase 4 cleanup:**
- Remove the webhook placeholder comment from `stripe-webhook.ts` (it's now implemented)
- Confirm no Stripe secret keys are in any committed file

---

## Definition of Done (per phase)

A phase is **complete** when ALL of these are true:
1. `pnpm typecheck` → zero errors
2. `pnpm lint` → zero warnings
3. No unused dependencies in modified workspaces
4. No dead/unreferenced files left behind
5. No hardcoded colors (always `colors.X` from `useTheme()`)
6. All new strings added to es + en + pt in `translations.ts`
7. Phase checklist in phase plan file is fully checked off (`- [x]`)
8. This roadmap's Phase Overview table shows `🟩 done` for the phase
9. PR created with description of what changed and what was deleted
