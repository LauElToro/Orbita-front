import type { EstadoPago, TicketEstado } from './types';

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export const pesos = (n: number) => ars.format(n);

export function fecha(iso: string | null | undefined, conHora = false): string {
  if (!iso) return '-';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(d);
}

export const ESTADO_PAGO: Record<EstadoPago, string> = {
  al_dia: 'al día',
  pendiente: 'pendiente',
  impago: 'impago',
};

export const ESTADO_TICKET: Record<TicketEstado, string> = {
  nuevo: 'Nuevo',
  en_gestion: 'En gestión',
  cotizado: 'Cotizado',
  contratado: 'Contratado',
  descartado: 'Descartado',
};

export const MEDIO: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  transferencia: 'Transferencia',
};

export function porcentaje(usado: number, tope: number): number {
  if (tope <= 0) return 100;
  return Math.min(100, Math.round((usado / tope) * 100));
}
