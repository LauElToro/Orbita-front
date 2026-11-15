import type { ReactNode } from 'react';
import { pesos } from '../format';
import type { MedioPago, Plan } from '../types';

export function beneficiosDe(plan: Plan): string[] {
  const m = plan.modulos;
  return [
    `Hasta ${plan.topeMes.toLocaleString('es-AR')} respuestas por mes`,
    `${plan.maxCanales} ${plan.maxCanales === 1 ? 'canal' : 'canales'} (WhatsApp, Instagram o TikTok)`,
    'Responde preguntas frecuentes con la info de tu negocio',
    m.includes('handoff') && 'Te pasa la conversación cuando hace falta una persona',
    m.includes('turnos') && 'Agenda y cancela turnos solo',
    m.includes('recordatorios') && 'Recordatorios automáticos el día anterior',
    plan.modeloCapaz && 'Modelo de IA más capaz para charlas complejas',
  ].filter((b): b is string => Boolean(b));
}

export const DESTACADO = 'turnos';

export function precioDe(plan: Plan, medio: MedioPago): number {
  return medio === 'mercadopago' ? plan.precioMercadoPago : plan.precioTransferencia;
}

export function PlanCard({
  plan,
  medio,
  seleccionado,
  accion,
}: {
  plan: Plan;
  medio: MedioPago;
  seleccionado?: boolean;
  accion?: ReactNode;
}) {
  return (
    <div className={`plan ${plan.id === DESTACADO ? 'plan-destacado' : ''} ${seleccionado ? 'plan-sel' : ''}`}>
      {plan.id === DESTACADO && <span className="plan-tag">El más elegido</span>}
      <h3>{plan.nombre}</h3>
      <p className="plan-precio">
        {pesos(precioDe(plan, medio))}
        <span>/mes</span>
      </p>
      <p className="small muted">Débito automático con Mercado Pago</p>
      <ul className="plan-lista">
        {beneficiosDe(plan).map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {accion}
    </div>
  );
}
