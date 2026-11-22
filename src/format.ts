import type { EstadoPago, TicketEstado } from './types';

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export const pesos = (n: number) => ars.format(n);

const ZONA = 'America/Argentina/Buenos_Aires';

function claveDia(iso: string, ahora: Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const fmt = (x: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(x);
  const dia = fmt(d);
  if (dia === fmt(ahora)) return 'Hoy';
  if (dia === fmt(new Date(ahora.getTime() - 86_400_000))) return 'Ayer';
  return fecha(iso);
}

/** Hora corta para una burbuja. Vacío si la fecha no se puede leer. */
export function horaDe(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: ZONA }).format(d);
}

/** Fecha de la lista: "Hoy 18:06", "Ayer 11:30" o el día si es más viejo. */
export function cuandoLista(iso: string, ahora = new Date()): string {
  const dia = claveDia(iso, ahora);
  if (!dia) return '';
  if (dia === 'Hoy' || dia === 'Ayer') {
    const hora = horaDe(iso);
    return hora ? `${dia} ${hora}` : dia;
  }
  return dia;
}

export function gruposPorDia<T extends { at?: string }>(items: T[], ahora = new Date()): { dia: string; items: T[] }[] {
  const grupos: { dia: string; items: T[] }[] = [];
  for (const item of items) {
    const dia = item.at ? claveDia(item.at, ahora) : '';
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.dia === dia) ultimo.items.push(item);
    else grupos.push({ dia, items: [item] });
  }
  return grupos;
}

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
};

function plano(valor: string): string {
  return valor.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Nombre, mensaje, teléfono (con +, espacios o guiones) o el UUID de la charla. */
export function coincideCharla(
  item: { nombre: string; ultimo?: string; numero?: string; codigo?: string; id?: string; corpus?: string },
  q: string,
): boolean {
  const consulta = plano(q.trim());
  if (!consulta) return true;
  const bolsa = plano(`${item.nombre} ${item.ultimo ?? ''} ${item.corpus ?? ''} ${item.numero ?? ''} ${item.codigo ?? ''} ${item.id ?? ''}`);
  if (bolsa.includes(consulta)) return true;
  const digitos = consulta.replace(/\D/g, '');
  return digitos.length >= 4 && (item.numero ?? '').replace(/\D/g, '').includes(digitos);
}

export function tieneTelefono(numero?: string): boolean {
  return (numero ?? '').replace(/\D/g, '').length >= 8;
}

export function porcentaje(usado: number, tope: number): number {
  if (tope <= 0) return 100;
  return Math.min(100, Math.round((usado / tope) * 100));
}
