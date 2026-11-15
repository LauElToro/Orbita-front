import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, sesionCliente } from '../api';
import { Logo } from '../components/Sitio';
import { Check, ErrorMsg } from '../components/ui';
import { pesos } from '../format';
import type { Plan, PlanId } from '../types';

const SLIDES: { kicker: string; titulo: string; cuerpo: ReactNode }[] = [
  {
    kicker: 'Empezá hoy',
    titulo: 'Tu comercio responde las 24 horas',
    cuerpo: (
      <>
        <p>WhatsApp, Instagram y TikTok, con los precios, horarios y turnos de tu negocio.</p>
        <p className="auth-pill">La cuenta se crea en un minuto</p>
      </>
    ),
  },
  {
    kicker: 'Lo que incluye',
    titulo: 'La IA trabaja con lo que vos cargás',
    cuerpo: (
      <ul className="auth-lista">
        <li>Responde consultas a cualquier hora</li>
        <li>Agenda turnos dentro de tus horarios</li>
        <li>Te pasa la charla cuando hace falta una persona</li>
        <li>La probás en el simulador antes de activarla</li>
        <li>Sin permanencia, y 10 días para arrepentirte</li>
      </ul>
    ),
  },
  {
    kicker: 'Cómo sigue',
    titulo: 'Recorrés el panel y pagás cuando querés',
    cuerpo: (
      <ol className="auth-pasos">
        <li>Creás la cuenta y mirás cómo se configura.</li>
        <li>Cuando te cierra, pagás con Mercado Pago.</li>
        <li>Ahí se habilita el tutorial y la IA empieza a responder.</li>
      </ol>
    ),
  },
];

function Promo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);
  const slide = SLIDES[i];
  return (
    <aside className="auth-promo" aria-label="Por qué Orbita">
      <Link to="/" className="auth-logo" aria-label="Orbita, inicio">
        <Logo claro />
      </Link>
      <article className="auth-tarjeta" key={slide.titulo}>
        <p className="auth-kicker">{slide.kicker}</p>
        <h2>{slide.titulo}</h2>
        {slide.cuerpo}
      </article>
      <div className="auth-dots">
        {SLIDES.map((s, n) => (
          <button key={s.titulo} type="button" className={n === i ? 'on' : ''} aria-label={`Diapositiva ${n + 1}`} onClick={() => setI(n)} />
        ))}
        <span className="auth-flechas">
          <button type="button" aria-label="Anterior" onClick={() => setI((n) => (n + SLIDES.length - 1) % SLIDES.length)}>
            ‹
          </button>
          <button type="button" aria-label="Siguiente" onClick={() => setI((n) => (n + 1) % SLIDES.length)}>
            ›
          </button>
        </span>
      </div>
    </aside>
  );
}

function Marco({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <Promo />
      <section className="auth-panel">
        <Link to="/" className="auth-logo-panel" aria-label="Orbita, inicio">
          <Logo />
        </Link>
        {children}
      </section>
    </div>
  );
}

function IconoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7.1l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function BotonGoogle({ pending, disabled, onClick }: { pending: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="auth-google" disabled={disabled || pending} onClick={onClick}>
      <IconoGoogle />
      {pending ? 'Abriendo Google...' : 'Continuar con Google'}
    </button>
  );
}

function IconoMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Zm2.2.5 6.4 4.3a.7.7 0 0 0 .8 0L19 7H5.2Z" />
    </svg>
  );
}

function IconoCandado() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8 10V8a4 4 0 1 1 8 0v2h1.2A1.8 1.8 0 0 1 19 11.8v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 19.2v-7.4A1.8 1.8 0 0 1 6.8 10H8Zm2 0h4V8a2 2 0 1 0-4 0v2Z" />
    </svg>
  );
}

function Clave({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
  placeholder?: string;
}) {
  const [ver, setVer] = useState(false);
  const id = useId();
  return (
    <div className="auth-clave">
      <label htmlFor={id}>{label}</label>
      <span className="auth-control">
        <IconoCandado />
        <input
          id={id}
          type={ver ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
        />
        <button type="button" className="auth-ojo link" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVer((v) => !v)}>
          {ver ? 'Ocultar' : 'Ver'}
        </button>
      </span>
    </div>
  );
}

export function Registro() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });
  const [form, setForm] = useState({
    negocio: '',
    rubro: '',
    nombre: '',
    email: '',
    password: '',
    planId: (params.get('plan') as PlanId | null) ?? 'turnos',
    medio: 'mercadopago' as const,
  });
  const [terminos, setTerminos] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const puedeGoogle = terminos && privacidad && form.negocio.trim().length >= 2 && form.rubro.trim().length >= 2 && form.nombre.trim().length >= 2;

  const registrar = useMutation({
    mutationFn: () =>
      api<{ token: string }>('/cuenta/registro', {
        method: 'POST',
        body: { ...form, aceptaTerminos: terminos, aceptaPrivacidad: privacidad },
      }),
    onSuccess: ({ token }) => {
      sesionCliente.set(token);
      navigate('/cuenta', { replace: true });
    },
  });
  const google = useMutation({
    mutationFn: () =>
      api<{ url: string }>('/cuenta/google/iniciar', {
        method: 'POST',
        body: {
          modo: 'registro',
          negocio: form.negocio,
          rubro: form.rubro,
          nombre: form.nombre,
          planId: form.planId,
          aceptaTerminos: true,
          aceptaPrivacidad: true,
        },
      }),
    onSuccess: ({ url }) => location.assign(url),
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    registrar.mutate();
  };

  return (
    <Marco>
      <form className="auth-form" onSubmit={enviar}>
        <p className="auth-kicker">Registro gratuito</p>
        <h1>
          Creá tu cuenta y <span>empezá a explorar</span>
        </h1>
        <p className="auth-sub">Entrá al panel en un minuto. La IA se habilita cuando pagás con Mercado Pago.</p>
        <label>
          Plan
          <span className="auth-control">
            <select aria-label="Plan" value={form.planId} onChange={(e) => set({ planId: e.target.value as PlanId })}>
              {planes.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {pesos(p.precioMercadoPago)}/mes
                </option>
              ))}
            </select>
          </span>
        </label>
        <label>
          Nombre del negocio
          <span className="auth-control">
            <input value={form.negocio} onChange={(e) => set({ negocio: e.target.value })} required minLength={2} placeholder="Peluquería Luna" />
          </span>
        </label>
        <label>
          Rubro
          <span className="auth-control">
            <input value={form.rubro} onChange={(e) => set({ rubro: e.target.value })} required minLength={2} placeholder="Gastronomía, estética, indumentaria..." />
          </span>
        </label>
        <label>
          Tu nombre
          <span className="auth-control">
            <input value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} required minLength={2} placeholder="Sofía Pérez" />
          </span>
        </label>
        <label>
          Email
          <span className="auth-control">
            <IconoMail />
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} required placeholder="tu@email.com" />
          </span>
        </label>
        <Clave label="Contraseña" value={form.password} onChange={(password) => set({ password })} autoComplete="new-password" minLength={8} placeholder="Mínimo 8 caracteres" />
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
        <ErrorMsg error={registrar.error ?? google.error} />
        <button className="auth-submit" type="submit" disabled={registrar.isPending || !terminos || !privacidad}>
          {registrar.isPending ? 'Creando cuenta...' : 'Crear mi cuenta'}
        </button>
        <p className="auth-separador">o</p>
        <BotonGoogle pending={google.isPending} disabled={!puedeGoogle} onClick={() => google.mutate()} />
        <p className="auth-cambio">
          ¿Ya tenés cuenta? <Link to="/ingresar">Iniciá sesión</Link>
        </p>
      </form>
    </Marco>
  );
}

export function Ingresar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useMutation({
    mutationFn: () => api<{ token: string }>('/cuenta/login', { method: 'POST', body: { email, password } }),
    onSuccess: ({ token }) => {
      sesionCliente.set(token);
      navigate('/cuenta', { replace: true });
    },
  });
  const google = useMutation({
    mutationFn: () => api<{ url: string }>('/cuenta/google/iniciar', { method: 'POST', body: { modo: 'login' } }),
    onSuccess: ({ url }) => location.assign(url),
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    login.mutate();
  };
  return (
    <Marco>
      <form className="auth-form" onSubmit={enviar}>
        <p className="auth-kicker">Acceso a tu cuenta</p>
        <h1>
          Volvé a <span>Orbita</span>
        </h1>
        <p className="auth-sub">Iniciá sesión con el email y la contraseña de tu cuenta.</p>
        <label>
          Email
          <span className="auth-control">
            <IconoMail />
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </span>
        </label>
        <Clave label="Contraseña" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Tu contraseña" />
        <p className="auth-olvide">
          <Link to="/olvide">¿Olvidaste tu contraseña?</Link>
        </p>
        <ErrorMsg error={login.error ?? google.error} />
        <button className="auth-submit" type="submit" disabled={login.isPending}>
          {login.isPending ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
        <p className="auth-separador">o</p>
        <BotonGoogle pending={google.isPending} onClick={() => google.mutate()} />
        <p className="auth-cambio">
          ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
        </p>
      </form>
    </Marco>
  );
}

export function Olvide() {
  const [email, setEmail] = useState('');
  const pedir = useMutation({
    mutationFn: () => api<{ ok: true }>('/cuenta/olvide', { method: 'POST', body: { email } }),
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    pedir.mutate();
  };
  return (
    <Marco>
      {pedir.isSuccess ? (
        <div className="auth-form">
          <p className="auth-kicker">Revisá tu email</p>
          <h1>Si la cuenta existe, ya enviamos el link</h1>
          <p className="auth-sub">El mensaje llega en unos minutos y el link vence a las 24 horas. Si no lo ves, mirá el correo no deseado.</p>
          <Link to="/ingresar" className="button auth-submit">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={enviar}>
          <p className="auth-kicker">Contraseña</p>
          <h1>Elegí una nueva</h1>
          <p className="auth-sub">Te mandamos un link al email de la cuenta. No hace falta escribirnos.</p>
          <label>
            Email
            <span className="auth-control">
              <IconoMail />
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
            </span>
          </label>
          <ErrorMsg error={pedir.error} />
          <button className="auth-submit" type="submit" disabled={pedir.isPending}>
            {pedir.isPending ? 'Enviando...' : 'Enviar link'}
          </button>
          <p className="auth-cambio">
            <Link to="/ingresar">Volver a iniciar sesión</Link>
          </p>
        </form>
      )}
    </Marco>
  );
}

export function GoogleVuelta() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const hecho = useRef(false);
  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state || params.get('error')) {
      setError('Google no completó el ingreso.');
      return;
    }
    api<{ token: string }>('/cuenta/google/callback', { method: 'POST', body: { code, state } })
      .then(({ token }) => {
        sesionCliente.set(token);
        navigate('/cuenta', { replace: true });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No pudimos entrar con Google'));
  }, [navigate, params]);
  return (
    <Marco>
      <div className="auth-form">
        <h1>{error ? 'No pudimos entrar' : 'Conectando con Google...'}</h1>
        {error ? <p className="error">{error}</p> : <p className="auth-sub">Estamos confirmando la cuenta.</p>}
        {error && (
          <Link to="/ingresar" className="button auth-submit">
            Volver a iniciar sesión
          </Link>
        )}
      </div>
    </Marco>
  );
}

export function Restablecer() {
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const restablecer = useMutation({
    mutationFn: () => api<{ ok: true }>('/cuenta/restablecer', { method: 'POST', body: { token, password } }),
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    restablecer.mutate();
  };
  return (
    <Marco>
      {restablecer.isSuccess ? (
        <div className="auth-form">
          <h1>Listo</h1>
          <p className="auth-sub">Ya podés ingresar con tu nueva contraseña.</p>
          <Link to="/ingresar" className="button auth-submit">
            Iniciar sesión
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={enviar}>
          <p className="auth-kicker">Contraseña nueva</p>
          <h1>Elegí tu contraseña</h1>
          <Clave label="Nueva contraseña" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} />
          <Clave label="Repetila" value={repetir} onChange={setRepetir} autoComplete="new-password" />
          {repetir && repetir !== password && <p className="error">Las contraseñas no coinciden.</p>}
          <ErrorMsg error={restablecer.error} />
          <button className="auth-submit" type="submit" disabled={restablecer.isPending || password.length < 8 || password !== repetir}>
            Guardar contraseña
          </button>
        </form>
      )}
    </Marco>
  );
}
