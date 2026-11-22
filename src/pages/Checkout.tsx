import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
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

function SelectorPlan({
  planes,
  plan,
  onElegir,
}: {
  planes: Plan[];
  plan: Plan;
  onElegir: (id: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', afuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', afuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return (
    <div className="checkout-plan-elige" ref={caja}>
      <div className="checkout-planbox">
        <span className="checkout-plan-icono" aria-hidden="true">
          <Marca />
        </span>
        <div className="checkout-plan-nombre">
          <h2>Plan {plan.nombre}</h2>
          <p>{RESUMEN[plan.id] ?? beneficiosDe(plan)[0]}</p>
        </div>
        <button
          type="button"
          className="checkout-cambiar-btn"
          aria-label="Cambiar plan"
          aria-expanded={abierto}
          aria-haspopup="listbox"
          onClick={() => setAbierto((v) => !v)}
        >
          Cambiar
        </button>
      </div>
      {abierto && (
        <ul className="checkout-menu" role="listbox" aria-label="Planes">
          {planes.map((p) => {
            const elegido = p.id === plan.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  className="checkout-opcion"
                  aria-selected={elegido}
                  onClick={() => {
                    onElegir(p.id);
                    setAbierto(false);
                  }}
                >
                  <span className="checkout-opcion-texto">
                    <strong>
                      {p.nombre}
                      {elegido && <em>Elegido</em>}
                    </strong>
                    <small>
                      {RESUMEN[p.id] ?? beneficiosDe(p)[0]} · {p.topeMes.toLocaleString('es-AR')} respuestas · {p.maxCanales}{' '}
                      {p.maxCanales === 1 ? 'canal' : 'canales'}
                    </small>
                  </span>
                  <span className="checkout-opcion-precio">
                    {pesos(p.precioMercadoPago)}
                    <small>/mes</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

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
              <SelectorPlan planes={planes.data ?? [plan]} plan={plan} onElegir={elegir} />

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
