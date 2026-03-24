# La Vaca — Master Roadmap

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement any phase task-by-task.

**Goal:** Transform La Vaca from a local SQLite prototype into a production-ready, deployed app with Supabase backend, professional UI, Vercel hosting, and AI-powered suggestions.

**Architecture:** Supabase replaces the entire Express backend (DB + Auth + Realtime + Storage + Edge Functions). The Expo mobile app and Expo web export share one codebase. Vercel hosts the static web export. Each phase is independently executable without conflicting with other phases.

**Tech Stack:** Expo SDK 54, React Native, Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions), Vercel, GitHub Models (AI), pnpm monorepo, TypeScript, GitHub Actions.

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
- Se migro auth movil hacia Supabase en `api.ts` y `AuthContext` con fallback seguro a API legacy.
- Se elimino configuracion ESLint accidental creada por `expo lint` para evitar basura tecnica.
- Se migro realtime de sesion a Supabase en `useSocket`/`useSessionSocket` con fallback temporal a Socket.IO.
- Se reemplazo `apps/mobile/src/services/api.ts` con capa Supabase para sesiones, grupos y feed, manteniendo fallback legado.
- Se elimino fallback Socket.IO en mobile realtime; `useSocket` y `useSessionSocket` ahora son Supabase-only.
- Se removio `socket.io-client` de `apps/mobile/package.json` y se elimino `apps/mobile/src/utils/baseUrl.ts`.
- Se removieron scripts root `api`, `dev:api` y `build:api` para desacoplar backend legacy del flujo diario.
- Se excluyo `apps/api` del workspace activo en `pnpm-workspace.yaml`.
- Se elimino el directorio `apps/api/` del repositorio como cleanup de Fase 2.
- Se elimino `.github/workflows/deploy-api.yml` por depender del backend legacy eliminado.
- Se limpiaron referencias legacy de API en README e instrucciones del repositorio para evitar desalineacion operativa.
- Se corrigio estructura/arquitectura en `README.md` para reflejar monorepo actual (mobile + shared + supabase).
- Se removio fallback HTTP legacy en `apps/mobile/src/services/api.ts`; el cliente mobile ahora requiere Supabase de forma explicita.
- Se cerro limpieza de lint en mobile hasta 0 warnings y se revalido `pnpm -r typecheck` en verde.
- Se agrego Fase 0 para integrar GitHub Copilot AI en toda la app antes de las siguientes fases funcionales.
- Se limpiaron referencias legacy de fallback/API local en README e instrucciones para mantener coherencia Supabase-only.
- Se revalidaron `pnpm -r typecheck` y `pnpm lint` en verde luego del ajuste documental.
- Se agrego `.env.example` en raiz para estandarizar bootstrap de entorno entre devs/CI.
- Fase 2 continua `in-progress` por pendientes operativos de Supabase (link/config push/RPC/Edge Functions).
- Se completo `supabase init` y ya existe `supabase/config.toml`.
- Se agrego migracion de RPC `get_frequent_users`, quedando pendiente su despliegue por falta de `supabase link`.
- Se revalidaron gates tecnicos (`pnpm -r typecheck`, `pnpm lint`) en verde.
- Se verifico bloqueo operativo de credenciales: sin `.env.local`, sin `SUPABASE_ACCESS_TOKEN` y sin autenticacion CLI para listar proyectos.
- Se confirmo `apps/mobile/.env.local` presente con vars publicas de Supabase, reduciendo el bloqueo al plano operativo.
- El cierre de Fase 2 sigue bloqueado por falta de autenticacion CLI (`SUPABASE_ACCESS_TOKEN` o `supabase login`) y credencial de DB para `supabase link`/`db push`.
- Se revalidaron otra vez `pnpm -r typecheck` y `pnpm lint` en verde tras cambios recientes.
- Se reconfirmo bloqueo de cierre en Fase 2: sin `SUPABASE_ACCESS_TOKEN` ni `SUPABASE_DB_PASSWORD`, y `supabase projects list` falla por falta de login/token.
- Se sincronizo estado documental de Fase 3 a `in-progress` para mantener consistencia con la tabla de fases del roadmap.
- Se completo cierre operativo de Fase 2: `supabase link`, `supabase db push` y migraciones remotas sincronizadas (`202603050001`, `202603060001`).
- Se separo configuracion de entorno: `apps/mobile/.env.local` para vars publicas y `.env.cli.local` en raiz para secretos de CLI.
- Fase 2 queda marcada como `done`.

Last sync: 2026-03-06 (update 19)

---

## Phase Dependency Map

```
Phase 0: Copilot AI Integration ──────────────────────────► (recommended first)
Phase 1: Frontend Redesign  ──────────────────────────────► (no deps, start anytime)
Phase 2: Supabase Migration ──────────────────────────────► (no deps, start anytime)
Phase 5: Refactoring        ──── depends on Phase 1+2 ────► (after Phase 1+2)
```

**Phase 0 is the AI foundation and is recommended first.** Phase 1 and Phase 2 can run in parallel. Phase 5 refactors mobile code — runs after Phase 1+2 so there's a stable base to clean up.

---

## Phase Overview

| Phase | File | Owner | Depends On | Status |
|-------|------|-------|------------|--------|
| 0 — Copilot AI Integration | [phase-0-copilot-ai-integration.md](./2026-03-06-phase-0-copilot-ai-integration.md) | AI Agent E | none | 🟨 in-progress |
| 1 — Frontend Redesign | [phase-1-frontend-redesign.md](./2026-03-05-phase-1-frontend-redesign.md) | AI Agent A | none | 🟩 done |
| 2 — Supabase Migration | [phase-2-supabase-migration.md](./2026-03-05-phase-2-supabase-migration.md) | AI Agent B | none | 🟩 done |
| 5 — Refactoring & Quality | [phase-5-refactoring.md](./2026-03-06-phase-5-refactoring.md) | AI Agent F | Phase 1+2 | 🟩 done |

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

---

## Environment Variables Required

Every agent must know these exist. Set them in local `.env.local`:

```bash
# Supabase (Phase 2)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # server-side only

# AI Copilot (Phase 0)
EXPO_PUBLIC_AI_ENABLED=false           # set to true to enable AI features
GITHUB_MODELS_TOKEN=...                # set in Supabase Edge Function secrets
GITHUB_MODELS_MODEL=gpt-4o-mini

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
7. Se elimino codigo, archivos y dependencias innecesarias de la fase
8. This roadmap's Phase Overview table shows `🟩 done` for the phase
9. PR created with description of what changed and what was deleted
