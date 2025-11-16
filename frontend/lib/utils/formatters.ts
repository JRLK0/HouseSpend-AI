import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: es });
  } catch {
    return date;
  }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    return format(parseISO(date), 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return date;
  }
}

