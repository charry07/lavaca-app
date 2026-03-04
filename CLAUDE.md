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

- Entry: [apps/api/src/index.ts](apps/api/src/index.ts) — sets up Express, Socket.IO, mounts routers, exposes `io` via `app.set('io', io)`.
- DB: [apps/api/src/db.ts](apps/api/src/db.ts) — `better-sqlite3` with WAL mode; DB file at `apps/api/data/lavaca.db`. Schema is created inline on startup.
- Routes: `apps/api/src/routes/` — `sessions.ts`, `users.ts`, `groups.ts`, `feed.ts`.
- Real-time: Routes emit Socket.IO events to session rooms (keyed by `joinCode`). Client events: `join-session`, `leave-session`; server events: `session-updated`, `participant-joined`, `payment-confirmed`.
- Auth: OTP-based (phone number). OTPs stored in `otps` table; `dev_code` returned in development for easy testing.
- Run with `tsx watch` in dev; `tsc` + `node dist/index.js` in production.

### `@lavaca/mobile` — React Native App

- File-based routing via **Expo Router** (`apps/mobile/app/`).
- Root layout: [apps/mobile/app/_layout.tsx](apps/mobile/app/_layout.tsx) — wraps everything in `ThemeProvider → I18nProvider → AuthProvider → ToastProvider`, plus `AuthGuard` for protected routes.
- Tabs: `(tabs)/` — Home (index), Feed, Groups, History, Profile.
- Modals: `create.tsx` (new session), `join.tsx` (join by code).
- Dynamic routes: `session/[joinCode].tsx`, `group/[id].tsx`.

**Contexts (all in `apps/mobile/src/`):**

| Context | Hook | Provides |
|---|---|---|
| `auth/AuthContext.tsx` | `useAuth()` | `user`, OTP flow, `logout`, `deleteAccount`, `updateProfile` |
| `theme/ThemeContext.tsx` | `useTheme()` | `colors`, `isDark`, `toggleTheme` |
| `i18n/I18nContext.tsx` | `useI18n()` | `t()`, `locale`, `setLocale` |
| `components/Toast.tsx` | `useToast()` | `showToast()` |

**Styling:**
- All colors come from `useTheme().colors` (never hardcode colors).
- Design tokens (spacing, borderRadius, fontSize) live in [apps/mobile/src/constants/theme.ts](apps/mobile/src/constants/theme.ts).
- Pattern: `const s = createStyles(colors)` with `StyleSheet.create()` at bottom of each screen.

**i18n:**
- Translation keys in [apps/mobile/src/i18n/translations.ts](apps/mobile/src/i18n/translations.ts) — supports `es`, `en`, `pt`.
- Use `t('key')` for all user-facing strings. Supports `{{variable}}` interpolation.

**API client:**
- Single client in [apps/mobile/src/services/api.ts](apps/mobile/src/services/api.ts) — exports `api` object.
- Auto-detects host IP from Expo Go's `debuggerHost` (works on physical devices). Falls back to `10.0.2.2` for Android emulator.

### `@lavaca/shared` — Shared Types

- [packages/shared/src/types.ts](packages/shared/src/types.ts) — all domain interfaces: `User`, `PaymentSession`, `Participant`, `Group`, `FeedEvent`, `Debt`.
- [packages/shared/src/utils.ts](packages/shared/src/utils.ts) — `formatCOP` and other helpers.
- Import as `@lavaca/shared` in both `api` and `mobile`.

## Key Domain Concepts

- **Mesa / Session** (`PaymentSession`): identified by a short `joinCode`. Has `splitMode`: `equal | percentage | roulette`.
- **Participant**: status flow is `pending → reported → confirmed | rejected | failed`.
- **Roulette**: one participant is randomly selected as winner (pays all) or coward (escaped before spin). Tracked with `isRouletteWinner` / `isRouletteCoward` flags.
- **Payment flow**: participant calls `reportPaid` → admin calls `approvePaid` (or `markPaid` directly if admin).
- **Feed events**: auto-generated on roulette win/coward, fast payer, session close. Stored in `feed_events` + `feed_event_users` tables.

## New Architecture Notes (post-refactor)

### New Mobile Packages
```bash
# Install once (already done):
expo install expo-blur expo-linear-gradient expo-camera
pnpm add socket.io-client  # in apps/mobile
```

### Shared Components (`apps/mobile/src/components/`)
- `GlassCard` — frosted-glass card using `expo-blur` `BlurView`. Use instead of plain `View` for elevated surfaces.
- `SkeletonCard` / `SkeletonLoader` — animated loading placeholder; use in all loading states.
- `EmptyState` — empty list state with emoji, title, hint, optional action button.
- `ErrorState` — error state with retry button; replaces silent `// silently ignore` catch blocks.
- `AppErrorBoundary` — React class error boundary wrapping the root layout.
- All exported from `src/components/index.ts` barrel.

### New Hooks (`apps/mobile/src/hooks/`)
- `useSocket()` — singleton `socket.io-client` connection. Uses `transports: ['websocket']` (required for React Native).
- `useSessionSocket(joinCode, onUpdate)` — joins a Socket.IO room and fires `onUpdate` on `session-update` events.

### Utilities
- `src/utils/baseUrl.ts` — `getBaseUrl()` shared by `api.ts` and socket hooks (extracted from `api.ts`).
- `src/utils/cameraPermission.ts` — `requestCameraPermission()` wrapper for `expo-camera`.

### Design Tokens (extended)
New tokens on `ThemeColors` (in `src/constants/theme.ts`):
- `glass`, `glassBorder`, `overlay` — frosted-glass surface colors.
- `statusOpen`, `statusClosed`, `statusCancelled`, `statusPending` and their `*Bg` variants — replace all hardcoded status hex values.
- `fontWeight` constant: `regular | medium | semibold | bold | black`.

### Backend Middleware
- `apps/api/src/middleware/rateLimiter.ts` — in-memory Map-based rate limiter. Applied to `send-otp` (5/10 min) and `verify-otp` (10/10 min).
- `POST /api/users/resend-otp` — resends OTP with 60s cooldown.
- `emitSessionUpdate()` helper in `sessions.ts` — emits `session-update` Socket.IO event after every mutation.
- Dev OTP bypass (`123456`) is gated on `NODE_ENV !== 'production'`.

### QR Scanner
`join.tsx` includes a `CameraView` (expo-camera) scanner modal. `app.json` includes `NSCameraUsageDescription` for iOS and `expo-camera` in plugins.
