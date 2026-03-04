export type ColorScheme = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceBorder: string;
  primary: string;
  primaryDark: string;
  accent: string;
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

export const darkColors: ThemeColors = {
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceBorder: '#2d3a5e',
  primary: '#4ade80',
  primaryDark: '#22c55e',
  accent: '#38bdf8',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#4ade80',
  white: '#ffffff',
  // Glassmorphism
  glass: 'rgba(22, 33, 62, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.85)',
  // Status tokens
  statusOpen: '#4ade80',
  statusClosed: '#ef4444',
  statusCancelled: '#64748b',
  statusPending: '#f59e0b',
  statusOpenBg: 'rgba(74, 222, 128, 0.13)',
  statusClosedBg: 'rgba(239, 68, 68, 0.13)',
  statusCancelledBg: 'rgba(100, 116, 139, 0.13)',
  statusPendingBg: 'rgba(245, 158, 11, 0.13)',
};

export const lightColors: ThemeColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceBorder: '#e2e8f0',
  primary: '#16a34a',
  primaryDark: '#15803d',
  accent: '#0284c7',
  text: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
  white: '#ffffff',
  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.65)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  // Status tokens
  statusOpen: '#16a34a',
  statusClosed: '#dc2626',
  statusCancelled: '#475569',
  statusPending: '#d97706',
  statusOpenBg: 'rgba(22, 163, 74, 0.12)',
  statusClosedBg: 'rgba(220, 38, 38, 0.12)',
  statusCancelledBg: 'rgba(71, 85, 105, 0.12)',
  statusPendingBg: 'rgba(217, 119, 6, 0.12)',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};
