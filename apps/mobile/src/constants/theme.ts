export type ColorScheme = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceBorder: string;
  primary: string;
  primaryDark: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
  warning: string;
  success: string;
  white: string;
}

export const darkColors: ThemeColors = {
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceBorder: '#2d3a5e',
  primary: '#4ade80',
  primaryDark: '#22c55e',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#4ade80',
  white: '#ffffff',
};

export const lightColors: ThemeColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceBorder: '#e2e8f0',
  primary: '#16a34a',
  primaryDark: '#15803d',
  text: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
  white: '#ffffff',
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
