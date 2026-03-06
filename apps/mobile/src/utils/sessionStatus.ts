import { type ThemeColors } from '../constants/theme';

export type SessionStatus = 'open' | 'closed' | 'cancelled';
export type StatusPillVariant = 'success' | 'muted' | 'error' | 'warning';

export function getSessionAccentColor(status: string, colors: ThemeColors): string {
  switch (status) {
    case 'open': return colors.statusOpen;
    case 'closed': return colors.statusClosed;
    default: return colors.statusCancelled;
  }
}

export function getSessionPillVariant(status: string): StatusPillVariant {
  switch (status) {
    case 'open': return 'success';
    case 'closed': return 'muted';
    default: return 'error';
  }
}
