# Phase 1 — Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Redesign all screens with polished animations, new components, and a fully responsive web layout — without touching the backend or API layer.

**Architecture:** Add `react-native-reanimated` for animations. Build new reusable components. Redesign each screen using existing theme tokens. Add a web-specific sidebar navigation so the web version looks professional, not just a stretched mobile app.

**Tech Stack:** React Native, Expo SDK 54, `react-native-reanimated`, `expo-linear-gradient`, existing `useTheme()` + `useI18n()` hooks.

**Conflict rules:** ONLY touch `apps/mobile/app/`, `apps/mobile/src/components/`, `apps/mobile/src/constants/theme.ts`, `apps/mobile/src/i18n/translations.ts`. Never touch API, auth logic, or `packages/shared/`.

## Plan Hygiene (Anti-Basura)

- Esta fase debe incluir limpieza de componentes/estilos no usados antes de cerrar.
- No se permite agregar dependencias UI sin uso directo en pantallas/componentes activos.
- Todo cambio aplicado debe registrarse en este `.md` y sincronizarse con el roadmap.

## Shared Change Log (2026-03-05)

- Se inicio la ejecucion global del roadmap con estructura base para Fase 2.
- Se agregaron y sincronizaron los planes de fases en `docs/plans/`.
- Se definio regla obligatoria de no acumular basura tecnica en el plan maestro.
- Esta fase aun no tiene implementacion de UI iniciada.

Last sync: 2026-03-05

---

## Task 1: Install react-native-reanimated

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app/_layout.tsx`

**Step 1: Install the package**
```bash
cd apps/mobile
npx expo install react-native-reanimated
```

**Step 2: Add Babel plugin to `apps/mobile/babel.config.js`**

If `babel.config.js` doesn't exist, create it:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

**Step 3: Verify typecheck still passes**
```bash
pnpm --filter @lavaca/mobile typecheck
```
Expected: zero errors.

**Step 4: Commit**
```bash
git add apps/mobile/package.json apps/mobile/babel.config.js pnpm-lock.yaml
git commit -m "feat(mobile): install react-native-reanimated"
```

---

## Task 2: Add new design tokens to theme.ts

**Files:**
- Modify: `apps/mobile/src/constants/theme.ts`

**Step 1: Read the current theme file**

Open `apps/mobile/src/constants/theme.ts` and find the existing tokens.

**Step 2: Add missing tokens**

Add these to the existing exports (do not replace anything):
```typescript
// Shadow tokens
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

// Animation duration tokens
export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
```

**Step 3: Typecheck**
```bash
pnpm --filter @lavaca/mobile typecheck
```

**Step 4: Commit**
```bash
git add apps/mobile/src/constants/theme.ts
git commit -m "feat(theme): add shadow and duration tokens"
```

---

## Task 3: Build Avatar component

**Files:**
- Create: `apps/mobile/src/components/Avatar.tsx`
- Modify: `apps/mobile/src/components/index.ts` (add export)

**Step 1: Create the component**

```typescript
// apps/mobile/src/components/Avatar.tsx
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { fontSize, fontWeight, type ThemeColors } from '../constants/theme';

interface AvatarProps {
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
  showRing?: boolean;
}

export function Avatar({ displayName, avatarUrl, size = 40, showRing = false }: AvatarProps) {
  const { colors } = useTheme();
  const s = createStyles(colors, size, showRing);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={s.ring}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={s.image} />
      ) : (
        <View style={s.fallback}>
          <Text style={s.initial}>{initial}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors, size: number, showRing: boolean) =>
  StyleSheet.create({
    ring: {
      width: size + (showRing ? 4 : 0),
      height: size + (showRing ? 4 : 0),
      borderRadius: (size + (showRing ? 4 : 0)) / 2,
      borderWidth: showRing ? 2 : 0,
      borderColor: showRing ? colors.accent : 'transparent',
      padding: showRing ? 2 : 0,
      backgroundColor: 'transparent',
    },
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    fallback: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initial: {
      fontSize: size * 0.38,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
  });
```

**Step 2: Export from index**

Add to `apps/mobile/src/components/index.ts`:
```typescript
export { Avatar } from './Avatar';
```

**Step 3: Typecheck**
```bash
pnpm --filter @lavaca/mobile typecheck
```

**Step 4: Commit**
```bash
git add apps/mobile/src/components/Avatar.tsx apps/mobile/src/components/index.ts
git commit -m "feat(components): add Avatar component with image + initial fallback"
```

---

## Task 4: Build StatusPill component

**Files:**
- Create: `apps/mobile/src/components/StatusPill.tsx`
- Modify: `apps/mobile/src/components/index.ts`

**Step 1: Create the component**

```typescript
// apps/mobile/src/components/StatusPill.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { fontSize, fontWeight, borderRadius, spacing, type ThemeColors } from '../constants/theme';

type PillVariant = 'success' | 'warning' | 'error' | 'muted' | 'accent';

interface StatusPillProps {
  label: string;
  variant: PillVariant;
}

export function StatusPill({ label, variant }: StatusPillProps) {
  const { colors } = useTheme();
  const s = createStyles(colors, variant);
  return (
    <View style={s.pill}>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const VARIANT_COLORS: Record<PillVariant, (c: ThemeColors) => { bg: string; text: string; border: string }> = {
  success: (c) => ({ bg: c.statusOpen + '18', text: c.statusOpen, border: c.statusOpen + '40' }),
  warning: (c) => ({ bg: c.accent + '18', text: c.accent, border: c.accent + '40' }),
  error: (c) => ({ bg: c.statusClosed + '18', text: c.statusClosed, border: c.statusClosed + '40' }),
  muted: (c) => ({ bg: c.surface2, text: c.textMuted, border: c.surfaceBorder }),
  accent: (c) => ({ bg: c.accent + '18', text: c.accent, border: c.accent + '50' }),
};

const createStyles = (colors: ThemeColors, variant: PillVariant) => {
  const vc = VARIANT_COLORS[variant](colors);
  return StyleSheet.create({
    pill: {
      backgroundColor: vc.bg,
      borderWidth: 1,
      borderColor: vc.border,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      alignSelf: 'flex-start',
    },
    label: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: vc.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
};
```

**Step 2: Check that `statusOpen`, `statusClosed` exist in ThemeColors**

Open `apps/mobile/src/constants/theme.ts` and verify these color keys exist. If they don't, add them to both dark and light color objects with appropriate values (green for open, red for closed).

**Step 3: Export from index**
```typescript
export { StatusPill } from './StatusPill';
```

**Step 4: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/src/components/StatusPill.tsx apps/mobile/src/components/index.ts
git commit -m "feat(components): add StatusPill component"
```

---

## Task 5: Build AnimatedCard component

**Files:**
- Create: `apps/mobile/src/components/AnimatedCard.tsx`
- Modify: `apps/mobile/src/components/index.ts`

**Step 1: Create the component**

```typescript
// apps/mobile/src/components/AnimatedCard.tsx
import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { borderRadius, shadow, type ThemeColors } from '../constants/theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;  // for staggered entrance
  style?: ViewStyle;
}

export function AnimatedCard({ children, index = 0, style }: AnimatedCardProps) {
  const { colors } = useTheme();
  const s = createStyles(colors);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[s.card, animStyle, style]}>
      {children}
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 16,
      ...shadow.sm,
    },
  });
```

**Step 2: Export from index**
```typescript
export { AnimatedCard } from './AnimatedCard';
```

**Step 3: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/src/components/AnimatedCard.tsx apps/mobile/src/components/index.ts
git commit -m "feat(components): add AnimatedCard with staggered entrance animation"
```

---

## Task 6: Build SplitBar component (visual split progress)

**Files:**
- Create: `apps/mobile/src/components/SplitBar.tsx`
- Modify: `apps/mobile/src/components/index.ts`

**Step 1: Create the component**

```typescript
// apps/mobile/src/components/SplitBar.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { fontSize, fontWeight, borderRadius, spacing, type ThemeColors } from '../constants/theme';

interface SplitBarProps {
  paid: number;       // number of confirmed participants
  total: number;      // total participants
  amount?: number;    // total amount for label
  currency?: string;
}

export function SplitBar({ paid, total, amount, currency = 'COP' }: SplitBarProps) {
  const { colors } = useTheme();
  const s = createStyles(colors);
  const pct = total > 0 ? (paid / total) * 100 : 0;

  return (
    <View style={s.container}>
      <View style={s.track}>
        <View style={[s.fill, { width: `${pct}%` as `${number}%` }]} />
      </View>
      <View style={s.labels}>
        <Text style={s.label}>{paid}/{total} pagaron</Text>
        {amount != null && (
          <Text style={s.amount}>{currency} {amount.toLocaleString('es-CO')}</Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.xs },
    track: {
      height: 5,
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    fill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.full,
    },
    labels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    amount: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.accent,
    },
  });
```

**Step 2: Export + typecheck + commit**
```bash
git add apps/mobile/src/components/SplitBar.tsx apps/mobile/src/components/index.ts
git commit -m "feat(components): add SplitBar payment progress component"
```

---

## Task 7: Add i18n keys for new UI strings

**Files:**
- Modify: `apps/mobile/src/i18n/translations.ts`

**Step 1: Read the current translations file and find where to add**

Open `apps/mobile/src/i18n/translations.ts`.

**Step 2: Add new keys to all three locales (es, en, pt)**

Add under the appropriate sections:
```typescript
// In 'es':
'premium.title': 'La Vaca Pro',
'premium.subtitle': 'Desbloquea todo el potencial',
'premium.cta': 'Ver planes',
'common.paid': 'Pagó',
'common.pending': 'Pendiente',
'common.confirmed': 'Confirmado',
'common.rejected': 'Rechazado',
'common.open': 'Abierta',
'common.closed': 'Cerrada',

// In 'en':
'premium.title': 'La Vaca Pro',
'premium.subtitle': 'Unlock the full potential',
'premium.cta': 'View plans',
'common.paid': 'Paid',
'common.pending': 'Pending',
'common.confirmed': 'Confirmed',
'common.rejected': 'Rejected',
'common.open': 'Open',
'common.closed': 'Closed',

// In 'pt':
'premium.title': 'La Vaca Pro',
'premium.subtitle': 'Desbloqueie todo o potencial',
'premium.cta': 'Ver planos',
'common.paid': 'Pagou',
'common.pending': 'Pendente',
'common.confirmed': 'Confirmado',
'common.rejected': 'Rejeitado',
'common.open': 'Aberta',
'common.closed': 'Fechada',
```

**Step 3: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/src/i18n/translations.ts
git commit -m "feat(i18n): add premium and status strings to es/en/pt"
```

---

## Task 8: Redesign Home screen (tabs/index.tsx)

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx`

**Step 1: Read the current file fully before editing**

Open `apps/mobile/app/(tabs)/index.tsx` and understand the current structure.

**Step 2: Replace session card render with AnimatedCard + StatusPill + SplitBar**

For each session card in the FlatList:
- Wrap in `<AnimatedCard index={index}>` instead of plain `<View>`
- Add `<StatusPill variant={session.status === 'open' ? 'success' : 'muted'} label={t(`common.${session.status}`)} />`
- Add `<SplitBar paid={confirmedCount} total={participantCount} amount={session.totalAmount} currency={session.currency} />`
- Replace plain initials with `<Avatar displayName={session.adminName} size={36} />`
- Keep the left accent bar (`borderLeftWidth: 3`)

**Step 3: Import new components**
```typescript
import { AnimatedCard, StatusPill, SplitBar, Avatar } from '../../src/components';
```

**Step 4: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/app/(tabs)/index.tsx
git commit -m "feat(home): redesign session cards with AnimatedCard, StatusPill, SplitBar"
```

---

## Task 9: Redesign Session Detail screen

**Files:**
- Modify: `apps/mobile/app/session/[joinCode].tsx`

**Step 1: Read the current file fully**

**Step 2: Apply improvements**
- Replace participant rows with `<Avatar>` component
- Add `<StatusPill>` to participant status
- Add `<SplitBar>` at the top of the session showing overall payment progress
- Use `AnimatedCard` for the session info card and each participant card
- Add entrance animations

**Step 3: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/app/session/[joinCode].tsx
git commit -m "feat(session): redesign detail screen with new components"
```

---

## Task 10: Redesign Profile screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

**Step 1: Read the current file fully**

**Step 2: Fix date alignment issue (known bug)**

Wrap the date in a consistent `<View style={{ flexDirection: 'row', alignItems: 'center' }}>` with the label, ensuring both are vertically centered.

**Step 3: Improve layout**
- Use `<Avatar displayName={user.displayName} avatarUrl={user.avatarUrl} size={80} showRing />` as the profile photo
- Stats row (sessions, amount, etc.) — wrap each stat in `<AnimatedCard>` with `index`
- Add premium banner placeholder: a card at the bottom with `colors.accent` gradient hint and `t('premium.cta')` button (non-functional, Stripe Phase 4 implements it)

**Step 4: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/app/(tabs)/profile.tsx
git commit -m "feat(profile): redesign with Avatar, fixed date alignment, premium banner"
```

---

## Task 11: Redesign History screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/history.tsx`

**Step 1: Read the current file fully**

**Step 2: Apply AnimatedCard + StatusPill to history items**

Each history card:
- `<AnimatedCard index={index}>`
- `<StatusPill>` for session status
- Keep left accent border
- `<Avatar>` for admin

**Step 3: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/app/(tabs)/history.tsx
git commit -m "feat(history): redesign with AnimatedCard and StatusPill"
```

---

## Task 12: Responsive web layout — WebSidebar component

**Files:**
- Create: `apps/mobile/src/components/WebSidebar.tsx`
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

**Step 1: Create WebSidebar**

```typescript
// apps/mobile/src/components/WebSidebar.tsx
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { spacing, fontSize, fontWeight, borderRadius, type ThemeColors } from '../constants/theme';

const NAV_ITEMS = [
  { href: '/(tabs)', label: 'nav.home', icon: '🏠' },
  { href: '/(tabs)/feed', label: 'nav.feed', icon: '📣' },
  { href: '/(tabs)/groups', label: 'nav.groups', icon: '👥' },
  { href: '/(tabs)/history', label: 'nav.history', icon: '📋' },
  { href: '/(tabs)/profile', label: 'nav.profile', icon: '👤' },
] as const;

export function WebSidebar() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const s = createStyles(colors);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={s.sidebar}>
      <View style={s.logo}>
        <Text style={s.logoText}>🐄 La Vaca</Text>
      </View>
      <View style={s.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href === '/(tabs)' && pathname === '/');
          return (
            <TouchableOpacity
              key={item.href}
              style={[s.navItem, active && s.navItemActive]}
              onPress={() => router.push(item.href as any)}
            >
              <Text style={s.navIcon}>{item.icon}</Text>
              <Text style={[s.navLabel, active && s.navLabelActive]}>{t(item.label as any)}</Text>
              {active && <View style={s.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sidebar: {
      width: 220,
      height: '100%' as any,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.surfaceBorder,
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.md,
    },
    logo: {
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xl,
    },
    logoText: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    nav: { gap: spacing.xs },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
      position: 'relative',
    },
    navItemActive: {
      backgroundColor: colors.primary + '14',
    },
    navIcon: { fontSize: 18 },
    navLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.textSecondary,
      flex: 1,
    },
    navLabelActive: {
      color: colors.primary,
      fontWeight: fontWeight.semibold,
    },
    activeIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
  });
```

**Step 2: Add nav translation keys to all 3 locales**

In `translations.ts`, add to es/en/pt:
```
'nav.home': 'Inicio' / 'Home' / 'Início'
'nav.feed': 'Feed' / 'Feed' / 'Feed'
'nav.groups': 'Grupos' / 'Groups' / 'Grupos'
'nav.history': 'Historial' / 'History' / 'Histórico'
'nav.profile': 'Perfil' / 'Profile' / 'Perfil'
```

**Step 3: Wrap tab layout for web**

In `apps/mobile/app/(tabs)/_layout.tsx`, detect Platform.OS:
- On web: render `<View style={{ flexDirection: 'row', flex: 1 }}><WebSidebar /><Slot /></View>` and hide the default tab bar
- On native: keep existing tab bar unchanged

**Step 4: Export WebSidebar from index**

**Step 5: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/src/components/WebSidebar.tsx apps/mobile/app/(tabs)/_layout.tsx apps/mobile/src/i18n/translations.ts apps/mobile/src/components/index.ts
git commit -m "feat(web): add responsive sidebar navigation for web layout"
```

---

## Task 13: Final — verify all screens, typecheck, lint

**Step 1: Run typecheck**
```bash
pnpm --filter @lavaca/mobile typecheck
```
Expected: zero errors.

**Step 2: Run lint**
```bash
pnpm --filter @lavaca/mobile lint
```
Expected: zero warnings.

**Step 3: Start web and do visual review**
```bash
cd apps/mobile && npx expo start --web
```
Check: Home, Session, Profile, History, Feed on web — sidebar visible, layout not broken.

**Step 4: Final commit**
```bash
git add -A
git commit -m "feat(frontend): phase 1 complete — redesign + web layout + new components"
```

---

## Phase 1 Definition of Done

- [ ] `react-native-reanimated` installed and configured
- [ ] `Avatar`, `StatusPill`, `AnimatedCard`, `SplitBar`, `WebSidebar` components created
- [ ] All screens use new components
- [ ] Web sidebar navigation works
- [ ] Profile date alignment fixed
- [ ] Premium banner placeholder on Profile
- [ ] `pnpm --filter @lavaca/mobile typecheck` → 0 errors
- [ ] All new strings in es + en + pt
