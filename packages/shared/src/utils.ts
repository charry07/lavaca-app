// La Vaca - Split Calculation Utilities

import { Participant, SplitMode } from './types';

/**
 * Divide un monto en partes iguales.
 * El centavo sobrante se asigna aleatoriamente.
 */
export function splitEqual(totalAmount: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [totalAmount];

  const base = Math.floor((totalAmount * 100) / count) / 100;
  const remainder = Math.round((totalAmount - base * count) * 100) / 100;

  const amounts = Array(count).fill(base);

  if (remainder > 0) {
    const luckyIndex = Math.floor(Math.random() * count);
    amounts[luckyIndex] = Math.round((amounts[luckyIndex] + remainder) * 100) / 100;
  }

  return amounts;
}

/**
 * Divide un monto por porcentajes personalizados.
 * Valida que los porcentajes sumen 100%.
 */
export function splitByPercentage(totalAmount: number, percentages: number[]): number[] {
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error('Los porcentajes deben sumar 100%');
  }
  return percentages.map((p) => Math.round(((totalAmount * p) / 100) * 100) / 100);
}

/**
 * Selecciona un ganador aleatorio para la ruleta.
 * Retorna el indice del participante elegido.
 */
export function rouletteSelect(participantCount: number): number {
  if (participantCount <= 0) throw new Error('Debe haber al menos 1 participante');
  return Math.floor(Math.random() * participantCount);
}

/**
 * Genera un codigo corto para unirse a la sesion (ej: "VACA-3F7K").
 */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'VACA-' + code;
}

/**
 * Formatea un monto en pesos colombianos.
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Mensajes divertidos para recordatorios de deuda.
 */
export function getDebtReminder(
  debtorName: string,
  creditorName: string,
  amount: number,
  daysOverdue: number
): string {
  const formattedAmount = formatCOP(amount);

  if (daysOverdue <= 1) {
    return `Hey, te falta pagar ${formattedAmount} de la ultima salida`;
  } else if (daysOverdue <= 3) {
    return `Le debes ${formattedAmount} a ${creditorName}... y ya lo sabe`;
  } else if (daysOverdue <= 7) {
    return `Van ${daysOverdue} dias. ${creditorName} esta considerando cobrarte intereses emocionales`;
  } else if (daysOverdue <= 15) {
    return `${formattedAmount} le debes a ${creditorName} hace ${daysOverdue} dias. Ya ni te saluda.`;
  } else {
    return `${debtorName}, llevas ${daysOverdue} dias debiendo ${formattedAmount}. ${creditorName} ya te borro de sus contactos.`;
  }
}
