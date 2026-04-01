export type ColorScheme = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surface2: string;        // elevated surface — cards on top of surface
  surface3: string;
  surfaceBorder: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;          // dorado — golden peso tone
  accentSoft: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  focusRing: string;
  danger: string;
  warning: string;
  success: string;
  white: string;
  // Glassmorphism
  glass: string;
  glassBorder: string;
  overlay: string;
  overlayStrong: string;
  tabBar: string;
  tabIndicator: string;
  cardGlow: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  eventRouletteWin: string;
  eventRouletteCoward: string;
  eventFastPayer: string;
  eventSessionClosed: string;
  eventDebtReminder: string;
  // Status tokens (centralised — no more hardcoded hex in components)
  statusOpen: string;
  statusClosed: string;
  statusCancelled: string;
  statusPending: string;
  statusOpenBg: string;
  statusClosedBg: string;
  statusCancelledBg: string;
  statusPendingBg: string;
}

// ── Dark — Espresso & Dorado ─────────────────────────────
// Inspired by the warm interior of a Colombian café at night:
// deep tobacco shadows, golden peso bills, tropical emerald money
export const darkColors: ThemeColors = {
  background:    '#060910',
  surface:       '#101827',
  surface2:      '#152135',
  surface3:      '#1b2b45',
  surfaceBorder: 'rgba(126, 151, 194, 0.24)',
  primary:       '#4ff3c8',
  primaryDark:   '#1cc9a0',
  primarySoft:   'rgba(79, 243, 200, 0.18)',
  accent:        '#7ea8ff',
  accentSoft:    'rgba(126, 168, 255, 0.2)',
  text:          '#ecf4ff',
  textSecondary: '#b8c7df',
  textMuted:     '#8e9db6',
  focusRing:     '#94b4ff',
  danger:        '#ff667e',
  warning:       '#ffcf6b',
  success:       '#4ff3c8',
  white:         '#ffffff',
  // Glassmorphism
  glass:         'rgba(17, 26, 40, 0.68)',
  glassBorder:   'rgba(154, 184, 255, 0.24)',
  overlay:       'rgba(4, 8, 16, 0.76)',
  overlayStrong: 'rgba(2, 5, 10, 0.9)',
  tabBar:        'rgba(8, 14, 24, 0.93)',
  tabIndicator:  '#4ff3c8',
  cardGlow:      'rgba(126, 168, 255, 0.2)',
  gradientStart: '#050913',
  gradientMid:   '#0c1a2f',
  gradientEnd:   '#132544',
  eventRouletteWin: '#9f8fff',
  eventRouletteCoward: '#ffb66f',
  eventFastPayer: '#62c6ff',
  eventSessionClosed: '#53f2ad',
  eventDebtReminder: '#ff7ec2',
  // Status tokens
  statusOpen:           '#4ff3c8',
  statusClosed:         '#ff667e',
  statusCancelled:      '#8e9db6',
  statusPending:        '#ffcf6b',
  statusOpenBg:         'rgba(79, 243, 200, 0.14)',
  statusClosedBg:       'rgba(255, 102, 126, 0.14)',
  statusCancelledBg:    'rgba(142, 157, 182, 0.16)',
  statusPendingBg:      'rgba(255, 207, 107, 0.16)',
};

// ── Light — Parchment & Pasto ─────────────────────────────
// Warm Colombian daylight: parchment paper, fresh mint, warm earth
export const lightColors: ThemeColors = {
  background:    '#eef3fb',
  surface:       '#ffffff',
  surface2:      '#f7faff',
  surface3:      '#edf2fb',
  surfaceBorder: 'rgba(83, 110, 156, 0.22)',
  primary:       '#0da586',
  primaryDark:   '#0b7f67',
  primarySoft:   'rgba(13, 165, 134, 0.15)',
  accent:        '#426dca',
  accentSoft:    'rgba(66, 109, 202, 0.16)',
  text:          '#111f36',
  textSecondary: '#384c6f',
  textMuted:     '#5e7294',
  focusRing:     '#335ab8',
  danger:        '#d43e5b',
  warning:       '#be8a20',
  success:       '#0da586',
  white:         '#ffffff',
  // Glassmorphism
  glass:         'rgba(255, 255, 255, 0.8)',
  glassBorder:   'rgba(68, 95, 144, 0.2)',
  overlay:       'rgba(6, 18, 40, 0.45)',
  overlayStrong: 'rgba(5, 14, 30, 0.68)',
  tabBar:        'rgba(244, 248, 255, 0.95)',
  tabIndicator:  '#426dca',
  cardGlow:      'rgba(58, 101, 186, 0.14)',
  gradientStart: '#f5f9ff',
  gradientMid:   '#eaf1fd',
  gradientEnd:   '#dce8fb',
  eventRouletteWin: '#7b66ee',
  eventRouletteCoward: '#d0842a',
  eventFastPayer: '#2f89cc',
  eventSessionClosed: '#10975f',
  eventDebtReminder: '#cc4d97',
  // Status tokens
  statusOpen:           '#0da586',
  statusClosed:         '#d43e5b',
  statusCancelled:      '#5e7294',
  statusPending:        '#be8a20',
  statusOpenBg:         'rgba(13, 165, 134, 0.12)',
  statusClosedBg:       'rgba(212, 62, 91, 0.11)',
  statusCancelledBg:    'rgba(94, 114, 148, 0.11)',
  statusPendingBg:      'rgba(190, 138, 32, 0.12)',
};

// Default export for backward compat — will be overridden by ThemeContext at runtime
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 30,
  hero: 48,
};

export const fontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  black:    '900' as const,
};

export const shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10 },
} as const;

export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
