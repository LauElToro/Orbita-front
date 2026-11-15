import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { api, sesionCliente } from '../api';
import { Logo } from '../components/Sitio';
import { Badge, ErrorMsg, Section, UsoBar } from '../components/ui';
import { ESTADO_PAGO, MEDIO, fecha, pesos } from '../format';
import type { Cuenta, MedioPago, Pago, Plan, PlanId, Turno, Uso } from '../types';
import { CanalesForm, GuiaManychat, ManychatForm, PagoBloque, PerfilForm, Simulador, TextosForm } from './formularios';
import { Tutorial } from './Tutorial';
import { useAccionCuenta, useCuenta } from './useCuenta';

export const useCuentaActual = () => useOutletContext<Cuenta>();

function ModalLegal({ cuenta }: { cuenta: Cuenta }) {
  const aceptar = useAccionCuenta();
  const nombres = { terminos: 'Términos y Condiciones', privacidad: 'Política de Privacidad' } as const;
  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-labelledby="legal-titulo">
      <div className="card modal">
        <h2 id="legal-titulo">Actualizamos nuestros documentos</h2>
        <p>Para seguir usando tu cuenta necesitamos que leas y aceptes la versión vigente de:</p>
        <ul>
          {cuenta.legalPendiente.map((d) => (
            <li key={d}>
              <Link to={d === 'terminos' ? '/terminos' : '/privacidad'} target="_blank">
                {nombres[d]}
              </Link>
            </li>
          ))}
        </ul>
        <ErrorMsg error={aceptar.error} />
        <button onClick={() => aceptar.mutate({ path: 'legal/aceptar' })} disabled={aceptar.isPending}>
          Leí y acepto
        </button>
      </div>
    </div>
  );
}

export function CuentaLayout() {
  if (!sesionCliente.get()) return <Navigate to="/ingresar" replace />;
  return <CuentaShell />;
}

function CuentaShell() {
  const navigate = useNavigate();
  const cuenta = useCuenta();
  const salir = () => {
    sesionCliente.clear();
    navigate('/ingresar');
  };
  const c = cuenta.data;
  const listo = Boolean(c?.onboarding.completado);

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/cuenta" className="brand">
          <Logo claro />
        </Link>
        <nav>
          <NavLink to="/cuenta" end>
            Inicio
          </NavLink>
          {listo && (
            <>
              <NavLink to="/cuenta/ia">Mi IA</NavLink>
              <NavLink to="/cuenta/probar">Probar</NavLink>
              <NavLink to="/cuenta/conexion">Conexión</NavLink>
              {c?.negocio.modulos.includes('turnos') && <NavLink to="/cuenta/agenda">Agenda</NavLink>}
            </>
          )}
          <NavLink to="/cuenta/plan">Plan y pagos</NavLink>
          <NavLink to="/cuenta/ajustes">Ajustes</NavLink>
        </nav>
        <span className="muted small topbar-negocio">{c?.negocio.nombre}</span>
        <button className="link" onClick={salir}>
          Salir
        </button>
      </header>
      <main className="content">
        {cuenta.isLoading && <p className="muted">Cargando...</p>}
        <ErrorMsg error={cuenta.error} />
        {c && <Outlet context={c} />}
      </main>
      {c && c.legalPendiente.length > 0 && <ModalLegal cuenta={c} />}
    </div>
  );
}

export function Inicio() {
  const cuenta = useCuentaActual();
  if (!cuenta.onboarding.completado) {
    if (!cuenta.onboarding.requisitos.pago) {
      return (
        <div className="narrow-center">
          <Section title={`¡Bienvenido a Orbita, ${cuenta.usuario?.nombre.split(' ')[0] ?? ''}!`}>
            <p>
              Elegiste el plan <strong>{cuenta.plan.nombre}</strong> con pago por <strong>{MEDIO[cuenta.suscripcion?.medio ?? 'transferencia']}</strong>.
              Cuando se acredite el pago arrancamos con el tutorial para dejar tu IA funcionando.
            </p>
            <PagoBloque cuenta={cuenta} />
            <p className="small muted">
              ¿Querés otro plan o medio de pago? Cambialo en <Link to="/cuenta/plan">Plan y pagos</Link>.
            </p>
          </Section>
        </div>
      );
    }
    return <Tutorial cuenta={cuenta} />;
  }
  return <Resumen cuenta={cuenta} />;
}

function EstadoIA({ cuenta }: { cuenta: Cuenta }) {
  const accion = useAccionCuenta();
  const activo = cuenta.negocio.estado === 'activo';
  const motivo = cuenta.negocio.pausaMotivo;
  return (
    <Section
      title="Tu IA"
      actions={
        activo ? (
          <button className="secondary" onClick={() => confirm('Mientras esté pausada no va a responder mensajes. ¿Pausar?') && accion.mutate({ path: 'pausar' })}>
            Pausar
          </button>
        ) : (
          <button onClick={() => accion.mutate({ path: 'activar' })} disabled={cuenta.suscripcion?.estadoPago !== 'al_dia'}>
            Activar
          </button>
        )
      }
    >
      <p className="estado-ia">
        <span className={`punto ${activo ? 'punto-on' : ''}`} />
        {activo ? 'Respondiendo mensajes' : motivo === 'impago' ? 'Pausada por falta de pago' : 'Pausada'}
      </p>
      {motivo === 'impago' && (
        <p className="small">
          Regularizá el pago en <Link to="/cuenta/plan">Plan y pagos</Link> y se reactiva sola.
        </p>
      )}
      <ErrorMsg error={accion.error} />
    </Section>
  );
}

function BloqueUso() {
  const uso = useQuery({ queryKey: ['cuenta-uso'], queryFn: () => api<Uso>('/cuenta/uso'), refetchInterval: 60_000 });
  return (
    <Section title="Respuestas usadas">
      <ErrorMsg error={uso.error} />
      {uso.data && (
        <div className="grid3">
          <UsoBar label="Hoy" {...uso.data.dia} />
          <UsoBar label="Esta semana" {...uso.data.semana} />
          <UsoBar label="Este período" {...uso.data.mes} reinicia={fecha(uso.data.mes.reinicia)} />
        </div>
      )}
    </Section>
  );
}

function Resumen({ cuenta }: { cuenta: Cuenta }) {
  const sub = cuenta.suscripcion;
  return (
    <>
      <div className="page-head">
        <h1>{cuenta.negocio.nombre}</h1>
        <Link to="/cuenta/probar" className="button secondary">
          Probar mi IA
        </Link>
      </div>
      <div className="split">
        <EstadoIA cuenta={cuenta} />
        <Section title="Plan">
          <dl className="kv">
            <dt>Plan</dt>
            <dd>{cuenta.plan.nombre}</dd>
            <dt>Pago</dt>
            <dd>
              <Badge tone={sub?.estadoPago === 'al_dia' ? 'ok' : sub?.estadoPago === 'impago' ? 'bad' : 'warn'}>
                {sub ? ESTADO_PAGO[sub.estadoPago] : '-'}
              </Badge>
            </dd>
            <dt>Próximo vencimiento</dt>
            <dd>{fecha(sub?.vencimiento)}</dd>
          </dl>
        </Section>
      </div>
      <BloqueUso />
      {cuenta.negocio.modulos.includes('turnos') && <ProximosTurnos limite={5} />}
    </>
  );
}

function ProximosTurnos({ limite }: { limite?: number }) {
  const turnos = useQuery({ queryKey: ['cuenta-turnos'], queryFn: () => api<Turno[]>('/cuenta/turnos'), refetchInterval: 60_000 });
  const lista = limite ? turnos.data?.slice(0, limite) : turnos.data;
  return (
    <Section title="Próximos turnos" actions={limite ? <Link to="/cuenta/agenda">Ver agenda</Link> : undefined}>
      <ErrorMsg error={turnos.error} />
      {lista?.length === 0 && <p className="muted">Todavía no hay turnos.</p>}
      {!!lista?.length && (
        <table className="table">
          <thead>
            <tr>
              <th>Día y hora</th>
              <th>Nombre</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((t) => (
              <tr key={t.id}>
                <td>{fecha(t.fecha, true)}</td>
                <td>{t.nombre}</td>
                <td>{t.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

export function Agenda() {
  return (
    <>
      <h1>Agenda</h1>
      <ProximosTurnos />
    </>
  );
}

export function MiIA() {
  const cuenta = useCuentaActual();
  const [avanzado, setAvanzado] = useState(false);
  const campos = cuenta.negocio.modulos.includes('recordatorios')
    ? (['espera', 'tope', 'handoff', 'recordatorio'] as const)
    : (['espera', 'tope', 'handoff'] as const);
  return (
    <>
      <h1>Mi IA</h1>
      <Section title="Información del negocio">
        <PerfilForm cuenta={cuenta} secciones={['negocio', 'turnos', 'estilo']} boton="Guardar cambios" />
      </Section>
      <Section title="Mensajes fijos">
        <TextosForm cuenta={cuenta} campos={[...campos]} />
      </Section>
      <Section
        title="Instrucciones avanzadas"
        actions={
          <button className="link" onClick={() => setAvanzado(!avanzado)}>
            {avanzado ? 'Ocultar' : 'Mostrar'}
          </button>
        }
      >
        {avanzado ? <PromptAvanzado cuenta={cuenta} /> : <p className="small muted">Las instrucciones que armamos con tu información. Solo si sabés lo que hacés.</p>}
      </Section>
    </>
  );
}

function PromptAvanzado({ cuenta }: { cuenta: Cuenta }) {
  const [prompt, setPrompt] = useState(cuenta.negocio.prompt);
  const guardar = useAccionCuenta();
  return (
    <>
      <p className="small muted">Si después guardás la información del negocio, estas instrucciones se vuelven a generar.</p>
      <textarea aria-label="Instrucciones" rows={14} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <ErrorMsg error={guardar.error} />
      <button disabled={prompt === cuenta.negocio.prompt || guardar.isPending} onClick={() => guardar.mutate({ path: 'prompt', method: 'PUT', body: { prompt } })}>
        Guardar instrucciones
      </button>
      {guardar.isSuccess && <span className="small muted"> Guardado.</span>}
    </>
  );
}

export function Probar() {
  const cuenta = useCuentaActual();
  return (
    <>
      <h1>Probar mi IA</h1>
      <Section title="Simulador">
        <Simulador cuenta={cuenta} />
      </Section>
    </>
  );
}

export function Conexion() {
  const cuenta = useCuentaActual();
  return (
    <>
      <h1>Conexión</h1>
      <Section title="ManyChat">
        <ManychatForm cuenta={cuenta} boton="Guardar" />
      </Section>
      <Section title="Canales">
        <CanalesForm cuenta={cuenta} />
      </Section>
      <Section title="Guía del flujo">
        <GuiaManychat cuenta={cuenta} />
      </Section>
    </>
  );
}

export function PlanYPagos() {
  const cuenta = useCuentaActual();
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });
  const pagos = useQuery({ queryKey: ['cuenta-pagos'], queryFn: () => api<Pago[]>('/cuenta/pagos') });
  const [planId, setPlanId] = useState<PlanId>(cuenta.plan.id);
  const [medio, setMedio] = useState<MedioPago>(cuenta.suscripcion?.medio ?? 'transferencia');
  const cambiar = useAccionCuenta();
  const personalizado = cuenta.plan.id === 'personalizado';

  const guardar = () => {
    const plan = planes.data?.find((p) => p.id === planId);
    if (plan && cuenta.canales.length > plan.maxCanales) {
      alert(`El plan ${plan.nombre} admite ${plan.maxCanales} canal(es). Quitá canales antes de cambiar.`);
      return;
    }
    const body = { ...(planId === cuenta.plan.id ? {} : { planId }), ...(medio === cuenta.suscripcion?.medio ? {} : { medio }) };
    if (confirm('El nuevo importe se aplica desde el próximo período. ¿Confirmás el cambio?')) cambiar.mutate({ path: 'plan', method: 'PATCH', body });
  };

  return (
    <>
      <h1>Plan y pagos</h1>
      <Section title="Pago">
        <PagoBloque cuenta={cuenta} />
        {cuenta.suscripcion?.estadoPago === 'al_dia' && (
          <p className="small muted">
            Próximo vencimiento: {fecha(cuenta.suscripcion.vencimiento)} · {pesos(cuenta.suscripcion.importe)} por{' '}
            {MEDIO[cuenta.suscripcion.medio]}
          </p>
        )}
      </Section>
      <Section title="Cambiar plan o medio de pago">
        {personalizado ? (
          <p>Tu plan es Personalizado. Para cambios de alcance o de medio de pago escribinos y lo coordinamos.</p>
        ) : (
          <>
            <div className="row">
              <select aria-label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value as PlanId)}>
                {planes.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({pesos(medio === 'mercadopago' ? p.precioMercadoPago : p.precioTransferencia)}/mes)
                  </option>
                ))}
              </select>
              <select aria-label="Medio de pago" value={medio} onChange={(e) => setMedio(e.target.value as MedioPago)}>
                <option value="mercadopago">Mercado Pago</option>
                <option value="transferencia">Transferencia</option>
              </select>
              <button onClick={guardar} disabled={cambiar.isPending || (planId === cuenta.plan.id && medio === cuenta.suscripcion?.medio)}>
                Guardar cambio
              </button>
            </div>
            <ErrorMsg error={cambiar.error} />
          </>
        )}
      </Section>
      <Section title="Historial de pagos">
        <ErrorMsg error={pagos.error} />
        {pagos.data?.length === 0 && <p className="muted">Todavía no hay pagos registrados.</p>}
        {!!pagos.data?.length && (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Período</th>
                <th>Medio</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {pagos.data.map((p) => (
                <tr key={p.id}>
                  <td>{fecha(p.createdAt)}</td>
                  <td>{p.periodo}</td>
                  <td>{MEDIO[p.medio]}</td>
                  <td>{pesos(p.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </>
  );
}

export function Ajustes() {
  const cuenta = useCuentaActual();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const cambiar = useMutation({
    mutationFn: () => api<{ ok: true }>('/cuenta/password', { method: 'POST', body: { actual, nueva } }),
    onSuccess: () => {
      setActual('');
      setNueva('');
    },
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    cambiar.mutate();
  };
  return (
    <>
      <h1>Ajustes</h1>
      <Section title="Tu cuenta">
        <dl className="kv">
          <dt>Nombre</dt>
          <dd>{cuenta.usuario?.nombre}</dd>
          <dt>Email</dt>
          <dd>{cuenta.usuario?.email}</dd>
          <dt>Negocio</dt>
          <dd>{cuenta.negocio.nombre}</dd>
        </dl>
      </Section>
      <Section title="Cambiar contraseña">
        <form onSubmit={enviar} className="narrow">
          <label>
            Contraseña actual
            <input type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
          </label>
          <label>
            Nueva contraseña
            <input type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={8} />
          </label>
          <ErrorMsg error={cambiar.error} />
          {cambiar.isSuccess && <p className="ok-msg">Contraseña actualizada.</p>}
          <button type="submit" disabled={cambiar.isPending}>
            Cambiar contraseña
          </button>
        </form>
      </Section>
      <Section title="Legal y baja">
        <p className="small">
          <Link to="/terminos" target="_blank">
            Términos y Condiciones
          </Link>{' '}
          ·{' '}
          <Link to="/privacidad" target="_blank">
            Política de Privacidad
          </Link>
        </p>
        <p className="small muted">
          Podés pausar tu IA desde Inicio en cualquier momento. Para dar de baja el servicio escribinos; si contrataste hace menos de 10 días podés usar el{' '}
          <Link to="/arrepentimiento">botón de arrepentimiento</Link>.
        </p>
      </Section>
    </>
  );
}
