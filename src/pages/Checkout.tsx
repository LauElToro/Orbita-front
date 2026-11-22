import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, referido } from '../api';
import { beneficiosDe, Oferta, OFERTA_LEYENDA } from '../components/Planes';
import { Marca } from '../components/Marca';
import { Logo } from '../components/Sitio';
import { Check, ErrorMsg } from '../components/ui';
import { pesos } from '../format';
import type { Plan, PlanId } from '../types';

const RESUMEN: Record<string, string> = {
  mensajes: 'Responde las preguntas de tus clientes',
  turnos: 'Responde y agenda turnos sola',
  completo: 'Responde, agenda y manda recordatorios',
};

function Pagina({ children }: { children: ReactNode }) {
  return (
    <div className="checkout">
      <header className="checkout-top">
        <Link to="/" aria-label="Orbita, inicio">
          <Logo />
        </Link>
      </header>
      <main className="checkout-main">{children}</main>
    </div>
  );
}

export function Checkout() {
  const [params, setParams] = useSearchParams();
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });
  const planId = (params.get('plan') as PlanId | null) ?? 'turnos';
  const plan = planes.data?.find((p) => p.id === planId) ?? planes.data?.[0];
  const [email, setEmail] = useState('');
  const [terminos, setTerminos] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);
  const codigo = referido.get();

  const pagar = useMutation({
    mutationFn: () =>
      api<{ initPoint: string }>('/checkout', {
        method: 'POST',
        body: { email, planId: plan?.id, aceptaTerminos: terminos, aceptaPrivacidad: privacidad, ref: codigo },
      }),
    onSuccess: ({ initPoint }) => location.assign(initPoint),
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    pagar.mutate();
  };
  const elegir = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('plan', id);
    setParams(next, { replace: true });
  };

  return (
    <Pagina>
      <Link to="/" className="checkout-volver">
        ← Volver
      </Link>
      <h1>Activá tu IA</h1>
      <p className="checkout-sub">Elegí el plan y empezá a atender hoy.</p>

      <form className="checkout-card" onSubmit={enviar}>
        <section className="checkout-col" aria-label="Tu plan">
          <p className="checkout-kicker">Tu plan</p>
          {plan ? (
            <>
              <div className="checkout-planbox">
                <span className="checkout-plan-icono" aria-hidden="true">
                  <Marca />
                </span>
                <div className="checkout-plan-nombre">
                  <h2>Plan {plan.nombre}</h2>
                  <p>{RESUMEN[plan.id] ?? beneficiosDe(plan)[0]}</p>
                </div>
                <label className="checkout-cambiar">
                  Cambiar
                  <select aria-label="Plan" value={plan.id} onChange={(e) => elegir(e.target.value)}>
                    {planes.data?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} · {pesos(p.precioMercadoPago)}/mes
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="checkout-precio">
                {pesos(plan.precioMercadoPago)}
                <small>/mes</small>
              </p>
              <Oferta precio={plan.precioMercadoPago} />
              <p className="checkout-cobro">Se cobra hoy y cada mes. Lo das de baja cuando quieras, desde el panel.</p>

              <p className="checkout-kicker checkout-kicker-incluye">Qué incluye tu plan</p>
              <ul className="checkout-incluye">
                {beneficiosDe(plan).map((b) => (
                  <li key={b}>
                    <span aria-hidden="true">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <p className="checkout-oferta">{OFERTA_LEYENDA}</p>
            </>
          ) : (
            <p className="checkout-cobro">{planes.isLoading ? 'Cargando el plan...' : 'No pudimos cargar los planes.'}</p>
          )}
          <ErrorMsg error={planes.error} />
        </section>

        <section className="checkout-col">
          <label className="checkout-campo">
            <span className="checkout-kicker">Tu email</span>
            <input
              type="email"
              aria-label="Tu email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tunombre@email.com"
            />
          </label>
          <p className="checkout-ayuda">Con este email activás tu cuenta al pagar. Si ya tenés una y todavía no pagaste, seguimos con esa.</p>

          <fieldset className="checkout-medios">
            <legend className="checkout-kicker">Cómo querés pagar</legend>
            <label className="checkout-medio">
              <input type="radio" name="medio" value="mercadopago" checked onChange={() => undefined} />
              <span>
                <strong>Mercado Pago</strong>
                <small>Débito mensual con tarjeta o dinero en cuenta.</small>
              </span>
            </label>
          </fieldset>

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
          {codigo && <p className="checkout-ref">Código de referido aplicado.</p>}
          <ErrorMsg error={pagar.error} />
          <button className="checkout-cta" type="submit" disabled={!plan || pagar.isPending || !terminos || !privacidad}>
            {pagar.isPending ? 'Abriendo Mercado Pago...' : 'Pagar y activar mi cuenta'}
          </button>
          <p className="checkout-seguro">Pago en Mercado Pago. Al acreditarse, te llega el link para crear tu contraseña y entrar al panel.</p>
          <p className="checkout-cuenta">
            ¿Ya tenés cuenta? <Link to="/ingresar">Iniciá sesión</Link>
          </p>
        </section>
      </form>
    </Pagina>
  );
}

export function CheckoutGracias() {
  return (
    <Pagina>
      <div className="checkout-gracias">
        <p className="checkout-kicker">Pago iniciado</p>
        <h1>Revisá tu email</h1>
        <p className="checkout-sub">
          Te mandamos un link para definir tu contraseña y entrar al panel. La IA se habilita apenas Mercado Pago acredite el pago. Si no ves el
          mail, mirá el correo no deseado.
        </p>
        <Link to="/ingresar" className="button checkout-cta">
          Ir a iniciar sesión
        </Link>
        <p className="checkout-cuenta">
          ¿No te llegó? <Link to="/olvide">Pedí otro link</Link>
        </p>
      </div>
    </Pagina>
  );
}
