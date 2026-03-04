# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**La Vaca** is a bill-splitting mobile app (Colombia-focused). Users create "mesas" (payment sessions), invite friends via QR/code, and split bills equally, by percentage, or via roulette. The stack is a pnpm monorepo with three workspaces.

## Commands

```bash
# Install all dependencies (run from root)
pnpm install

# Start the mobile app (Expo)
pnpm dev:mobile          # or: pnpm --filter @lavaca/mobile start

# Start the API backend with hot-reload (port 3001)
pnpm dev:api             # or: pnpm --filter @lavaca/api dev

# Web mode (fast for development/testing)
cd apps/mobile && npx expo start --web

# Build API for production
pnpm build:api

# Type-check all workspaces
pnpm typecheck

# Lint all workspaces
pnpm lint

# Clean builds
pnpm clean
```

There are no tests configured. API runs on `http://localhost:3001`; verify with `curl http://localhost:3001/health`.

## Architecture

```
lavaca-app/               ← pnpm monorepo root
├── apps/
│   ├── api/              ← @lavaca/api  (Express + Socket.IO + SQLite)
│   └── mobile/           ← @lavaca/mobile (React Native + Expo SDK 54)
└── packages/
    └── shared/           ← @lavaca/shared (TypeScript types + utils, no runtime deps)
```

### `@lavaca/api` — Backend

- Entry: [apps/api/src/index.ts](apps/api/src/index.ts) — Express + Socket.IO + helmet + CORS env-aware.
- DB: [apps/api/src/db.ts](apps/api/src/db.ts) — `better-sqlite3` WAL mode; DB at `apps/api/data/lavaca.db`.
- Routes: `apps/api/src/routes/` — `sessions.ts`, `users.ts`, `groups.ts`, `feed.ts`.
- Real-time: Routes emit Socket.IO events to rooms keyed by `joinCode`. Client: `join-session`, `leave-session`; server: `session-update`.
- Auth: OTP-based (phone). `dev_code` only returned when `NODE_ENV !== 'production'`. Dev bypass code `123456`.
- Security: `helmet`, CORS restricted by `ALLOWED_ORIGINS` env in production, body limit 256 KB globally (PUT `/api/users/:id` overrides to 5 MB for avatar).
- Run: `tsx watch` dev; `tsc` + `node dist/index.js` production.

**Key API endpoints (users):**
- `GET /api/users/random?limit=N&exclude=id1,id2` — random users for participant suggestions
- `GET /api/users/:id/frequent?limit=7` — users most frequently sharing mesas with `:id`
- `GET /api/users/search?q=` — search by name/username/phone/document (min 2 chars)
- `PUT /api/users/:id` — update profile; validates avatarUrl format + size (≤ 5.5M chars base64)

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
| `i18n/I18nContext.tsx` | `useI18n()` | `t()`, `locale`, `setLocale` |
| `components/Toast.tsx` | `useToast()` | `showToast()`, `showError()`, `showSuccess()` |

**Styling rules — always follow these:**
- All colors from `useTheme().colors` — never hardcode hex values.
- Design tokens: `spacing`, `borderRadius`, `fontSize`, `fontWeight` from [apps/mobile/src/constants/theme.ts](apps/mobile/src/constants/theme.ts).
- Pattern: `const s = createStyles(colors)` + `StyleSheet.create()` at the bottom of every screen.
- **Signature element**: all session/history/participant cards use `borderLeftWidth: 3, borderLeftColor: <statusColor>` — colored by status.

**i18n:**
- Translation keys in [apps/mobile/src/i18n/translations.ts](apps/mobile/src/i18n/translations.ts) — `es`, `en`, `pt`.
- Use `t('key')` for all user-facing strings. Supports `{{variable}}` interpolation.
- When adding a new key, add it to all three locales.

**API client:**
- Single client in [apps/mobile/src/services/api.ts](apps/mobile/src/services/api.ts) — exports `api` object.
- Auto-detects host from Expo Go's `debuggerHost`; falls back to `10.0.2.2` for Android emulator.

### `@lavaca/shared` — Shared Types

- [packages/shared/src/types.ts](packages/shared/src/types.ts) — `User`, `PaymentSession`, `Participant`, `Group`, `FeedEvent`, `Debt`.
- [packages/shared/src/utils.ts](packages/shared/src/utils.ts) — `formatCOP` and helpers.
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

- `useSocket()` — singleton Socket.IO connection (`transports: ['websocket']`)
- `useSessionSocket(joinCode, onUpdate)` — joins room, fires callback on `session-update`

## Utilities

- `src/utils/baseUrl.ts` — `getBaseUrl()` used by `api.ts` and socket hooks
- `src/utils/cameraPermission.ts` — `requestCameraPermission()` for `expo-camera`

## Security Notes

- Never hardcode `ALLOWED_ORIGINS` — use env var in production
- OTP `dev_code` only in non-production responses
- Body limit 256 KB global; only avatar upload (`PUT /api/users/:id`) gets 5 MB
- Rate limiter: `send-otp` 5/10min, `resend-otp` 5/10min + 60s cooldown, `verify-otp` 10/10min
- Avatar validation: max 5.5M chars, must start with `data:image/` or `http`
- `documentId` (cédula) is validated unique and ≤ 20 chars at registration
