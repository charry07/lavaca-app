export type ColorScheme = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surface2: string;        // elevated surface — cards on top of surface
  surfaceBorder: string;
  primary: string;
  primaryDark: string;
  accent: string;          // dorado — golden peso tone
  text: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
  warning: string;
  success: string;
  white: string;
  // Glassmorphism
  glass: string;
  glassBorder: string;
  overlay: string;
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
  background:    '#0f0f0e',               // near-neutral dark — barely warm
  surface:       '#1a1917',               // one step up — very subtle warmth
  surface2:      '#232220',               // elevated surface — cards
  surfaceBorder: 'rgba(240, 168, 48, 0.10)', // golden amber border, softer
  primary:       '#2ed97b',               // tropical emerald — warm green
  primaryDark:   '#22b866',
  accent:        '#f0a830',               // dorado — Colombian peso gold
  text:          '#f5edd8',               // warm crema
  textSecondary: '#b8a68c',               // warm tan
  textMuted:     '#7a6a54',               // muted warm brown
  danger:        '#f05a5a',
  warning:       '#f0a830',               // same as accent — intentional
  success:       '#2ed97b',
  white:         '#ffffff',
  // Glassmorphism
  glass:         'rgba(30, 23, 16, 0.72)',        // warm dark glass
  glassBorder:   'rgba(240, 168, 48, 0.14)',      // golden border
  overlay:       'rgba(8, 6, 3, 0.88)',
  // Status tokens
  statusOpen:           '#2ed97b',
  statusClosed:         '#f05a5a',
  statusCancelled:      '#7a6a54',
  statusPending:        '#f0a830',
  statusOpenBg:         'rgba(46, 217, 123, 0.12)',
  statusClosedBg:       'rgba(240, 90, 90, 0.12)',
  statusCancelledBg:    'rgba(122, 106, 84, 0.12)',
  statusPendingBg:      'rgba(240, 168, 48, 0.12)',
};

// ── Light — Parchment & Pasto ─────────────────────────────
// Warm Colombian daylight: parchment paper, fresh mint, warm earth
export const lightColors: ThemeColors = {
  background:    '#f9f8f6',               // barely warm white
  surface:       '#ffffff',
  surface2:      '#f2f0ed',               // very light warm gray
  surfaceBorder: 'rgba(160, 120, 60, 0.13)',
  primary:       '#1a9b56',               // deep pasto green
  primaryDark:   '#157843',
  accent:        '#c47c10',               // warm honey-amber
  text:          '#1a1209',               // deep espresso on light
  textSecondary: '#5a4832',               // warm sienna
  textMuted:     '#a08060',               // warm sand
  danger:        '#c0392b',
  warning:       '#c47c10',
  success:       '#1a9b56',
  white:         '#ffffff',
  // Glassmorphism
  glass:         'rgba(255, 248, 240, 0.72)',
  glassBorder:   'rgba(160, 120, 60, 0.14)',
  overlay:       'rgba(20, 12, 0, 0.5)',
  // Status tokens
  statusOpen:           '#1a9b56',
  statusClosed:         '#c0392b',
  statusCancelled:      '#a08060',
  statusPending:        '#c47c10',
  statusOpenBg:         'rgba(26, 155, 86, 0.11)',
  statusClosedBg:       'rgba(192, 57, 43, 0.11)',
  statusCancelledBg:    'rgba(160, 128, 96, 0.11)',
  statusPendingBg:      'rgba(196, 124, 16, 0.11)',
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
