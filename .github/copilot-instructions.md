# GitHub Copilot Instructions — La Vaca

> **Comprehensive guide for GitHub Copilot when working in the La Vaca codebase.**

---

## 🚨 Mandatory Rule

**Always delete unused code, files, and dependencies.** When replacing something, delete what it replaced. No dead code, no legacy files, no stale imports, no unused deps. The cleanup is mandatory — not optional.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Commands](#commands)
4. [Architecture](#architecture)
5. [Frontend Deep-Dive](#frontend-deep-dive)
6. [Backend & Domain](#backend--domain)
7. [Code Conventions](#code-conventions)
8. [Development Workflow](#development-workflow)
9. [Roadmap & Planning](#roadmap--planning)
10. [Security & Best Practices](#security--best-practices)

---

## Project Overview

**La Vaca** is a bill-splitting mobile app focused on Colombia. Users create "mesas" (payment sessions), invite friends via QR code or join code, and split bills equally, by percentage, or via roulette.

**Stack:** pnpm monorepo with React Native + Expo SDK 54 frontend and Supabase backend (cloud hosted).

**Key Features:**
- ⚖️ Equal split, 📊 percentage split, 🎰 roulette (one pays all)
- 📲 QR code + join code sharing
- ⚡ Real-time updates via Supabase Realtime
- 🌐 Multi-language (ES/EN/PT) and multi-currency (COP/USD/EUR)
- 🎨 Warm espresso & dorado design system (Colombian café aesthetic)

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Expo Go** app on your device (for testing)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd lavaca-app
pnpm install

# Set up environment
cp .env.example frontend/.env.local
# Edit frontend/.env.local with your Supabase credentials
```

### Development

```bash
# Start Expo dev server (QR code for mobile)
pnpm dev

# Or start web mode (faster for UI/UX iteration)
cd frontend && npx expo start --web

# Type-check all workspaces
pnpm typecheck

# Lint all workspaces
pnpm lint
```

**⚡ Pro Tip:** Use web mode (`--web`) for rapid UI iteration. Switch to native for platform-specific features (camera, blur effects, etc.).

---

## Commands

| Command | Description | Notes |
|---------|-------------|-------|
| `pnpm install` | Install all workspace dependencies | Run from root |
| `pnpm dev` | Start Expo dev server | Scan QR with Expo Go |
| `pnpm typecheck` | Type-check all workspaces | Uses `tsc --noEmit` |
| `pnpm lint` | Lint all workspaces | Uses `expo lint` |
| `pnpm build:web` | Export web build | Output to `frontend/dist/` |
| `pnpm db:seed` | Reset and seed Supabase DB | Requires Supabase CLI |
| `pnpm db:seed:only` | Seed without reset | Faster for dev |

**No tests configured** — manual testing only.

---

## Architecture

### Monorepo Structure

```
lavaca-app/                     ← pnpm workspace root
├── frontend/                   ← @lavaca/frontend (React Native + Expo SDK 54)
│   ├── app/                    ← Expo Router file-based routing
│   │   ├── (tabs)/             ← Tab navigation (Home, Feed, Groups, History, Profile)
│   │   ├── session/[joinCode].tsx  ← Dynamic session view
│   │   ├── group/[id].tsx      ← Dynamic group view
│   │   ├── create.tsx          ← Modal: create session
│   │   ├── join.tsx            ← Modal: join session
│   │   └── login.tsx           ← Auth screen
│   └── src/
│       ├── auth/               ← AuthContext + OTP flow
│       ├── components/         ← Shared components (see below)
│       ├── constants/          ← theme.ts (design tokens)
│       ├── hooks/              ← useSocket, useSessionSocket
│       ├── i18n/               ← Translations (ES/EN/PT)
│       ├── services/           ← api.ts (Supabase client), countries.ts
│       ├── theme/              ← ThemeContext (dark/light mode)
│       └── utils/              ← storage, errorMessage, sessionStatus, cameraPermission
├── packages/
│   ├── api/                    ← @lavaca/api (Supabase client factory)
│   │   └── src/index.ts        ← exports createSupabaseClient(url, key)
│   └── types/                  ← @lavaca/types (shared TypeScript types, zero deps)
│       └── src/
│           ├── types.ts        ← User, PaymentSession, Participant, Group, Debt, FeedEvent
│           ├── utils.ts        ← formatCOP, currency helpers
│           └── ai.ts           ← AI Copilot types (planned feature)
└── supabase/                   ← Supabase CLI config
    ├── migrations/             ← Database schema (Postgres)
    └── functions/              ← Edge Functions (Deno)
        └── _shared/cors.ts     ← CORS helper
```

### Provider Hierarchy

From `frontend/app/_layout.tsx`:

```
<AppErrorBoundary>
  <ThemeProvider>           ← colors, isDark, toggleTheme
    <I18nProvider>          ← translate(), locale, setLocale
      <AuthProvider>        ← user, logout, updateProfile
        <ToastProvider>     ← showToast(), showError(), showSuccess()
          <AuthGuard>       ← Redirect to /login if not authenticated
            <Stack />       ← Expo Router navigation
```

**Import pattern:** All contexts are exported from their respective index files. Use named imports:

```typescript
import { useAuth } from '../src/auth';
import { useTheme } from '../src/theme';
import { useI18n } from '../src/i18n';
import { useToast } from '../src/components';
```

---

## Frontend Deep-Dive

### Routing (Expo Router)

- **File-based routing** in `frontend/app/`
- **Tabs:** `(tabs)/index.tsx`, `(tabs)/feed.tsx`, `(tabs)/groups.tsx`, `(tabs)/history.tsx`, `(tabs)/profile.tsx`
- **Modals:** `create.tsx` (stack presentation), `join.tsx` (stack presentation)
- **Dynamic routes:** `session/[joinCode].tsx`, `group/[id].tsx`

**Example:**
```typescript
// Navigate to session
router.push(`/session/${joinCode}`);

// Present modal
router.push('/create');
```

### Component Organization

All components live in `frontend/src/components/` and are exported from `index.ts`:

```
components/
├── ui/                     ← Core UI primitives
│   ├── AnimatedCard.tsx    ← Animated card with press/scale
│   ├── Avatar.tsx          ← User avatar with accent ring
│   ├── GlassCard.tsx       ← BlurView (native) / solid View (web)
│   ├── SkeletonLoader.tsx  ← Animated loading skeleton
│   ├── SplitBar.tsx        ← Visual split amount bar
│   └── StatusPill.tsx      ← Status badge (pending/confirmed/etc)
├── layout/
│   └── HeaderControls.tsx  ← Language + theme toggle (top-right)
├── feedback/
│   ├── AppErrorBoundary.tsx ← React error boundary
│   ├── EmptyState.tsx       ← Empty list state (emoji + title + action)
│   ├── ErrorState.tsx       ← Error state with retry button
│   └── Toast.tsx            ← Toast notifications (ToastProvider + useToast)
└── brand/                   ← Domain-specific components
    ├── QRCode.tsx           ← QR code generator
    ├── RouletteWheel.tsx    ← Animated roulette wheel
    └── VacaLogo.tsx         ← Animated app logo
```

**Import pattern:**
```typescript
import { GlassCard, EmptyState, useToast } from '../src/components';
```

### Styling Conventions

**🚨 Critical Rules:**

1. **Never hardcode colors.** Always use `useTheme().colors`.
2. **Design tokens** from `frontend/src/constants/theme.ts`: `spacing`, `borderRadius`, `fontSize`, `fontWeight`.
3. **Pattern per screen:**
   ```typescript
   const { colors } = useTheme();
   const styles = createStyles(colors);
   
   // At bottom of file:
   const createStyles = (colors: ColorPalette) => StyleSheet.create({
     container: {
       backgroundColor: colors.background,
       padding: spacing.lg,
     },
   });
   ```

**Signature Design Element:**

All session, participant, and history cards use a **3px colored left border** to indicate status:

```typescript
{
  borderLeftWidth: 3,
  borderLeftColor: session.status === 'open' ? colors.primary : colors.error,
}
```

**Color Palette (Espresso & Dorado):**

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `background` | `#0f0f0e` | `#f9f8f6` | Base canvas |
| `surface` | `#1a1917` | `#ffffff` | Cards, elevated views |
| `surface2` | `#232220` | `#f2f0ed` | Modals, nested cards |
| `accent` | `#f0a830` | `#c47c10` | Dorado — amounts, join codes, avatar rings |
| `primary` | `#2ed97b` | `#1a9b56` | Emerald — CTAs, active states, success |
| `error` | `#ff4757` | `#d32f2f` | Errors, closed sessions |
| `textPrimary` | `#ffffff` | `#1a1917` | Main text |
| `textSecondary` | `#a8a39d` | `#6b6660` | Secondary text, hints |
| `surfaceBorder` | `rgba(240,168,48,0.10)` | `rgba(160,120,60,0.13)` | Card borders |

**GlassCard Behavior:**
- **Native:** Uses `expo-blur` BlurView with tint
- **Web:** Falls back to solid `colors.surface2` (blur not supported)

### Contexts & Hooks

#### Contexts

| Context | Hook | Provides | Location |
|---------|------|----------|----------|
| `AuthContext` | `useAuth()` | `user`, `isLoading`, `logout()`, `updateProfile()`, `deleteAccount()` | `src/auth/AuthContext.tsx` |
| `ThemeContext` | `useTheme()` | `colors`, `isDark`, `toggleTheme()` | `src/theme/ThemeContext.tsx` |
| `I18nContext` | `useI18n()` | `translate()`, `locale`, `setLocale()` | `src/i18n/I18nContext.tsx` |
| `Toast` | `useToast()` | `showToast()`, `showError()`, `showSuccess()` | `src/components/feedback/Toast.tsx` |

#### Hooks

| Hook | Purpose | Usage |
|------|---------|-------|
| `useSocket()` | Singleton Supabase Realtime connection | Call once at app root |
| `useSessionSocket(joinCode, onUpdate)` | Subscribe to session updates | Call in session view; `onUpdate` fires on `postgres_changes` |

**Example:**
```typescript
const { user, logout } = useAuth();
const { colors, isDark } = useTheme();
const { translate } = useI18n();
const { showSuccess } = useToast();

// Real-time session updates
useSessionSocket(joinCode, (updatedSession) => {
  setSession(updatedSession);
});
```

### Internationalization (i18n)

- **All user-facing strings** must use `translate('key')`.
- **Interpolation:** Supports `{{variable}}` syntax.
- **Translation keys:** `frontend/src/i18n/translations.ts`
- **Locales:** Spanish (`es`), English (`en`), Portuguese (`pt`)

**When adding new keys:**
1. Add to `es` object
2. Add to `en` object
3. Add to `pt` object

**Example:**
```typescript
const { translate } = useI18n();

<Text>{translate('session.joinCode')}</Text>
<Text>{translate('session.totalAmount', { amount: formatCOP(total) })}</Text>
```

### Services & Utilities

#### Services (`frontend/src/services/`)

- **`api.ts`** — Single Supabase client instance. Exports `api` object with methods for all backend operations.
- **`countries.ts`** — Country data for phone number input (flags, dial codes).

**API Client Usage:**
```typescript
import { api } from '../services/api';

// All methods return promises
const sessions = await api.sessions.list();
const session = await api.sessions.get(joinCode);
await api.participants.reportPaid(sessionId, userId);
```

**Required env vars:**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### Utilities (`frontend/src/utils/`)

- **`cameraPermission.ts`** — `requestCameraPermission()` for QR scanning
- **`errorMessage.ts`** — User-friendly error message formatter
- **`sessionStatus.ts`** — Session status helpers (color, icon, label)
- **`storage.ts` / `storage.native.ts`** — Platform-specific AsyncStorage wrapper

---

## Backend & Domain

### Supabase Architecture

**No local backend server.** All backend logic runs on Supabase (cloud hosted):

- **Auth:** Phone + 6-digit PIN (stored as Supabase Auth password, no SMS)
- **Database:** PostgreSQL with Row-Level Security (RLS)
- **Realtime:** `postgres_changes` subscriptions for live session updates
- **Edge Functions:** Deno runtime (future: AI split suggestions, reminders)

**Schema:** `supabase/migrations/`

### Domain Concepts

#### Payment Session (`PaymentSession`)

- **Identified by:** `joinCode` (e.g. `VACA-Y6QM`)
- **Split modes:** `equal`, `percentage`, `roulette`
- **Status flow:** `open → closed | cancelled`
- **Admin:** User who created the session (can approve payments, close session)

#### Participant

- **Status flow:** `pending → reported → confirmed | rejected | failed`
- **Roulette:** `isRouletteWinner` (pays all) or `isRouletteCoward` (escaped before spin)

#### Payment Flow

1. Admin creates session with total amount
2. Participants join via QR or join code
3. Admin assigns amounts (equal, percentage, or roulette)
4. **Participant flow:** User reports paid → Admin approves → Status = `confirmed`
5. **Admin shortcut:** Admin can `markPaid` directly (skips reporting step)
6. When all confirmed, admin closes session
7. Session appears in feed and history

#### Feed Events

Auto-generated on:
- Roulette winner/coward
- Fast payer (first to pay)
- Session close

### Types Reference

All types from `@lavaca/types`:

```typescript
import type { User, PaymentSession, Participant, Group, FeedEvent, Debt } from '@lavaca/types';
import { formatCOP } from '@lavaca/types';

interface PaymentSession {
  id: string;
  joinCode: string;
  adminId: string;
  totalAmount: number;
  currency: 'COP' | 'USD' | 'EUR';
  splitMode: 'equal' | 'percentage' | 'roulette';
  status: 'open' | 'closed' | 'cancelled';
  participants: Participant[];
  createdAt: Date;
}

interface Participant {
  userId: string;
  displayName: string;
  amount: number;
  percentage?: number;  // Only for percentage mode
  status: 'pending' | 'reported' | 'confirmed' | 'rejected' | 'failed';
  isRouletteWinner?: boolean;
  isRouletteCoward?: boolean;
}
```

---

## Code Conventions

### TypeScript

- **Use types from `@lavaca/types`** for all domain entities
- **No `any`** unless absolutely necessary — cast immediately after
- **Null safety:** Use optional chaining (`?.`) and nullish coalescing (`??`)

### Component Patterns

1. **Functional components only** (no class components)
2. **Hooks at top** of function body
3. **Event handlers** prefixed with `handle` (e.g. `handlePress`, `handleSubmit`)
4. **Styles** at bottom of file using `createStyles` pattern

**Template:**
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { spacing } from '../constants/theme';

export function MyComponent() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const handlePress = () => {
    // ...
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 18,
    color: colors.textPrimary,
  },
});
```

### Import Order

1. React / React Native
2. Third-party libraries
3. Internal packages (`@lavaca/types`, `@lavaca/api`)
4. Contexts and hooks
5. Components
6. Constants and utils
7. Types (type-only imports last)

```typescript
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { PaymentSession } from '@lavaca/types';
import { useAuth } from '../auth';
import { GlassCard, useToast } from '../components';
import { spacing } from '../constants/theme';
```

---

## Development Workflow

### Fast Iteration

1. **Use web mode** for UI/styling work: `cd frontend && npx expo start --web`
2. **Switch to native** for platform features (camera, blur, etc.)
3. **Hot reload** works on all platforms — save and see changes instantly

### Environment Variables

**Required:**
- `EXPO_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key

**Optional:**
- `EXPO_PUBLIC_AI_ENABLED=false` — Enable AI Copilot features (planned, not yet implemented)

**Setup:**
```bash
cp .env.example frontend/.env.local
# Edit frontend/.env.local with your credentials
```

### Common Tasks

#### Add a new screen

1. Create file in `frontend/app/` (e.g. `my-screen.tsx`)
2. Use `useTheme()`, `useI18n()` for styling and text
3. Export default component
4. Link from existing screen: `router.push('/my-screen')`

#### Add a new component

1. Create in appropriate subfolder: `ui/`, `layout/`, `feedback/`, `brand/`
2. Export from `frontend/src/components/index.ts`
3. Import: `import { MyComponent } from '../src/components';`

#### Add i18n keys

```typescript
// frontend/src/i18n/translations.ts
export const translations = {
  es: {
    myFeature: {
      title: 'Mi Función',
      description: 'Descripción de {{name}}',
    },
  },
  en: {
    myFeature: {
      title: 'My Feature',
      description: 'Description of {{name}}',
    },
  },
  pt: {
    myFeature: {
      title: 'Minha Função',
      description: 'Descrição de {{name}}',
    },
  },
};
```

---

## Roadmap & Planning

### Documentation Structure

All planned work lives in **`docs/plans/`**. Before starting any phase-based task, read:

| File | Purpose |
|------|---------|
| `docs/plans/2026-03-05-lavaca-roadmap.md` | Master plan — phase overview, conflict rules, cleanup mandate, definition of done |
| `docs/plans/2026-03-05-phase-1-frontend-redesign.md` | Frontend redesign — new components, animations, web layout |
| `docs/plans/2026-03-05-phase-2-supabase-migration.md` | Supabase migration — replaces Express + SQLite + Socket.IO |
| `docs/plans/2026-03-05-human-ops-checklist.md` | Manual tasks (Supabase setup, GitHub Models API keys) |

### AI Agent Rules (from roadmap)

When working on phase-based tasks:

1. **Read the roadmap first** — understand which phase you are on and conflict rules
2. **Mark tasks done** — update `- [ ]` → `- [x]` in phase file as you complete tasks
3. **Update roadmap status** — change `⬜ pending` → `🟨 in-progress` → `🟩 done`
4. **Delete what you replace** — cleanup checklist is mandatory
5. **Log changes** — append `## Changelog` section to phase file

### Current Status (as of 2026-03-24)

- Phase 0 (AI Copilot): 🟨 in-progress (types exist, implementation planned)
- Phase 1 (Frontend Redesign): 🟩 done
- Phase 2 (Supabase Migration): 🟩 done
- Phase 3 (Vercel Deploy): ❌ cancelled
- Phase 4 (Stripe Payments): ❌ cancelled

### AI Copilot (Planned Feature)

**Status:** Types defined in `@lavaca/types/ai.ts`, implementation not yet complete.

**Planned capabilities:**
- Split mode suggestions based on context (GitHub Models `gpt-4o-mini`)
- Payment reminder message generation
- Edge Function: `supabase/functions/ai-copilot/`

**When implementing:**
- Guard all calls with `EXPO_PUBLIC_AI_ENABLED === 'true'`
- Graceful fallback on errors (return `null`)
- UI shows AI suggest button only when enabled

---

## Security & Best Practices

### Security Rules

- **Never hardcode secrets** — use environment variables
- **Never hardcode `ALLOWED_ORIGINS`** — use env var in production
- **No dev bypasses in production builds** — check `__DEV__` flag
- **Validate at system boundaries** — user input, external APIs
- **No SQL injection, XSS, or command injection**
- **Supabase RLS** enforces data access policies (don't bypass)

### Authentication

- **Phone + 6-digit PIN** (no SMS, Supabase Auth password)
- **JWT tokens** managed by Supabase client
- **AuthGuard** redirects unauthenticated users to `/login`
- **User data** in `users` table linked to `auth.users` via `id`

### Best Practices

1. **Always type-check before commit:** `pnpm typecheck`
2. **Always lint before commit:** `pnpm lint`
3. **Test on both platforms** (iOS + Android) for critical features
4. **Use `GlassCard`** for elevated surfaces (handles platform differences)
5. **Avoid inline styles** — use `StyleSheet.create()` for performance
6. **Keep components small** — split into sub-components if > 200 lines
7. **Use `EmptyState` and `ErrorState`** for empty/error UIs (consistent UX)

---

## Additional Resources

- **Deep dive:** See `CLAUDE.md` for comprehensive architecture details
- **Quick reference:** See `GEMINI.md` for concise rules
- **README:** See `README.md` for feature overview and setup guide

---

**Last Updated:** 2026-03-25
