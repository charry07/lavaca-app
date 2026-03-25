# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**La Vaca** is a bill-splitting mobile app (Colombia-focused). Users create "mesas" (payment sessions), invite friends via QR/code, and split bills equally, by percentage, or via roulette. The stack is a pnpm monorepo focused on mobile + shared packages with Supabase backend services.

## Commands

```bash
# Install all dependencies (run from root)
pnpm install

# Start the app (Expo)
pnpm dev                         # or: cd frontend && npx expo start

# Web mode (fast for development/testing)
cd frontend && npx expo start --web

# Type-check all workspaces
pnpm typecheck

# Lint all workspaces
pnpm lint
```

There are no tests configured.

## Architecture

```
lavaca-app/               ← pnpm monorepo root
├── frontend/             ← @lavaca/frontend (React Native + Expo SDK 54)
├── packages/
│   ├── api/              ← @lavaca/api (Supabase client factory)
│   └── types/            ← @lavaca/types (TypeScript types + utils, zero runtime deps)
└── supabase/             ← Supabase CLI config, migrations, Edge Functions
```

### `@lavaca/frontend` — React Native App

- File-based routing via **Expo Router** (`frontend/app/`).
- Root layout: [frontend/app/_layout.tsx](frontend/app/_layout.tsx) — `ThemeProvider → I18nProvider → AuthProvider → ToastProvider` + `AuthGuard`.
- Tabs: `(tabs)/` — Home (index), Feed, Groups, History, Profile.
- Modals: `create.tsx` (new session), `join.tsx` (join by code/QR).
- Dynamic routes: `session/[joinCode].tsx`, `group/[id].tsx`.

**Contexts (all in `frontend/src/`):**

| Context | Hook | Provides |
|---|---|---|
| `auth/AuthContext.tsx` | `useAuth()` | `user`, PIN auth flow, `logout`, `deleteAccount`, `updateProfile` |
| `theme/ThemeContext.tsx` | `useTheme()` | `colors`, `isDark`, `toggleTheme` |
| `i18n/I18nContext.tsx` | `useI18n()` | `translate()`, `locale`, `setLocale` |
| `components/Toast.tsx` | `useToast()` | `showToast()`, `showError()`, `showSuccess()` |

**Styling rules — always follow these:**
- All colors from `useTheme().colors` — never hardcode hex values.
- Design tokens: `spacing`, `borderRadius`, `fontSize`, `fontWeight` from [frontend/src/constants/theme.ts](frontend/src/constants/theme.ts).
- Pattern: `const styles = createStyles(colors)` + `StyleSheet.create()` at the bottom of every screen.
- **Signature element**: all session/history/participant cards use `borderLeftWidth: 3, borderLeftColor: <statusColor>` — colored by status.

**i18n:**
- Translation keys in [frontend/src/i18n/translations.ts](frontend/src/i18n/translations.ts) — `es`, `en`, `pt`.
- Use `translate('key')` (destructured from `useI18n()`) for all user-facing strings. Supports `{{variable}}` interpolation.
- When adding a new key, add it to all three locales.

**API client:**
- Single client in [frontend/src/services/api.ts](frontend/src/services/api.ts) — exports `api` object.
- Uses Supabase as the only backend path; requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### `@lavaca/api` — Supabase Client

- [packages/api/src/index.ts](packages/api/src/index.ts) — exports `createSupabaseClient(url, key)`.
- Wraps `@supabase/supabase-js`. Import as `@lavaca/api` from the frontend.

### `@lavaca/types` — Shared Types

- [packages/types/src/types.ts](packages/types/src/types.ts) — `User`, `PaymentSession`, `Participant`, `Group`, `FeedEvent`, `Debt`.
- [packages/types/src/utils.ts](packages/types/src/utils.ts) — `formatCOP` and helpers.
- Zero runtime dependencies. Import as `@lavaca/types`.

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

## Utilities

- `frontend/src/utils/cameraPermission.ts` — `requestCameraPermission()` for `expo-camera`

## Security Notes

- Never hardcode `ALLOWED_ORIGINS` — use env var in production
- OTP `dev_code` only in non-production responses
- Body limit 256 KB global; only avatar upload (`PUT /api/users/:id`) gets 5 MB
- Rate limiter: `send-otp` 5/10min, `resend-otp` 5/10min + 60s cooldown, `verify-otp` 10/10min
- Avatar validation: max 5.5M chars, must start with `data:image/` or `http`
- `documentId` (cédula) is validated unique and ≤ 20 chars at registration

