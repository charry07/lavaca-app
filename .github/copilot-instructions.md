# GitHub Copilot Instructions — La Vaca

## Project Overview

**La Vaca** is a bill-splitting mobile app focused on Colombia. Users create "mesas" (payment sessions), invite friends via QR code or join code, and split bills equally, by percentage, or via roulette. The stack is a **pnpm monorepo** focused on mobile + shared packages with Supabase backend services.

---

## Monorepo Structure

```
lavaca-app/
├── apps/
│   └── mobile/     ← @lavaca/mobile (React Native + Expo SDK 54 + Expo Router)
└── packages/
  ├── supabase/   ← @lavaca/supabase (Supabase client wrapper)
    └── shared/     ← @lavaca/shared (TypeScript types + utils — no runtime deps)
```

Import shared types as `@lavaca/shared` in mobile code.

---

## Mobile App (`@lavaca/mobile`)

### Routing

- Expo Router (file-based). Routes live in `apps/mobile/app/`.
- Tabs: `(tabs)/` — index (Home), feed, groups, history, profile.
- Modals: `create.tsx`, `join.tsx`.
- Dynamic: `session/[joinCode].tsx`, `group/[id].tsx`.

### Styling Rules

- **Never hardcode colors.** Always use `useTheme().colors`.
- Design tokens (spacing, borderRadius, fontSize, fontWeight) live in `apps/mobile/src/constants/theme.ts`.
- Pattern per screen:
  ```typescript
  const { colors } = useTheme();
  // ...
  const styles = StyleSheet.create({ ... });
  ```
- Warm espresso palette: background `#0f0f0e`, accent `#f0a830` (dorado), primary `#2ed97b` (emerald).
- Signature element: left-border accent bars (`borderLeftWidth: 3, borderLeftColor: colors.accent`) on elevated cards.

### Contexts

| Context file | Hook | Provides |
|---|---|---|
| `src/auth/AuthContext.tsx` | `useAuth()` | `user`, OTP flow, `logout`, `updateProfile` |
| `src/theme/ThemeContext.tsx` | `useTheme()` | `colors`, `isDark`, `toggleTheme` |
| `src/i18n/I18nContext.tsx` | `useI18n()` | `t()`, `locale`, `setLocale` |
| `src/components/Toast.tsx` | `useToast()` | `showToast()` |

### i18n

- All user-facing strings must use `t('key')`. Supports `{{variable}}` interpolation.
- Translation keys are in `apps/mobile/src/i18n/translations.ts`.
- **Always add new keys to all three locales: `es`, `en`, `pt`.**

### Shared Components

All exported from `src/components/index.ts`:

- `GlassCard` — frosted-glass card (expo-blur). Use for elevated surfaces instead of plain `View`.
- `SkeletonCard` / `SkeletonLoader` — animated loading placeholder. Use in all loading states.
- `EmptyState` — empty list state (emoji + title + hint + optional action).
- `ErrorState` — error state with retry button. Never silently swallow errors.
- `AppErrorBoundary` — React error boundary wrapping the root layout.

### Hooks

- `useSocket()` — singleton Supabase realtime transport.
- `useSessionSocket(joinCode, onUpdate)` — subscribes to Supabase `postgres_changes` and refreshes session state.

### API Client

- Single client: `apps/mobile/src/services/api.ts` — exports `api` object.
- Supabase is the only backend path; mobile requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## Backend Status

- Legacy local backend (`apps/api`) was removed during Phase 2 cleanup.
- Active backend path is Supabase (Auth/Postgres/Realtime).

Supabase policies and schema live under `supabase/migrations/`.

---

## Key Domain Concepts

| Concept | Notes |
|---|---|
| **Mesa / Session** | `PaymentSession` identified by short `joinCode`. Split modes: `equal`, `percentage`, `roulette`. |
| **Participant** | Status flow: `pending → reported → confirmed \| rejected \| failed` |
| **Roulette** | One participant is randomly selected. `isRouletteWinner` (pays all) or `isRouletteCoward` (escaped). |
| **Payment flow** | Participant: `reportPaid` → Admin: `approvePaid`. Or admin calls `markPaid` directly. |
| **Feed events** | Auto-generated on: roulette win/coward, fast payer, session close. |
| **Frequent users** | `GET /api/users/:id/frequent?limit=7` — users with most shared mesas. |
| **Random users** | `GET /api/users/random?limit=N&exclude=id1,id2` — random fill excluding given IDs. |

---

## Security Rules

- Validate all inputs at route level (type coercion, range checks, string trim).
- Never trust user-supplied IDs — validate against DB.
- Dev OTP bypass (`123456`) is gated on `NODE_ENV !== 'production'`.
- `dev_code` field in OTP responses is only for development.
- CORS restricted to trusted origins in production.
- Body size limited to 256 KB.

---

## Commands

```bash
pnpm install              # install all deps from root
pnpm dev:mobile           # start Expo mobile app
pnpm typecheck            # type-check all workspaces
pnpm lint                 # lint all workspaces
```

---

## TypeScript Notes

- `SkeletonLoader` width prop: `number | \`${number}%\` | 'auto'` (not plain `string` — Animated.View is strict).
- All domain types from `@lavaca/shared` — `User`, `PaymentSession`, `Participant`, `Group`, `FeedEvent`, `Debt`.
- No `any` unless wrapping `better-sqlite3` raw row results (cast immediately after).
