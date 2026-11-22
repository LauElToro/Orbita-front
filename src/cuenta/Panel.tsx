import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { api, sesionCliente } from '../api';
import { Icono, type NombreIcono } from '../components/Iconos';
import { PanelShell, type GrupoNav, type ItemNav } from '../components/Shell';
import { Badge, ErrorMsg, PageHead, Section, UsoBar } from '../components/ui';
import { ESTADO_PAGO, MEDIO, fecha, pesos } from '../format';
import type { Cuenta, Pago, Plan, PlanId, Turno, Uso } from '../types';
import { CargarArchivo } from './CargarArchivo';
import { CanalesForm, GuiaCanales, GuiaWeb, PagoBloque, WebForm, PerfilForm, Simulador, TextosForm } from './formularios';
import { ReferidoPlan, ReferidosCuenta } from './Referidos';
import { pasosDe, Tutorial } from './Tutorial';
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

function gruposDe(c: Cuenta | undefined): GrupoNav[] {
  const listo = Boolean(c?.onboarding.completado);
  const explorar = Boolean(c && !c.onboarding.completado && !c.onboarding.requisitos.pago);
  const ver = listo || explorar || Boolean(c?.onboarding.requisitos.pago);
  const items = (lista: (ItemNav | false)[]) => lista.filter((i): i is ItemNav => Boolean(i));
  return [
    { items: [{ to: '/cuenta', label: 'Inicio', icono: 'inicio', end: true }] },
    {
      titulo: 'Tu IA',
      items: items([
        { to: '/cuenta/demo', label: 'Demo', icono: 'demo', etiqueta: 'Gratis' },
        ver && { to: '/cuenta/ia', label: 'Mi IA', icono: 'ia', bloqueado: explorar },
        ver && { to: '/cuenta/probar', label: 'Probar', icono: 'probar', bloqueado: explorar },
        ver && !!c?.negocio.modulos.includes('turnos') && { to: '/cuenta/agenda', label: 'Agenda', icono: 'agenda', bloqueado: explorar },
      ]),
    },
    ...(ver
      ? [
          {
            titulo: 'Canales',
            items: [
              { to: '/cuenta/conexion', label: 'Conexión', icono: 'conexion' as const, bloqueado: explorar },
              { to: '/cuenta/conversaciones', label: 'Conversaciones', icono: 'reloj' as const, bloqueado: explorar },
            ],
          },
        ]
      : []),
    {
      titulo: 'Cuenta',
      items: [
        { to: '/cuenta/plan', label: 'Plan y pagos', icono: 'plan' },
        { to: '/cuenta/referidos', label: 'Referidos', icono: 'clientes' },
        { to: '/cuenta/ajustes', label: 'Ajustes', icono: 'ajustes' },
      ],
    },
  ];
}

function BannerProgreso({ cuenta }: { cuenta: Cuenta }) {
  const { pathname } = useLocation();
  if (cuenta.onboarding.completado || pathname === '/cuenta') return null;
  if (!cuenta.onboarding.requisitos.pago) {
    if (pathname === '/cuenta/demo') return null;
    return (
      <Link to="/cuenta/demo" className="banner-progreso">
        <div>
          <strong>Probá tu IA gratis con tu información</strong>
          <span>Subí un PDF o tu planilla de stock y mirá cómo responde antes de activar tu plan.</span>
        </div>
        <span className="banner-cta">
          Abrir la demo <Icono nombre="flecha" tam={16} />
        </span>
      </Link>
    );
  }
  const total = pasosDe(cuenta).length;
  const pct = Math.round((Math.min(cuenta.onboarding.paso + 1, total) / total) * 100);
  return (
    <Link to="/cuenta" className="banner-progreso">
      <div>
        <strong>Terminá de configurar tu IA</strong>
        <span>Seguí el tutorial donde lo dejaste. Tu progreso se guarda solo.</span>
      </div>
      <span className="banner-pct">{pct}%</span>
    </Link>
  );
}

function CuentaShell() {
  const navigate = useNavigate();
  const cuenta = useCuenta();
  const salir = () => {
    sesionCliente.clear();
    navigate('/ingresar');
  };
  const c = cuenta.data;

  return (
    <PanelShell
      inicio="/cuenta"
      grupos={gruposDe(c)}
      usuario={{ nombre: c?.negocio.nombre ?? 'Tu negocio', detalle: c ? (c.planElegido ? `Plan ${c.plan.nombre}` : 'Sin plan') : undefined }}
      onSalir={salir}
      banner={c && <BannerProgreso cuenta={c} />}
    >
      {cuenta.isLoading && <div className="skeleton" style={{ height: 220 }} />}
      <ErrorMsg error={cuenta.error} />
      {c && <Outlet context={c} />}
      {c && c.legalPendiente.length > 0 && <ModalLegal cuenta={c} />}
    </PanelShell>
  );
}

const primerNombre = (cuenta: Cuenta) => cuenta.usuario?.nombre.split(' ')[0] ?? '';

function FormularioNegocio({ cuenta }: { cuenta: Cuenta }) {
  const [nombre, setNombre] = useState(cuenta.negocio.nombre === 'Mi negocio' ? '' : cuenta.negocio.nombre);
  const [rubro, setRubro] = useState(cuenta.negocio.rubro ?? '');
  const guardar = useAccionCuenta();
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    guardar.mutate({ path: 'negocio', method: 'PATCH', body: { nombre, rubro } });
  };
  return (
    <form onSubmit={enviar} className="narrow">
      <label>
        Nombre del negocio
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} placeholder="Peluquería Luna" />
      </label>
      <label>
        Rubro
        <input value={rubro} onChange={(e) => setRubro(e.target.value)} required minLength={2} placeholder="Gastronomía, estética, indumentaria..." />
      </label>
      <ErrorMsg error={guardar.error} />
      {guardar.isSuccess && <p className="ok-msg">Datos del negocio guardados.</p>}
      <button type="submit" disabled={guardar.isPending || nombre.trim().length < 2 || rubro.trim().length < 2}>
        {guardar.isPending ? 'Guardando...' : 'Guardar datos'}
      </button>
    </form>
  );
}

function Bienvenida({ cuenta }: { cuenta: Cuenta }) {
  return (
    <>
      <PageHead
        title={`¡Bienvenido a Orbita, ${primerNombre(cuenta)}!`}
        sub={
          <>
            {cuenta.planElegido ? (
              <>
                Tu cuenta del plan <strong>{cuenta.plan.nombre}</strong> ya está creada.
              </>
            ) : (
              'Tu cuenta ya está creada.'
            )}{' '}
            Probá la demo gratis y, cuando te convenza, activá tu plan para que atienda en tus canales.
          </>
        }
      />
      {!cuenta.negocio.rubro && (
        <section className="card">
          <p className="paso-titulo">Tu negocio</p>
          <p>Cuando quieras, cargá el nombre y el rubro. También podés hacerlo más tarde desde Ajustes.</p>
          <FormularioNegocio cuenta={cuenta} />
        </section>
      )}
      <div className="inicio-grid">
        <section className="card hero-card">
          <p className="kicker kicker-acento">Gratis · sin tarjeta</p>
          <h2>Probá tu IA con tu propia información</h2>
          <p>Subí un PDF, tu planilla de stock (TSV o CSV) o pegá un texto, prendé las funciones que quieras y chateá con ella como si fueras un cliente.</p>
          <ul className="lista-check">
            <li>Responde con tus precios, stock y políticas</li>
            <li>Dice si estás abierto, toma pedidos y agenda turnos</li>
            <li>Te pasa la charla cuando hace falta</li>
          </ul>
          <div className="actions">
            <Link to="/cuenta/demo" className="button button-lg">
              Abrir la demo <Icono nombre="flecha" tam={16} />
            </Link>
          </div>
        </section>
        <section className="card">
          <p className="paso-titulo">Activá tu plan</p>
          <PagoBloque cuenta={cuenta} />
          {cuenta.planElegido && (
            <p className="small muted">
              ¿Querés otro plan? Cambialo en <Link to="/cuenta/plan">Plan y pagos</Link>.
            </p>
          )}
        </section>
      </div>
      <ol className="pasos-inicio">
        <li>
          <span className="paso-num">1</span>
          <div>
            <strong>Probá la demo</strong>
            <small>Con tus archivos o con datos de ejemplo.</small>
          </div>
        </li>
        <li>
          <span className="paso-num">2</span>
          <div>
            <strong>Activá tu plan</strong>
            <small>Pagás con Mercado Pago y se habilita todo.</small>
          </div>
        </li>
        <li>
          <span className="paso-num">3</span>
          <div>
            <strong>Conectá tus canales</strong>
            <small>WhatsApp, Instagram, TikTok o tu web.</small>
          </div>
        </li>
      </ol>
    </>
  );
}

export function Inicio() {
  const cuenta = useCuentaActual();
  if (!cuenta.onboarding.completado) {
    if (!cuenta.onboarding.requisitos.pago) return <Bienvenida cuenta={cuenta} />;
    return <Tutorial cuenta={cuenta} />;
  }
  return <Resumen cuenta={cuenta} />;
}

const useUso = () => useQuery({ queryKey: ['cuenta-uso'], queryFn: () => api<Uso>('/cuenta/uso'), refetchInterval: 60_000 });

function TarjetaNegocio({ cuenta }: { cuenta: Cuenta }) {
  const accion = useAccionCuenta();
  const uso = useUso();
  const activo = cuenta.negocio.estado === 'activo';
  const motivo = cuenta.negocio.pausaMotivo;
  const conectados = cuenta.canales.filter((c) => c.conectado).length + (cuenta.web.activa ? 1 : 0);
  return (
    <section className="card negocio-card">
      <div className="negocio-portada">
        <span className={`estado-pill ${activo ? 'estado-pill-on' : ''}`}>
          <span className={`punto ${activo ? 'punto-on' : ''}`} />
          {activo ? 'En línea' : 'Fuera de línea'}
        </span>
      </div>
      <div className="negocio-cuerpo">
        <span className="negocio-avatar" aria-hidden="true">
          {cuenta.negocio.nombre.charAt(0).toUpperCase()}
        </span>
        <h2>{cuenta.negocio.nombre}</h2>
        <p className="estado-ia">
          <span className={`punto ${activo ? 'punto-on' : ''}`} />
          {activo ? 'Respondiendo mensajes' : motivo === 'impago' ? 'Pausada por falta de pago' : 'Pausada'}
        </p>
        {motivo === 'impago' && (
          <p className="small">
            Regularizá el pago en <Link to="/cuenta/plan">Plan y pagos</Link> y se reactiva sola.
          </p>
        )}
        <dl className="stats">
          <div>
            <dt>Respuestas hoy</dt>
            <dd>{uso.data?.dia.usado ?? '—'}</dd>
          </div>
          <div>
            <dt>En el período</dt>
            <dd>{uso.data ? `${uso.data.mes.usado.toLocaleString('es-AR')}` : '—'}</dd>
          </div>
          <div>
            <dt>Canales conectados</dt>
            <dd>{conectados}</dd>
          </div>
        </dl>
        <div className="negocio-acciones">
          {activo ? (
            <button className="secondary" onClick={() => confirm('Mientras esté pausada no va a responder mensajes. ¿Pausar?') && accion.mutate({ path: 'pausar' })}>
              Pausar
            </button>
          ) : (
            <button onClick={() => accion.mutate({ path: 'activar' })} disabled={cuenta.suscripcion?.estadoPago !== 'al_dia'}>
              Activar
            </button>
          )}
          <Link to="/cuenta/conexion" className="button secondary">
            Canales
          </Link>
          <Link to="/cuenta/probar" className="button">
            Probar mi IA
          </Link>
        </div>
        <ErrorMsg error={accion.error} />
      </div>
    </section>
  );
}

function BloqueUso() {
  const uso = useUso();
  return (
    <Section title="Respuestas usadas">
      <ErrorMsg error={uso.error} />
      {uso.data && (
        <div className="usos">
          <UsoBar label="Hoy" {...uso.data.dia} reinicia={fecha(uso.data.dia.reinicia)} />
          <UsoBar label="Esta semana" {...uso.data.semana} reinicia={fecha(uso.data.semana.reinicia)} />
          <UsoBar label="Este período" {...uso.data.mes} reinicia={fecha(uso.data.mes.reinicia)} />
        </div>
      )}
    </Section>
  );
}

const MEJORA: Partial<Record<PlanId, { a: string; texto: string }>> = {
  mensajes: { a: 'Turnos', texto: 'tu IA agenda y cancela turnos sola, y sumás un segundo canal.' },
  turnos: { a: 'Completo', texto: 'sumás recordatorios automáticos, un tercer canal y un modelo de IA más capaz.' },
};

const ACCESOS: { to: string; titulo: string; detalle: string; icono: NombreIcono; modulo?: string }[] = [
  { to: '/cuenta/ia', titulo: 'Editar mi IA', detalle: 'Información, tono y preguntas', icono: 'ia' },
  { to: '/cuenta/probar', titulo: 'Simulador', detalle: 'Chateá como si fueras un cliente', icono: 'probar' },
  { to: '/cuenta/demo', titulo: 'Subir archivos a la demo', detalle: 'PDF, planillas de stock y textos', icono: 'demo' },
  { to: '/cuenta/conexion', titulo: 'Conexión', detalle: 'WhatsApp, Instagram, TikTok y web', icono: 'conexion' },
  { to: '/cuenta/agenda', titulo: 'Ver agenda', detalle: 'Los turnos que tomó tu IA', icono: 'agenda', modulo: 'turnos' },
  { to: '/cuenta/plan', titulo: 'Plan y pagos', detalle: 'Vencimiento e historial', icono: 'plan' },
];

function Resumen({ cuenta }: { cuenta: Cuenta }) {
  const sub = cuenta.suscripcion;
  const mejora = MEJORA[cuenta.plan.id];
  return (
    <>
      <PageHead title={`Hola, ${primerNombre(cuenta) || cuenta.negocio.nombre}`} sub="Todo lo de tu IA, en un solo lugar." />
      <TarjetaNegocio cuenta={cuenta} />
      <div className="split">
        <BloqueUso />
        <Section title="Plan" actions={<Link to="/cuenta/plan">Ver detalle</Link>}>
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
      {mejora && (
        <section className="card card-upsell">
          <span className="pill">Plan {cuenta.plan.nombre}</span>
          <p>
            <strong>Con {mejora.a}</strong> {mejora.texto}
          </p>
          <Link to="/cuenta/plan" className="button">
            Mejorar mi plan
          </Link>
        </section>
      )}
      <div className="accesos">
        {ACCESOS.filter((a) => !a.modulo || cuenta.negocio.modulos.includes(a.modulo)).map((a) => (
          <Link key={a.to} to={a.to} className="acceso">
            <span className="icono-tile icono-tile-sm">
              <Icono nombre={a.icono} />
            </span>
            <strong>{a.titulo}</strong>
            <small>{a.detalle}</small>
          </Link>
        ))}
      </div>
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

export function ZonaExplorar({ cuenta, children }: { cuenta: Cuenta; children: ReactNode }) {
  if (cuenta.onboarding.requisitos.pago || cuenta.onboarding.completado) return <>{children}</>;
  return (
    <div className="explorar">
      <section className="card bloqueo">
        <span className="icono-tile icono-tile-acento">
          <Icono nombre="candado" tam={22} />
        </span>
        <div>
          <h2>Disponible con tu plan</h2>
          <p>Estás explorando. Esta parte se habilita cuando se acredita el pago con Mercado Pago. Mientras tanto, probá la demo gratis con tu información.</p>
        </div>
        <div className="actions">
          <Link to="/cuenta/demo" className="button secondary">
            Probar la demo
          </Link>
          <Link to="/cuenta/plan" className="button">
            Activar mi plan
          </Link>
        </div>
      </section>
      <fieldset disabled className="explorar-contenido">
        {children}
      </fieldset>
    </div>
  );
}

export function Agenda() {
  const cuenta = useCuentaActual();
  const conectar = useMutation({
    mutationFn: () => api<{ url: string }>('/cuenta/calendario/iniciar', { method: 'POST' }),
    onSuccess: ({ url }) => location.assign(url),
  });
  const cal = cuenta.calendario;
  return (
    <ZonaExplorar cuenta={cuenta}>
      <PageHead title="Agenda" sub="Los turnos que agendó tu IA. Si conectás un calendario, se copian solos." />
      <Section title="Calendario">
        <p className="small muted">
          Crear, mover o cancelar un turno actualiza el calendario. El recordatorio sigue saliendo de Orbita.
        </p>
        {cal?.conectado ? (
          <p>
            <span className="badge badge-ok">Conectado</span> {cal.email || 'Google Calendar'}
          </p>
        ) : (
          <button type="button" onClick={() => conectar.mutate()} disabled={conectar.isPending}>
            {conectar.isPending ? 'Abriendo Google...' : 'Conectar Google Calendar'}
          </button>
        )}
        <ErrorMsg error={conectar.error} />
      </Section>
      <ProximosTurnos />
    </ZonaExplorar>
  );
}

export function MiIA() {
  const cuenta = useCuentaActual();
  const [avanzado, setAvanzado] = useState(false);
  const campos = cuenta.negocio.modulos.includes('recordatorios')
    ? (['espera', 'tope', 'handoff', 'recordatorio'] as const)
    : (['espera', 'tope', 'handoff'] as const);
  return (
    <ZonaExplorar cuenta={cuenta}>
      <PageHead title="Mi IA" sub="Lo que sabe tu IA de tu negocio y cómo habla con tus clientes." />
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
    </ZonaExplorar>
  );
}

function PromptAvanzado({ cuenta }: { cuenta: Cuenta }) {
  const [prompt, setPrompt] = useState(cuenta.negocio.prompt);
  const guardar = useAccionCuenta();
  return (
    <>
      <p className="small muted">Si después guardás la información del negocio, estas instrucciones se vuelven a generar.</p>
      <CargarArchivo
        exigeTexto
        aceptar=".pdf,.docx,.txt,.md,.csv,.tsv,.json,application/pdf"
        etiqueta="Cargar un archivo en estas instrucciones"
        ayuda="PDF, Word, TXT, CSV o Markdown. El texto se suma al prompt que estás editando."
        onListo={(r) => {
          if (!r.texto) return;
          setPrompt((actual) => `${actual.trim()}\n\n${r.nombre}\n${r.texto}`.trim());
        }}
      />
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
    <ZonaExplorar cuenta={cuenta}>
      <PageHead title="Probar mi IA" sub="Usa tu información y tus módulos reales, pero no reserva turnos, no envía nada ni consume tu plan.">
        <Link to="/cuenta/ia" className="button secondary">
          Ajustar respuestas
        </Link>
      </PageHead>
      <section className="card card-chat probar-chat">
        <Simulador cuenta={cuenta} />
      </section>
    </ZonaExplorar>
  );
}

export function Conexion() {
  const cuenta = useCuentaActual();
  return (
    <ZonaExplorar cuenta={cuenta}>
      <PageHead title="Conexión" sub="Dónde atiende tu IA: tus redes y tu web." />
      <Section title="Canales">
        <CanalesForm cuenta={cuenta} />
      </Section>
      <Section title="Cómo se conecta cada red">
        <GuiaCanales />
      </Section>
      <Section title="Integración web">
        <WebForm cuenta={cuenta} />
        <h3>Dónde pegar el código</h3>
        <GuiaWeb />
      </Section>
    </ZonaExplorar>
  );
}

function Extras({ cuenta }: { cuenta: Cuenta }) {
  const extra = cuenta.extras;
  const pagar = useMutation({
    mutationFn: () => api<{ initPoint: string }>('/cuenta/extras', { method: 'POST' }),
    onSuccess: ({ initPoint }) => location.assign(initPoint),
  });
  if (!extra || extra.cantidad <= 0) return null;
  return (
    <div className="aviso-ventana">
      <p>
        Este período: <strong>{extra.cantidad}</strong> {extra.cantidad === 1 ? 'respuesta extra' : 'respuestas extra'} a{' '}
        {pesos(extra.precio)} cada una.
      </p>
      {extra.pendiente > 0 ? (
        <>
          <p className="small">Cargo aparte del abono: {pesos(extra.pendiente)}.</p>
          <button type="button" onClick={() => pagar.mutate()} disabled={pagar.isPending}>
            {pagar.isPending ? 'Abriendo Mercado Pago...' : 'Pagar mensajes extra'}
          </button>
          <ErrorMsg error={pagar.error} />
        </>
      ) : (
        <p className="small muted">Ese cargo ya está pago.</p>
      )}
    </div>
  );
}

/** Un plan sin ningún pago no tiene período abonado: la baja no deja nada que cobrar. */
function sinCobrar(cuenta: Cuenta) {
  const sub = cuenta.suscripcion;
  return Boolean(sub && sub.estadoPago !== 'al_dia' && sub.tuvoPagos !== true);
}

export function BotonBaja({ cuenta }: { cuenta: Cuenta }) {
  const baja = useAccionCuenta();
  const volver = useAccionCuenta();
  const sub = cuenta.suscripcion;
  if (!sub) return null;
  if (sub.canceladaEn) {
    if (sub.estadoPago === 'al_dia') {
      return (
        <p className="small">
          Diste de baja el {fecha(sub.canceladaEn)}. El plan sigue hasta el {fecha(sub.vencimiento)}. No hay reembolso y no se vuelve a cobrar.
        </p>
      );
    }
    if (sub.tuvoPagos === false) {
      return (
        <div>
          <p className="small">Diste de baja el {fecha(sub.canceladaEn)}. Como no llegaste a pagar, no se cobra nada.</p>
          <button type="button" className="secondary" disabled={volver.isPending} onClick={() => volver.mutate({ path: 'recontratar' })}>
            {volver.isPending ? 'Reabriendo...' : 'Volver a contratar'}
          </button>
          <ErrorMsg error={volver.error} />
        </div>
      );
    }
    return <p className="small">Diste de baja el {fecha(sub.canceladaEn)}. Ese período ya cerró.</p>;
  }
  const gratis = sinCobrar(cuenta);
  return (
    <div>
      {gratis && <p className="small muted">Si no vas a usar el plan, dalo de baja. Como no pagaste, no se cobra nada.</p>}
      <button
        type="button"
        className="secondary"
        disabled={baja.isPending}
        onClick={() => {
          const aviso = gratis
            ? 'Todavía no pagaste. La baja es inmediata y no se cobra nada. ¿Confirmás?'
            : 'La baja corta el débito ahora. No devolvemos el período ya pago. El plan sigue hasta el vencimiento y después no se vuelve a cobrar. ¿Confirmás?';
          if (confirm(aviso)) baja.mutate({ path: 'baja' });
        }}
      >
        {baja.isPending ? 'Dando de baja...' : 'Dar de baja'}
      </button>
      <ErrorMsg error={baja.error} />
    </div>
  );
}

export function PlanYPagos() {
  const cuenta = useCuentaActual();
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });
  const pagos = useQuery({ queryKey: ['cuenta-pagos'], queryFn: () => api<Pago[]>('/cuenta/pagos') });
  const elegido = cuenta.planPendiente?.id ?? cuenta.plan.id;
  const [planId, setPlanId] = useState<PlanId>(elegido);
  const [aviso, setAviso] = useState('');
  const cambiar = useAccionCuenta();
  const personalizado = cuenta.plan.id === 'personalizado';
  const alDia = cuenta.suscripcion?.estadoPago === 'al_dia';
  const pendiente = cuenta.planPendiente;
  const bajaSinPago = Boolean(cuenta.suscripcion?.canceladaEn && cuenta.suscripcion.tuvoPagos === false);

  const guardar = () => {
    const plan = planes.data?.find((p) => p.id === planId);
    if (plan && cuenta.canales.length > plan.maxCanales) {
      setAviso(`El plan ${plan.nombre} admite ${plan.maxCanales} canal(es). Quitá canales antes de cambiar.`);
      return;
    }
    setAviso('');
    cambiar.mutate({ path: 'plan', method: 'PATCH', body: { planId } });
  };

  return (
    <>
      <PageHead
        title="Plan y pagos"
        sub={
          bajaSinPago
            ? 'Este plan no se pagó y está dado de baja. No se cobra nada.'
            : alDia
              ? 'Tu abono, el próximo vencimiento y los pagos registrados.'
              : 'Todavía no pagaste. Podés pagar ahora o dar de baja: si no hubo pago, no se cobra nada.'
        }
      />
      <Section title={bajaSinPago ? 'Estado del plan' : 'Pago'}>
        <PagoBloque cuenta={cuenta} />
        {cuenta.suscripcion?.estadoPago === 'al_dia' && (
          <p className="small muted">
            Próximo vencimiento: {fecha(cuenta.suscripcion.vencimiento)} · {pesos(cuenta.suscripcion.importe)} por Mercado Pago
          </p>
        )}
        <Extras cuenta={cuenta} />
        <BotonBaja cuenta={cuenta} />
      </Section>
      <ReferidoPlan cuenta={cuenta} />
      {cuenta.planElegido && !bajaSinPago && <Section title="Cambiar de plan">
        {personalizado ? (
          <p>Tu plan es Personalizado. Para cambios de alcance escribinos y lo coordinamos.</p>
        ) : (
          <>
            <div className="row">
              <select aria-label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value as PlanId)}>
                {planes.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({pesos(p.precioMercadoPago)}/mes · 20% OFF)
                  </option>
                ))}
              </select>
              <button onClick={guardar} disabled={cambiar.isPending || planId === elegido}>
                Guardar cambio
              </button>
            </div>
            {pendiente ? (
              <p className="small muted">
                {alDia ? (
                  <>
                    Seguís con el plan {cuenta.plan.nombre}. Pasás al plan {pendiente.nombre} cuando se acredite el pago de{' '}
                    {pesos(cuenta.suscripcion?.importe ?? pendiente.precioMercadoPago)}
                    {cuenta.suscripcion ? `, a partir del vencimiento del ${fecha(cuenta.suscripcion.vencimiento)}` : ''}. Para quedarte
                    con el plan {cuenta.plan.nombre}, elegilo y guardá.
                  </>
                ) : (
                  <>
                    Todavía no pagaste. El cobro va a ser el plan {pendiente.nombre} (
                    {pesos(cuenta.suscripcion?.importe ?? pendiente.precioMercadoPago)}). Cuando se acredite, reemplaza al plan{' '}
                    {cuenta.plan.nombre}. Para quedarte con {cuenta.plan.nombre}, elegilo y guardá.
                  </>
                )}
              </p>
            ) : (
              <p className="small muted">
                {alDia
                  ? `El cambio se aplica cuando se acredita el pago del plan nuevo, desde el próximo período. Hasta entonces seguís con el plan ${cuenta.plan.nombre}.`
                  : `Elegí el plan y guardá. Se cobra ese importe cuando pagás. Hasta que se acredite seguís en el plan ${cuenta.plan.nombre}.`}
              </p>
            )}
            {aviso && <p className="error">{aviso}</p>}
            <ErrorMsg error={cambiar.error} />
          </>
        )}
      </Section>}
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

export function Referidos() {
  return (
    <>
      <PageHead
        title="Referidos"
        sub="Cualquier cliente puede recomendar Orbita. Por cada comercio que contrate con tu link te llevás el 50% de su primer pago."
      />
      <ReferidosCuenta titulo="Tu link" />
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
      <PageHead title="Ajustes" sub="Tus datos, tu contraseña y los documentos legales." />
      <Section title="Tu cuenta">
        <dl className="kv">
          <dt>Nombre</dt>
          <dd>{cuenta.usuario?.nombre}</dd>
          <dt>Email</dt>
          <dd>{cuenta.usuario?.email}</dd>
          <dt>Negocio</dt>
          <dd>{cuenta.negocio.nombre}</dd>
          <dt>Rubro</dt>
          <dd>{cuenta.negocio.rubro ?? 'Pendiente'}</dd>
        </dl>
      </Section>
      <Section title="Datos del negocio">
        <FormularioNegocio cuenta={cuenta} />
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
          Podés pausar tu IA desde Inicio en cualquier momento. Si contrataste hace menos de 10 días podés usar el{' '}
          <Link to="/arrepentimiento">botón de arrepentimiento</Link>.
        </p>
        <BotonBaja cuenta={cuenta} />
      </Section>
    </>
  );
}
