import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, referido } from '../api';
import { Check, ErrorMsg } from '../components/ui';
import { IconoMail, Marco } from '../cuenta/Acceso';
import { pesos } from '../format';
import type { Plan, PlanId } from '../types';

const MODULOS: Record<string, string> = {
  faq: 'Responde preguntas frecuentes con la info de tu negocio',
  handoff: 'Te pasa la charla cuando hace falta una persona',
  turnos: 'Agenda y cancela turnos sola',
  recordatorios: 'Manda recordatorios para que no falten',
};

export function Checkout() {
  const [params, setParams] = useSearchParams();
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });
  const planId = (params.get('plan') as PlanId | null) ?? 'turnos';
  const plan = planes.data?.find((p) => p.id === planId) ?? planes.data?.[0];
  const [email, setEmail] = useState('');
  const [terminos, setTerminos] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);

  const pagar = useMutation({
    mutationFn: () =>
      api<{ initPoint: string }>('/checkout', {
        method: 'POST',
        body: { email, planId: plan?.id, aceptaTerminos: terminos, aceptaPrivacidad: privacidad, ref: referido.get() },
      }),
    onSuccess: ({ initPoint }) => location.assign(initPoint),
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    pagar.mutate();
  };

  return (
    <Marco>
      <form className="auth-form" onSubmit={enviar}>
        <p className="auth-kicker">Checkout</p>
        <h1>
          Contratá tu plan <span>en un minuto</span>
        </h1>
        <p className="auth-sub">Solo necesitamos tu email. Después del pago te llega un link para definir tu contraseña.</p>

        <label>
          Plan
          <span className="auth-control">
            <select aria-label="Plan" value={plan?.id ?? ''} onChange={(e) => setParams({ plan: e.target.value }, { replace: true })}>
              {planes.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {pesos(p.precioMercadoPago)}/mes
                </option>
              ))}
            </select>
          </span>
        </label>

        {plan && (
          <article className="checkout-resumen" aria-label="Resumen del plan">
            <div className="checkout-resumen-head">
              <h2>Plan {plan.nombre}</h2>
              <p className="checkout-precio">
                {pesos(plan.precioMercadoPago)}
                <small>/mes</small>
              </p>
            </div>
            <ul>
              <li>
                {plan.topeMes.toLocaleString('es-AR')} respuestas por mes · {plan.maxCanales} {plan.maxCanales === 1 ? 'canal' : 'canales'}
              </li>
              {plan.modulos.filter((m) => MODULOS[m]).map((m) => (
                <li key={m}>{MODULOS[m]}</li>
              ))}
              {plan.modeloCapaz && <li>Modelo de IA más capaz</li>}
            </ul>
            <p className="checkout-total">
              <span>Total hoy</span>
              <span>{pesos(plan.precioMercadoPago)}</span>
            </p>
          </article>
        )}
        <ErrorMsg error={planes.error} />

        <label>
          Email
          <span className="auth-control">
            <IconoMail />
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </span>
        </label>
        <Check checked={terminos} onChange={setTerminos}>
          Acepto los{' '}
          <Link to="/terminos" target="_blank">
            Términos y Condiciones
          </Link>
          , incluido que las respuestas de la IA pueden contener errores.
        </Check>
        <Check checked={privacidad} onChange={setPrivacidad}>
          Acepto la{' '}
          <Link to="/privacidad" target="_blank">
            Política de Privacidad
          </Link>
          .
        </Check>
        <ErrorMsg error={pagar.error} />
        <button className="auth-submit" type="submit" disabled={!plan || pagar.isPending || !terminos || !privacidad}>
          {pagar.isPending ? 'Abriendo Mercado Pago...' : 'Pagar con Mercado Pago'}
        </button>
        <p className="checkout-nota">Débito mensual con Mercado Pago · Sin permanencia · 10 días para arrepentirte</p>
        <p className="auth-cambio">
          ¿Ya tenés cuenta? <Link to="/ingresar">Iniciá sesión</Link>
        </p>
      </form>
    </Marco>
  );
}

export function CheckoutGracias() {
  return (
    <Marco>
      <div className="auth-form">
        <p className="auth-kicker">Pago iniciado</p>
        <h1>
          ¡Gracias! <span>Revisá tu email</span>
        </h1>
        <p className="auth-sub">
          Te mandamos un link para definir tu contraseña y entrar al panel. La IA se habilita apenas Mercado Pago acredite el pago. Si no ves el
          mail, mirá el correo no deseado.
        </p>
        <Link to="/ingresar" className="button auth-submit">
          Ir a iniciar sesión
        </Link>
        <p className="auth-cambio">
          ¿No te llegó? <Link to="/olvide">Pedí otro link</Link>
        </p>
      </div>
    </Marco>
  );
}
