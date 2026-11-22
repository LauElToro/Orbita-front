import type { ReactNode } from 'react';
import { pesos } from '../format';
import type { Plan } from '../types';

export function beneficiosDe(plan: Plan): string[] {
  const m = plan.modulos;
  return [
    `Hasta ${plan.topeMes.toLocaleString('es-AR')} respuestas por mes`,
    `${plan.maxCanales} ${plan.maxCanales === 1 ? 'canal' : 'canales'} (WhatsApp, Instagram o TikTok)`,
    'Responde preguntas frecuentes con la info de tu negocio',
    m.includes('handoff') && 'Te pasa la conversación cuando hace falta una persona',
    m.includes('turnos') && 'Agenda, mueve y cancela turnos, y los copia a tu calendario',
    plan.precioMensajeExtra ? `Respuesta extra: ${pesos(plan.precioMensajeExtra)}, sin cambiar de plan` : false,
    m.includes('recordatorios') && 'Recordatorios automáticos el día anterior',
    plan.modeloCapaz && 'Modelo de IA más capaz para charlas complejas',
  ].filter((b): b is string => Boolean(b));
}

export const DESTACADO = 'turnos';

export const OFERTA_LEYENDA = 'Oferta 20% OFF en planes mensuales y anuales por 1 año';

// Solo marketing: el precio cobrado no cambia, se muestra un precio "antes" un 20% más alto.
export const precioAntes = (precio: number) => Math.round(precio / 0.8 / 100) * 100;

export function Oferta({ precio, className = 'oferta' }: { precio: number; className?: string }) {
  return (
    <span className={className}>
      <s>{pesos(precioAntes(precio))}</s>
      <b>20% OFF</b>
    </span>
  );
}

export function precioDe(plan: Plan): number {
  return plan.precioMercadoPago;
}

export function PlanCard({
  plan,
  seleccionado,
  accion,
}: {
  plan: Plan;
  seleccionado?: boolean;
  accion?: ReactNode;
}) {
  return (
    <div className={`plan ${plan.id === DESTACADO ? 'plan-destacado' : ''} ${seleccionado ? 'plan-sel' : ''}`}>
      {plan.id === DESTACADO && <span className="plan-tag">El más elegido</span>}
      <h3>{plan.nombre}</h3>
      <Oferta precio={precioDe(plan)} />
      <p className="plan-precio">
        {pesos(precioDe(plan))}
        <span>/mes</span>
      </p>
      <p className="small muted">{OFERTA_LEYENDA} · Débito automático con Mercado Pago</p>
      <ul className="plan-lista">
        {beneficiosDe(plan).map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {accion}
    </div>
  );
}
