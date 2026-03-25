# GitHub Copilot Instructions — La Vaca

## Mandatory Rule

**Always delete unused code, files, and dependencies.** When replacing something, delete what it replaced. No dead code, no legacy files, no stale imports, no unused deps. The cleanup is mandatory — not optional.

---

## Project Overview

**La Vaca** is a bill-splitting mobile app focused on Colombia. Users create "mesas" (payment sessions), invite friends via QR code or join code, and split bills equally, by percentage, or via roulette. Stack: pnpm monorepo with React Native + Expo frontend and Supabase backend.

---

## Monorepo Structure

```
lavaca-app/
├── frontend/             ← @lavaca/frontend (React Native + Expo SDK 54 + Expo Router)
├── packages/
│   ├── api/              ← @lavaca/api (Supabase client factory)
│   └── types/            ← @lavaca/types (TypeScript types + utils — zero runtime deps)
└── supabase/             ← Supabase CLI config, migrations, Edge Functions
```

---

## Frontend (`@lavaca/frontend`)

### Routing

- Expo Router (file-based). Routes live in `frontend/app/`.
- Tabs: `(tabs)/` — index (Home), feed, groups, history, profile.
- Modals: `create.tsx`, `join.tsx`.
- Dynamic: `session/[joinCode].tsx`, `group/[id].tsx`.

### Styling Rules

- **Never hardcode colors.** Always use `useTheme().colors`.
- Design tokens (spacing, borderRadius, fontSize, fontWeight) live in `frontend/src/constants/theme.ts`.
- Pattern per screen:
  ```typescript
  const { colors } = useTheme();
  const styles = createStyles(colors); // StyleSheet.create() at bottom of file
  ```
- Warm espresso palette: background `#0f0f0e`, accent `#f0a830` (dorado), primary `#2ed97b` (emerald).
- Signature element: left-border 3px bars (`borderLeftWidth: 3, borderLeftColor: <statusColor>`) on session/participant/history cards.

### Contexts

| File | Hook | Provides |
|---|---|---|
| `src/auth/AuthContext.tsx` | `useAuth()` | `user`, PIN auth flow, `logout`, `updateProfile` |
| `src/theme/ThemeContext.tsx` | `useTheme()` | `colors`, `isDark`, `toggleTheme` |
| `src/i18n/I18nContext.tsx` | `useI18n()` | `translate()`, `locale`, `setLocale` |
| `src/components/Toast.tsx` | `useToast()` | `showToast()`, `showError()`, `showSuccess()` |

### i18n

- All user-facing strings must use `translate('key')`. Supports `{{variable}}` interpolation.
- Translation keys are in `frontend/src/i18n/translations.ts`.
- **Always add new keys to all three locales: `es`, `en`, `pt`.**

### Shared Components

All exported from `src/components/index.ts`:

- `GlassCard` — BlurView on native, plain `View` on web.
- `SkeletonCard` / `SkeletonLoader` — animated loading placeholder.
- `EmptyState` — empty list state (emoji + title + hint + optional action).
- `ErrorState` — error state with retry button.
- `VacaLogo` — animated logo.
- `HeaderControls` — language + theme toggle.
- `AppErrorBoundary` — React error boundary at root.

### Hooks

- `useSocket()` — singleton Supabase Realtime transport.
- `useSessionSocket(joinCode, onUpdate)` — subscribes to `postgres_changes`.

### API Client

- Single client: `frontend/src/services/api.ts` — exports `api` object.
- Supabase is the only backend. Requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## Packages

### `@lavaca/api`

- `packages/api/src/index.ts` — exports `createSupabaseClient(url, key)`.
- Wraps `@supabase/supabase-js`. Import as `@lavaca/api`.

### `@lavaca/types`

- `packages/types/src/types.ts` — `User`, `PaymentSession`, `Participant`, `Group`, `FeedEvent`, `Debt`.
- `packages/types/src/utils.ts` — `formatCOP` and helpers.
- `packages/types/src/ai.ts` — AI Copilot request/response types.
- Zero runtime dependencies. Import as `@lavaca/types`.

---

## Backend (Supabase — cloud hosted)

No local backend server. All backend logic runs in Supabase:

- **Auth**: phone + PIN (6-digit numeric, stored as Supabase Auth password)
- **Database**: Postgres via Supabase
- **Realtime**: Supabase Realtime (`postgres_changes`)
- **Edge Functions**: `supabase/functions/ai-copilot/` — AI split suggestions and reminders

Schema lives in `supabase/migrations/`.

---

## Key Domain Concepts

| Concept | Notes |
|---|---|
| **Mesa / Session** | `PaymentSession` identified by `joinCode`. Split modes: `equal`, `percentage`, `roulette`. |
| **Participant** | Status flow: `pending → reported → confirmed \| rejected \| failed` |
| **Roulette** | One participant randomly selected. `isRouletteWinner` (pays all) or `isRouletteCoward` (escaped). |
| **Payment flow** | Participant calls `reportPaid` → Admin calls `approvePaid`. Or admin calls `markPaid` directly. |
| **Feed events** | Auto-generated on: roulette win/coward, fast payer, session close. |

---

## Security Rules

- Never hardcode `ALLOWED_ORIGINS` — use env var in production.
- No dev bypasses in production builds.
- Validate all inputs at system boundaries (user input, external APIs).
- No SQL injection, XSS, or command injection.

---

## Commands

```bash
pnpm install          # install all deps from root
pnpm dev              # start Expo app
pnpm typecheck        # type-check all workspaces
pnpm lint             # lint all workspaces
```

---

## TypeScript Notes

- All domain types from `@lavaca/types`.
- No `any` unless absolutely necessary — cast immediately after.
- `SkeletonLoader` width prop: `number | \`${number}%\` | 'auto'`.
