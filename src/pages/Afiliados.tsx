import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api, sesionAfiliado } from '../api';
import { Logo } from '../components/Sitio';
import { Badge, Check, Copiar, ErrorMsg, Section } from '../components/ui';
import { Clave, IconoMail, Marco } from '../cuenta/Acceso';
import { pesos } from '../format';
import type { ComisionEstado, PanelAfiliado } from '../types';

export const ESTADO_COMISION: Record<ComisionEstado, { label: string; tone: 'ok' | 'warn' | 'muted' }> = {
  pendiente: { label: 'Pendiente', tone: 'warn' },
  pagada: { label: 'Pagada', tone: 'ok' },
  anulada: { label: 'Anulada', tone: 'muted' },
};

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');

export function AfiliadosRegistro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [terminos, setTerminos] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const registrar = useMutation({
    mutationFn: () => api<{ token: string }>('/afiliados/registro', { method: 'POST', body: { ...form, aceptaTerminos: terminos } }),
    onSuccess: ({ token }) => {
      sesionAfiliado.set(token);
      navigate('/afiliados/panel', { replace: true });
    },
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    registrar.mutate();
  };
  if (sesionAfiliado.get()) return <Navigate to="/afiliados/panel" replace />;
  return (
    <Marco>
      <form className="auth-form" onSubmit={enviar}>
        <p className="auth-kicker">Programa de afiliados</p>
        <h1>
          Recomendá Orbita y <span>llevate el 50%</span>
        </h1>
        <p className="auth-sub">
          Compartí tu link. Por cada comercio que contrate un plan con él, te pagamos la mitad de su primer pago entre 30 y 60 días después de
          que lo abone. No hace falta ser cliente.
        </p>
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
          <Link to="/terminos#afiliados" target="_blank">
            Términos del programa de afiliados
          </Link>
          .
        </Check>
        <ErrorMsg error={registrar.error} />
        <button className="auth-submit" type="submit" disabled={registrar.isPending || !terminos}>
          {registrar.isPending ? 'Creando cuenta...' : 'Quiero mi link'}
        </button>
        <p className="auth-cambio">
          ¿Ya sos afiliado? <Link to="/afiliados/ingresar">Iniciá sesión</Link>
        </p>
      </form>
    </Marco>
  );
}

export function AfiliadosIngresar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useMutation({
    mutationFn: () => api<{ token: string }>('/afiliados/login', { method: 'POST', body: { email, password } }),
    onSuccess: ({ token }) => {
      sesionAfiliado.set(token);
      navigate('/afiliados/panel', { replace: true });
    },
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    login.mutate();
  };
  return (
    <Marco>
      <form className="auth-form" onSubmit={enviar}>
        <p className="auth-kicker">Programa de afiliados</p>
        <h1>
          Entrá a tu <span>panel de afiliado</span>
        </h1>
        <label>
          Email
          <span className="auth-control">
            <IconoMail />
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </span>
        </label>
        <Clave label="Contraseña" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Tu contraseña" />
        <p className="auth-olvide">
          <Link to="/afiliados/olvide">¿Olvidaste tu contraseña?</Link>
        </p>
        <ErrorMsg error={login.error} />
        <button className="auth-submit" type="submit" disabled={login.isPending}>
          {login.isPending ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
        <p className="auth-cambio">
          ¿Todavía no sos afiliado? <Link to="/afiliados">Sumate</Link>
        </p>
      </form>
    </Marco>
  );
}

export function AfiliadosOlvide() {
  const [email, setEmail] = useState('');
  const pedir = useMutation({ mutationFn: () => api<{ ok: true }>('/afiliados/olvide', { method: 'POST', body: { email } }) });
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
          <p className="auth-sub">El link vence a las 24 horas.</p>
          <Link to="/afiliados/ingresar" className="button auth-submit">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={enviar}>
          <p className="auth-kicker">Contraseña de afiliado</p>
          <h1>Elegí una nueva</h1>
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
        </form>
      )}
    </Marco>
  );
}

export function AfiliadosRestablecer() {
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const restablecer = useMutation({
    mutationFn: () => api<{ ok: true }>('/afiliados/restablecer', { method: 'POST', body: { token, password } }),
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
          <Link to="/afiliados/ingresar" className="button auth-submit">
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

export function AfiliadosPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sesion = sesionAfiliado.get();
  const panel = useQuery({ queryKey: ['afiliado'], queryFn: () => api<PanelAfiliado>('/afiliados/me'), enabled: Boolean(sesion) });
  const [cobro, setCobro] = useState('');
  useEffect(() => setCobro(panel.data?.datosCobro ?? ''), [panel.data?.datosCobro]);
  const guardar = useMutation({
    mutationFn: () => api<PanelAfiliado>('/afiliados/me', { method: 'PATCH', body: { datosCobro: cobro.trim() || null } }),
    onSuccess: (data) => qc.setQueryData(['afiliado'], data),
  });
  const salir = () => {
    sesionAfiliado.clear();
    navigate('/afiliados/ingresar');
  };
  if (!sesion) return <Navigate to="/afiliados/ingresar" replace />;
  const d = panel.data;

  return (
    <main className="container afiliado-panel">
      <header className="page-head">
        <div>
          <Link to="/" aria-label="Orbita, inicio">
            <Logo />
          </Link>
          <p className="kicker">Programa de afiliados</p>
          <h1>{d ? `Hola, ${d.nombre}` : 'Tu panel'}</h1>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={salir}>
            Salir
          </button>
        </div>
      </header>
      <ErrorMsg error={panel.error} />
      {d && (
        <>
          <Section title="Tu link de referidos">
            <p className="muted">
              Cada comercio que contrate un plan desde este link (durante 30 días desde que lo abre) te genera el {d.porcentaje}% de su primer pago,
              que te transferimos entre {d.plazo.desde} y {d.plazo.hasta} días después de que el comercio lo abone. El plan Personalizado no suma
              comisión.
            </p>
            <Copiar texto={d.link} />
          </Section>

          <Section title="Resumen">
            <div className="afiliado-totales">
              <div>
                <span className="muted">Referidos</span>
                <strong>{d.referidos.length}</strong>
              </div>
              <div>
                <span className="muted">Por cobrar</span>
                <strong>{pesos(d.totales.pendiente)}</strong>
              </div>
              <div>
                <span className="muted">Cobrado</span>
                <strong>{pesos(d.totales.pagada)}</strong>
              </div>
            </div>
          </Section>

          <Section title="Datos de cobro">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                guardar.mutate();
              }}
            >
              <label>
                CBU, CVU o alias
                <input value={cobro} onChange={(e) => setCobro(e.target.value)} maxLength={300} placeholder="mi.alias.mp" />
              </label>
              <ErrorMsg error={guardar.error} />
              <button type="submit" disabled={guardar.isPending}>
                {guardar.isPending ? 'Guardando...' : guardar.isSuccess ? 'Guardado' : 'Guardar'}
              </button>
            </form>
          </Section>

          <Section title="Comisiones">
            {d.comisiones.length === 0 ? (
              <p className="muted">Todavía no hay comisiones. Aparecen cuando un referido paga su primer mes.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Primer pago</th>
                    <th>Importe</th>
                    <th>Se paga entre</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {d.comisiones.map((c) => (
                    <tr key={c.id}>
                      <td>{fecha(c.createdAt)}</td>
                      <td>{pesos(c.importe)}</td>
                      <td>
                        {fecha(c.pagableDesde)} y {fecha(c.pagarAntes)}
                      </td>
                      <td>
                        <Badge tone={ESTADO_COMISION[c.estado].tone}>{ESTADO_COMISION[c.estado].label}</Badge>
                        {c.pagadaEn && <small className="muted"> {fecha(c.pagadaEn)}</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="Referidos">
            {d.referidos.length === 0 ? (
              <p className="muted">Todavía nadie se registró con tu link.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Alta</th>
                    <th>Comercio</th>
                    <th>Plan</th>
                    <th>Primer pago</th>
                  </tr>
                </thead>
                <tbody>
                  {d.referidos.map((r) => (
                    <tr key={r.id}>
                      <td>{fecha(r.createdAt)}</td>
                      <td>{r.negocio}</td>
                      <td>{r.plan ?? 'Sin plan'}</td>
                      <td>{r.pago ? <Badge tone="ok">Pagó</Badge> : <Badge tone="muted">Pendiente</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </>
      )}
    </main>
  );
}
