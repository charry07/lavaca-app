# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**La Vaca** is a bill-splitting mobile app (Colombia-focused). Users create "mesas" (payment sessions), invite friends via QR/code, and split bills equally, by percentage, or via roulette. The stack is a pnpm monorepo focused on mobile + shared packages with Supabase backend services.

## Commands

```bash
# Install all dependencies (run from root)
pnpm install

# Start the mobile app (Expo)
pnpm dev:mobile          # or: pnpm --filter @lavaca/mobile start

# Web mode (fast for development/testing)
cd apps/mobile && npx expo start --web

# Type-check all workspaces
pnpm typecheck

# Lint all workspaces
pnpm lint

# Clean builds
pnpm clean
```

There are no tests configured.

## Architecture

```
lavaca-app/               ← pnpm monorepo root
├── apps/
│   └── mobile/           ← @lavaca/mobile (React Native + Expo SDK 54)
└── packages/
    ├── supabase/         ← @lavaca/supabase (shared Supabase client)
    └── shared/           ← @lavaca/shared (TypeScript types + utils, no runtime deps)
```

### Backend Status

- Legacy `apps/api` was removed during Phase 2 migration cleanup.
- Mobile now uses Supabase Auth/Realtime/Postgres through `packages/supabase` and `apps/mobile/src/services/api.ts`.

### `@lavaca/mobile` — React Native App

- File-based routing via **Expo Router** (`apps/mobile/app/`).
- Root layout: [apps/mobile/app/_layout.tsx](apps/mobile/app/_layout.tsx) — `ThemeProvider → I18nProvider → AuthProvider → ToastProvider` + `AuthGuard`.
- Tabs: `(tabs)/` — Home (index), Feed, Groups, History, Profile.
- Modals: `create.tsx` (new session), `join.tsx` (join by code/QR).
- Dynamic routes: `session/[joinCode].tsx`, `group/[id].tsx`.

**Contexts (all in `apps/mobile/src/`):**

| Context | Hook | Provides |
|---|---|---|
| `auth/AuthContext.tsx` | `useAuth()` | `user`, OTP flow, `logout`, `deleteAccount`, `updateProfile` |
| `theme/ThemeContext.tsx` | `useTheme()` | `colors`, `isDark`, `toggleTheme` |
| `i18n/I18nContext.tsx` | `useI18n()` | `translate()`, `locale`, `setLocale` |
| `components/Toast.tsx` | `useToast()` | `showToast()`, `showError()`, `showSuccess()` |

**Styling rules — always follow these:**
- All colors from `useTheme().colors` — never hardcode hex values.
- Design tokens: `spacing`, `borderRadius`, `fontSize`, `fontWeight` from [apps/mobile/src/constants/theme.ts](apps/mobile/src/constants/theme.ts).
- Pattern: `const styles = createStyles(colors)` + `StyleSheet.create()` at the bottom of every screen.
- **Signature element**: all session/history/participant cards use `borderLeftWidth: 3, borderLeftColor: <statusColor>` — colored by status.

**i18n:**
- Translation keys in [apps/mobile/src/i18n/translations.ts](apps/mobile/src/i18n/translations.ts) — `es`, `en`, `pt`.
- Use `translate('key')` (destructured from `useI18n()`) for all user-facing strings. Supports `{{variable}}` interpolation.
- When adding a new key, add it to all three locales.

**API client:**
- Single client in [apps/mobile/src/services/api.ts](apps/mobile/src/services/api.ts) — exports `api` object.
- Uses Supabase as the only backend path; requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### `@lavaca/shared` — Shared Types

- [packages/shared/src/types.ts](packages/shared/src/types.ts) — `User`, `PaymentSession`, `Participant`, `Group`, `FeedEvent`, `Debt`.
- [packages/shared/src/utils.ts](packages/shared/src/utils.ts) — `formatCOP` and helpers.
- [packages/shared/src/ai.ts](packages/shared/src/ai.ts) — `AISplitRequest/Response`, `AIReminderRequest/Response` types.
- Import as `@lavaca/shared` in both workspaces.

## Key Domain Concepts

- **Mesa / Session** (`PaymentSession`): identified by `joinCode` (e.g. `VACA-Y6QM`). `splitMode`: `equal | percentage | roulette`.
- **Participant status flow**: `pending → reported → confirmed | rejected | failed`.
- **Roulette**: one participant randomly pays all (`isRouletteWinner`) or escapes (`isRouletteCoward`).
- **Payment flow**: participant calls `reportPaid` → admin calls `approvePaid` (or `markPaid` directly if admin).
- **Feed events**: auto-generated on roulette win/coward, fast payer, session close.
- **Frequent users**: `GET /api/users/:id/frequent` returns users most co-present in shared mesas — used for the participant picker.
- **Random users**: `GET /api/users/random` fills remaining participant suggestion slots when frequent < 7.

## Design System

Palette: warm espresso & dorado — inspired by a Colombian café interior at night.

| Token | Dark | Light | Purpose |
|---|---|---|---|
| `background` | `#0f0f0e` | `#f9f8f6` | Base canvas |
| `surface` | `#1a1917` | `#ffffff` | Elevated 1 |
| `surface2` | `#232220` | `#f2f0ed` | Cards, modals |
| `accent` | `#f0a830` | `#c47c10` | Dorado — amounts, avatar ring, join code |
| `primary` | `#2ed97b` | `#1a9b56` | Tropical emerald — CTAs, active states |
| `surfaceBorder` | `rgba(240,168,48,0.10)` | `rgba(160,120,60,0.13)` | Card borders |

**GlassCard** (`src/components/GlassCard.tsx`): uses `expo-blur` on native, falls back to `colors.surface2` plain `View` on web.

**Tab bar**: active tab shows dorado golden dot (`colors.accent`) below icon.

## Component Inventory

- `GlassCard` — elevated card (BlurView native / warm View web)
- `SkeletonCard` / `SkeletonLoader` — animated loading placeholders
- `EmptyState` — emoji + title + hint + optional action
- `ErrorState` — error with retry button
- `VacaLogo` — animated logo component
- `HeaderControls` — language + theme toggle in top-right
- `AppErrorBoundary` — React class error boundary at root

## Hooks

- `useSocket()` — singleton Supabase Realtime transport
- `useSessionSocket(joinCode, onUpdate)` — subscribes to `postgres_changes` for sessions/participants

## AI Copilot (Phase 0)

- `apps/mobile/src/services/ai.ts` — `aiService.suggestSplit()` and `aiService.generateReminder()`; all calls guarded by `AI_ENABLED = EXPO_PUBLIC_AI_ENABLED === 'true'`; returns `null` on any error (graceful fallback).
- `supabase/functions/ai-copilot/index.ts` — Deno Edge Function that calls GitHub Models API (`gpt-4o-mini`). Actions: `split` and `reminder`.
- Types in `packages/shared/src/ai.ts`.
- In `create.tsx`: AI suggest button appears when `AI_ENABLED`. Calls `suggestSplit` and auto-selects the mode.
- In `session/[joinCode].tsx`: Admin reminder button when session is open with pending participants. Calls `generateReminder` and opens native share sheet.
- Deploy: `supabase functions deploy ai-copilot` + set `GITHUB_MODELS_TOKEN` in Supabase secrets.

## Utilities

- `src/utils/cameraPermission.ts` — `requestCameraPermission()` for `expo-camera`

## Security Notes

- Never hardcode `ALLOWED_ORIGINS` — use env var in production
- OTP `dev_code` only in non-production responses
- Body limit 256 KB global; only avatar upload (`PUT /api/users/:id`) gets 5 MB
- Rate limiter: `send-otp` 5/10min, `resend-otp` 5/10min + 60s cooldown, `verify-otp` 10/10min
- Avatar validation: max 5.5M chars, must start with `data:image/` or `http`
- `documentId` (cédula) is validated unique and ≤ 20 chars at registration

---

## Roadmap & Implementation Plans

**All planned work lives in `docs/plans/`.** Before starting any task, read these files:

| File | Purpose |
|------|---------|
| [`docs/plans/2026-03-05-lavaca-roadmap.md`](docs/plans/2026-03-05-lavaca-roadmap.md) | Master plan — phase overview, conflict rules, cleanup rules, definition of done |
| [`docs/plans/2026-03-05-phase-1-frontend-redesign.md`](docs/plans/2026-03-05-phase-1-frontend-redesign.md) | Frontend redesign — new components, animations, web layout |
| [`docs/plans/2026-03-05-phase-2-supabase-migration.md`](docs/plans/2026-03-05-phase-2-supabase-migration.md) | Supabase migration — replaces Express + SQLite + Socket.IO |
| [`docs/plans/2026-03-05-human-ops-checklist.md`](docs/plans/2026-03-05-human-ops-checklist.md) | Manual tasks the human must do (Supabase, GitHub Models setup) |

### Rules every AI agent must follow

1. **Read the roadmap first** — understand which phase you are on and the conflict rules before touching any file.
2. **Mark tasks done** — update `- [ ]` → `- [x]` in the phase file as you complete each task.
3. **Update the roadmap status** — change `⬜ pending` → `🟨 in-progress` → `🟩 done` in the Phase Overview table.
4. **Delete what you replace** — no dead code, no unused deps, no legacy files. The cleanup checklist in the roadmap is mandatory.
5. **Log changes** — append a `## Changelog` section to the phase file noting what you did.

### Current status (as of 2026-03-24)
- Phase 0: 🟨 in-progress (AI service + Edge Function + UI integration done; pending deploy)
- Phase 1: 🟩 done
- Phase 2: 🟩 done
- Phase 3: ❌ cancelled (Vercel removed)
- Phase 4: ❌ cancelled (Stripe removed)
