# Phase 5 — Refactoring & Code Quality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Eliminate ambiguous naming, extract reusable components, remove dead code, and reorganize the folder structure so the codebase is clean and easy to maintain.

**Architecture:** No feature changes — only restructuring, renaming, and extraction. Every task must leave `pnpm typecheck` and `pnpm lint` green.

**Tech Stack:** TypeScript, React Native, Expo Router (same stack — no new deps).

**Conflict rules:** ONLY touches `apps/mobile/`. Never touches `supabase/` or `packages/`.

---

## Problems Found

### Ambiguous naming (affects every screen)
- `const { t } = useI18n()` → `t` says nothing about what it does. Rename to `translate`.
- `const s = createStyles(colors)` → `s` says nothing. Rename to `styles`. (**13 files affected**)
- `catch (err: any)` → `any` removes type safety. Use `unknown` + a `getErrorMessage` util. (**20+ occurrences**)

### Repeated patterns not extracted (causes duplication)
- **Error message extraction**: `err.message || t('...')` repeated in 20+ catch blocks → extract `getErrorMessage(err: unknown, fallback?: string): string`
- **Session card**: same card structure in `index.tsx` and `history.tsx` → extract `SessionCard` component
- **Labeled form field**: same label+input pattern in `login.tsx`, `create.tsx`, `join.tsx`, `group/[id].tsx` → extract `FormField` component

### Folder structure (components are a flat list of 15 files)
Current `src/components/` has no organization. Proposed groups:
```
src/components/
  ui/        ← GlassCard, Avatar, StatusPill, AnimatedCard, SplitBar, SkeletonLoader
  feedback/  ← EmptyState, ErrorState, Toast, AppErrorBoundary
  layout/    ← WebSidebar, HeaderControls
  brand/     ← VacaLogo, RouletteWheel, QRCode
  index.ts   ← re-exports everything (no import changes needed in screens)
```

### Potential dead code
- `src/hooks/useSocket.ts` — singleton Socket.IO connection. Check if still used after Supabase migration.

---

## Task 1: Extract `getErrorMessage` utility

**Files:**
- Create: `apps/mobile/src/utils/errorMessage.ts`
- Modify: every `catch (err: any)` in `apps/mobile/app/`

**Step 1: Create the utility**
```typescript
// apps/mobile/src/utils/errorMessage.ts
export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}
```

**Step 2: Replace all `catch (err: any)` patterns**

In each screen, replace:
```typescript
// BEFORE
} catch (err: any) {
  Alert.alert(t('common.error'), err.message || t('some.key'));
}

// AFTER
} catch (err: unknown) {
  Alert.alert(translate('common.error'), getErrorMessage(err, translate('some.key')));
}
```

Files to update:
- `app/login.tsx` (3 occurrences)
- `app/join.tsx` (1)
- `app/create.tsx` (1)
- `app/group/[id].tsx` (3)
- `app/(tabs)/index.tsx` (1)
- `app/(tabs)/feed.tsx` (1)
- `app/(tabs)/profile.tsx` (2)
- `app/(tabs)/groups.tsx` (2)
- `app/session/[joinCode].tsx` (6)

**Step 3: Typecheck**
```bash
pnpm --filter @lavaca/mobile typecheck
```
Expected: 0 errors.

**Step 4: Commit**
```bash
git add apps/mobile/src/utils/errorMessage.ts apps/mobile/app/
git commit -m "refactor: extract getErrorMessage utility, replace all err:any with err:unknown"
```

---

## Task 2: Rename `t` → `translate` in i18n

**Files:**
- Modify: `apps/mobile/src/i18n/I18nContext.tsx` — rename `t` to `translate` in the context value
- Modify: all screen files that use `const { t } = useI18n()`

**Step 1: Update I18nContext**

In `I18nContext.tsx`, find the context type and the returned value. Change:
```typescript
// BEFORE
interface I18nContextValue {
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  ...
}
// return value:
value={{ t, locale, setLocale }}

// AFTER
interface I18nContextValue {
  translate: (key: TranslationKey, vars?: Record<string, string>) => string;
  ...
}
// return value:
value={{ translate: t, locale, setLocale }}
```

**Step 2: Update every screen**

In every file that has `const { t } = useI18n()`:
```typescript
// BEFORE
const { t } = useI18n();
// usage: t('some.key')

// AFTER
const { translate } = useI18n();
// usage: translate('some.key')
```

Files to update (grep shows all of them):
- `app/login.tsx`
- `app/join.tsx`
- `app/create.tsx`
- `app/group/[id].tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/feed.tsx`
- `app/(tabs)/history.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/groups.tsx`
- `app/session/[joinCode].tsx`
- `app/_layout.tsx`
- `src/components/WebSidebar.tsx`
- `src/components/HeaderControls.tsx` (if used)

**Step 3: Typecheck**
```bash
pnpm --filter @lavaca/mobile typecheck
```
Expected: 0 errors.

**Step 4: Commit**
```bash
git add apps/mobile/src/i18n/ apps/mobile/app/ apps/mobile/src/components/
git commit -m "refactor: rename t→translate in useI18n for clarity"
```

---

## Task 3: Rename `s` → `styles` in all screens

**Files:** 13 screen files that use `const s = createStyles(colors)`

**Step 1: Rename in each file**

For each screen, replace:
```typescript
const s = createStyles(colors);
// and all usages: s.container → styles.container
```

With:
```typescript
const styles = createStyles(colors);
// and all usages: styles.container
```

Files:
- `app/login.tsx` — 4 sub-components each with `const s`
- `app/join.tsx`
- `app/create.tsx`
- `app/group/[id].tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/feed.tsx`
- `app/(tabs)/history.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/groups.tsx`
- `app/session/[joinCode].tsx`

Note: `app/(tabs)/_layout.tsx` already has a module-level `const styles = StyleSheet.create(...)` — leave it as `s` OR rename the module-level one to `tabStyles` to avoid conflict.

**Step 2: Typecheck**
```bash
pnpm --filter @lavaca/mobile typecheck
```
Expected: 0 errors.

**Step 3: Commit**
```bash
git add apps/mobile/app/
git commit -m "refactor: rename s→styles in all screens for clarity"
```

---

## Task 4: Extract `SessionCard` component

**Context:** `index.tsx` and `history.tsx` both render session cards with `AnimatedCard` + `Avatar` + `StatusPill` + `SplitBar`. The inner structure is near-identical.

**Files:**
- Create: `apps/mobile/src/components/ui/SessionCard.tsx`
- Modify: `apps/mobile/app/(tabs)/index.tsx`
- Modify: `apps/mobile/app/(tabs)/history.tsx`

**Step 1: Create the component**
```typescript
// apps/mobile/src/components/ui/SessionCard.tsx
import { View, Text, StyleSheet } from 'react-native';
import { PaymentSession } from '@lavaca/shared';
import { AnimatedCard, Avatar, StatusPill, SplitBar } from '../index';
import { useTheme } from '../../theme';
import { spacing, fontSize, fontWeight, borderRadius, type ThemeColors } from '../../constants/theme';

interface SessionCardProps {
  session: PaymentSession;
  index: number;
  onPress: () => void;
  currentUserId?: string;
}

export function SessionCard({ session, index, onPress, currentUserId }: SessionCardProps) {
  // Extract the same display logic from index.tsx renderItem
  // (status color, pill variant, confirmed count, etc.)
  ...
}
```

**Step 2: Replace `renderItem` in index.tsx and the card block in history.tsx**

**Step 3: Typecheck + verify screens still render correctly**

**Step 4: Commit**
```bash
git commit -m "refactor: extract SessionCard component, reuse in Home and History tabs"
```

---

## Task 5: Extract `FormField` component

**Context:** login.tsx, create.tsx, join.tsx, and group/[id].tsx all have the same pattern:
```tsx
<View style={styles.labelRow}>
  <Text style={styles.fieldLabel}>{translate('auth.nameLabel')}</Text>
  <Text style={styles.required}>*</Text>
</View>
<TextInput style={styles.input} ... />
```

**Files:**
- Create: `apps/mobile/src/components/ui/FormField.tsx`
- Modify: `app/login.tsx`, `app/create.tsx`, `app/join.tsx`, `app/group/[id].tsx`

**Step 1: Create the component**
```typescript
// apps/mobile/src/components/ui/FormField.tsx
interface FormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  optionalLabel?: string;
  children: React.ReactNode; // the TextInput
}

export function FormField({ label, required, optional, optionalLabel, children }: FormFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        {required && <Text style={[styles.required, { color: colors.danger }]}>*</Text>}
        {optional && <Text style={[styles.optional, { color: colors.textMuted }]}>{optionalLabel}</Text>}
      </View>
      {children}
    </View>
  );
}
```

**Step 2: Replace repeated patterns in screens**

**Step 3: Typecheck**

**Step 4: Commit**
```bash
git commit -m "refactor: extract FormField component, remove repeated label+input pattern"
```

---

## Task 6: Reorganize `src/components/` into subdirectories

**Files:**
- Move files into subdirs (no renames)
- Update `src/components/index.ts` to re-export from new paths
- No changes needed in screens (they import from `../../src/components`)

**Step 1: Create subdirs and move files**
```
src/components/
  ui/
    AnimatedCard.tsx    ← moved
    Avatar.tsx          ← moved
    FormField.tsx       ← new (Task 5)
    GlassCard.tsx       ← moved
    SessionCard.tsx     ← new (Task 4)
    SkeletonLoader.tsx  ← moved
    SplitBar.tsx        ← moved
    StatusPill.tsx      ← moved
  feedback/
    AppErrorBoundary.tsx ← moved
    EmptyState.tsx       ← moved
    ErrorState.tsx       ← moved
    Toast.tsx            ← moved
  layout/
    HeaderControls.tsx  ← moved
    WebSidebar.tsx      ← moved
  brand/
    QRCode.tsx          ← moved
    RouletteWheel.tsx   ← moved
    VacaLogo.tsx        ← moved
  index.ts              ← updated re-exports
```

**Step 2: Update `index.ts`**
```typescript
// src/components/index.ts
export { AnimatedCard } from './ui/AnimatedCard';
export { Avatar } from './ui/Avatar';
export { FormField } from './ui/FormField';
export { GlassCard } from './ui/GlassCard';
export { SessionCard } from './ui/SessionCard';
export { SkeletonCard, SkeletonLoader } from './ui/SkeletonLoader';
export { SplitBar } from './ui/SplitBar';
export { StatusPill } from './ui/StatusPill';
export { AppErrorBoundary } from './feedback/AppErrorBoundary';
export { EmptyState } from './feedback/EmptyState';
export { ErrorState } from './feedback/ErrorState';
export { ToastProvider, useToast } from './feedback/Toast';
export { HeaderControls } from './layout/HeaderControls';
export { WebSidebar } from './layout/WebSidebar';
export { QRCode } from './brand/QRCode';
export { RouletteWheel } from './brand/RouletteWheel';
export { VacaLogo } from './brand/VacaLogo';
```

**Step 3: Typecheck — screens must still work**
```bash
pnpm --filter @lavaca/mobile typecheck
```
Expected: 0 errors. Screens import from `../../src/components` which now re-exports from subdirs.

**Step 4: Commit**
```bash
git add apps/mobile/src/components/
git commit -m "refactor: organize components into ui/feedback/layout/brand subdirs"
```

---

## Task 7: Check and remove dead code

**Step 1: Check `useSocket.ts`**
```bash
grep -rn "useSocket" apps/mobile/src/ apps/mobile/app/ --include="*.ts" --include="*.tsx"
```
If only referenced by `useSessionSocket.ts` and not by any screen → delete `useSocket.ts` and simplify `useSessionSocket.ts` to use Supabase channel directly (already done in Phase 2).

**Step 2: Remove unused imports**
```bash
pnpm lint
```
Any "no-unused-vars" or "unused import" warnings → fix them.

**Step 3: Final typecheck**
```bash
pnpm typecheck
pnpm lint
```
Both must be green (0 errors, 0 warnings).

**Step 4: Commit**
```bash
git commit -m "refactor: remove dead code, unused imports, and legacy socket hooks"
```

---

## Phase 5 Checklist

- [ ] `getErrorMessage` utility extracted — no more `err: any` in catch blocks
- [ ] `translate` replaces `t` in all screens
- [ ] `styles` replaces `s` in all screens
- [ ] `SessionCard` component created and used in Home + History
- [ ] `FormField` component created and used in login, create, join, group detail
- [ ] `src/components/` reorganized into ui/feedback/layout/brand subdirs
- [ ] Dead code removed (`useSocket.ts` if unused, stale imports)
- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm lint` → 0 warnings
