# Gemini Instructions — La Vaca

## Mandatory Rule

**Always delete unused code, files, and dependencies.** When replacing something, delete what it replaced. No dead code, no legacy files, no stale imports, no unused deps. The cleanup is mandatory — not optional.

---

## Project Overview

**La Vaca** is a bill-splitting mobile app focused on Colombia. pnpm monorepo: React Native + Expo frontend, Supabase backend (cloud hosted — no local server).

```
lavaca-app/
├── frontend/     ← @lavaca/frontend (React Native + Expo SDK 54)
├── packages/
│   ├── api/      ← @lavaca/api (Supabase client factory)
│   └── types/    ← @lavaca/types (shared TypeScript types, zero deps)
└── supabase/     ← migrations, Edge Functions, config
```

## Key Rules

- All colors from `useTheme().colors` — never hardcode hex values.
- All user-facing strings via `translate('key')` from `useI18n()` — add to all 3 locales (`es`, `en`, `pt`).
- Pattern per screen: `const styles = createStyles(colors)` + `StyleSheet.create()` at bottom.
- Auth: phone + 6-digit PIN (Supabase Auth password, no SMS).
- Domain types from `@lavaca/types`. API client from `frontend/src/services/api.ts`.

## Commands

```bash
pnpm install    # install all deps
pnpm dev        # start Expo app
pnpm typecheck  # type-check all workspaces
pnpm lint       # lint all workspaces
```

See `CLAUDE.md` for full project details.
