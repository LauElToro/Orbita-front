import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { CanalesEditor } from '../components/CanalesEditor';
import { Badge, Copiar, ErrorMsg, Section, UsoBar } from '../components/ui';
import { ESTADO_PAGO, MEDIO, fecha, pesos } from '../format';
import type { Canal, Ficha as FichaT, Mensajes, Plan, PlanId, Turno, Uso } from '../types';

export function Ficha() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const ficha = useQuery({ queryKey: ['ficha', id], queryFn: () => api<FichaT>(`/clientes/${id}`) });
  const refrescar = (data: FichaT) => {
    qc.setQueryData(['ficha', id], data);
    void qc.invalidateQueries({ queryKey: ['clientes'] });
    void qc.invalidateQueries({ queryKey: ['uso', id] });
  };

  if (ficha.isLoading) return <p className="muted">Cargando...</p>;
  if (ficha.error || !ficha.data) return <ErrorMsg error={ficha.error ?? 'No encontrado'} />;
  const f = ficha.data;

  return (
    <>
      <div className="page-head">
        <h1>{f.nombre}</h1>
        <span className="muted">{f.id}</span>
      </div>
      <BloqueEstado ficha={f} onChange={refrescar} />
      <BloqueCuenta ficha={f} onInvitado={() => void qc.invalidateQueries({ queryKey: ['ficha', id] })} />
      <BloquePlan ficha={f} onChange={refrescar} />
      <BloqueUso id={f.id} />
      <BloqueCanales ficha={f} onChange={refrescar} />
      <BloquePrompt ficha={f} onChange={refrescar} />
      <BloqueTextos ficha={f} onChange={refrescar} />
      {f.modulos.includes('turnos') && <BloqueAgenda id={f.id} conRecordatorios={f.modulos.includes('recordatorios')} />}
      <BloqueIntegracion ficha={f} onChange={refrescar} />
    </>
  );
}

interface BloqueProps {
  ficha: FichaT;
  onChange: (f: FichaT) => void;
}

function useAccion(id: string, onChange: (f: FichaT) => void) {
  return useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) =>
      api<FichaT>(`/clientes/${id}${path}`, { method, body }),
    onSuccess: onChange,
  });
}

function BloqueEstado({ ficha, onChange }: BloqueProps) {
  const accion = useAccion(ficha.id, onChange);
  const sub = ficha.subscription;
  const alDia = sub?.estadoPago === 'al_dia';
  return (
    <Section
      title="Estado"
      actions={
        <>
          {ficha.estado === 'activo' ? (
            <button className="secondary" onClick={() => accion.mutate({ path: '/pausar' })}>
              Pausar
            </button>
          ) : (
            <button onClick={() => accion.mutate({ path: '/activar' })} disabled={!alDia} title={alDia ? '' : 'El pago tiene que estar al día'}>
              Activar
            </button>
          )}
          {sub?.medio === 'transferencia' && (
            <button
              className="secondary"
              onClick={() => confirm('¿Marcar como pagada la transferencia de este mes?') && accion.mutate({ path: '/transferencia' })}
            >
              Marcar transferencia
            </button>
          )}
        </>
      }
    >
      <dl className="kv">
        <dt>Bot</dt>
        <dd>
          <Badge tone={ficha.estado === 'activo' ? 'ok' : 'muted'}>{ficha.estado}</Badge>
          {ficha.pausaMotivo && <span className="muted"> ({ficha.pausaMotivo})</span>}
        </dd>
        <dt>Pago</dt>
        <dd>{sub ? ESTADO_PAGO[sub.estadoPago] : '-'}</dd>
        <dt>Vencimiento</dt>
        <dd>{fecha(sub?.vencimiento)}</dd>
        <dt>Medio</dt>
        <dd>{sub ? MEDIO[sub.medio] : '-'}</dd>
        <dt>Importe</dt>
        <dd>{pesos(ficha.importe)}</dd>
      </dl>
      <ErrorMsg error={accion.error} />
    </Section>
  );
}

function BloqueCuenta({ ficha, onInvitado }: { ficha: FichaT; onInvitado: () => void }) {
  const u = ficha.usuario;
  const [email, setEmail] = useState(ficha.emailContacto ?? '');
  const [nombre, setNombre] = useState('');
  const link = useMutation({
    mutationFn: () =>
      u
        ? api<{ link: string; expira: string }>(`/clientes/${ficha.id}/reset-password`, { method: 'POST' })
        : api<{ link: string; expira: string }>(`/clientes/${ficha.id}/acceso`, { method: 'POST', body: { email, nombre } }),
    onSuccess: () => {
      if (!u) onInvitado();
    },
  });
  return (
    <Section title="Cuenta del cliente">
      {u ? (
        <dl className="kv">
          <dt>Usuario</dt>
          <dd>
            {u.nombre} · {u.email}
          </dd>
          <dt>Registrado</dt>
          <dd>{fecha(u.createdAt)}</dd>
          <dt>Último ingreso</dt>
          <dd>{fecha(u.ultimoLogin, true)}</dd>
        </dl>
      ) : (
        <>
          <p className="small muted">Este cliente todavía no tiene acceso a su panel. Invitalo y pasale el link para que elija su contraseña.</p>
          <div className="row">
            <input aria-label="Email del cliente" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input aria-label="Nombre del cliente" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
        </>
      )}
      {link.data ? (
        <p className="small">
          Link válido hasta el {fecha(link.data.expira, true)}, de un solo uso: <Copiar texto={link.data.link} />
        </p>
      ) : (
        <button className="secondary" onClick={() => link.mutate()} disabled={link.isPending || (!u && (!email || nombre.length < 2))}>
          {u ? 'Generar link para restablecer contraseña' : 'Invitar al panel'}
        </button>
      )}
      <ErrorMsg error={link.error} />
    </Section>
  );
}

function BloquePlan({ ficha, onChange }: BloqueProps) {
  const planes = useQuery({ queryKey: ['planes'], queryFn: () => api<Plan[]>('/planes') });
  const accion = useAccion(ficha.id, onChange);
  const [planId, setPlanId] = useState<PlanId>(ficha.planId);
  const [medio, setMedio] = useState(ficha.subscription?.medio ?? 'transferencia');

  const cambiar = () => {
    const plan = planes.data?.find((p) => p.id === planId);
    if (!plan) return;
    if (ficha.canales.length > plan.maxCanales) {
      alert(`El plan ${plan.nombre} admite ${plan.maxCanales} canal(es). Sacá canales antes de bajar.`);
      return;
    }
    if (!confirm(`Cambiar a ${plan.nombre} reescribe topes y módulos. ¿Seguir?`)) return;
    accion.mutate({ path: '', method: 'PATCH', body: { planId } });
  };

  return (
    <Section title="Plan">
      <dl className="kv">
        <dt>Plan actual</dt>
        <dd>{ficha.plan.nombre}</dd>
        <dt>Topes</dt>
        <dd>
          {ficha.topeDia} por día, {ficha.topeSemana} por semana, {ficha.topeMes} por mes
        </dd>
        <dt>Módulos</dt>
        <dd>{ficha.modulos.join(', ')}</dd>
      </dl>
      <div className="row">
        <select aria-label="Nuevo plan" value={planId} onChange={(e) => setPlanId(e.target.value as PlanId)}>
          {planes.data
            ?.filter((p) => p.id !== 'personalizado' || ficha.planId === 'personalizado' || ficha.precioPersonalizado)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
        </select>
        <button className="secondary" onClick={cambiar} disabled={planId === ficha.planId}>
          Cambiar plan
        </button>
        <select aria-label="Medio de pago" value={medio} onChange={(e) => setMedio(e.target.value as typeof medio)}>
          <option value="mercadopago">Mercado Pago</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <button
          className="secondary"
          disabled={medio === ficha.subscription?.medio}
          onClick={() => accion.mutate({ path: '', method: 'PATCH', body: { medio } })}
        >
          Cambiar medio
        </button>
      </div>
      <ErrorMsg error={accion.error} />
    </Section>
  );
}

function BloqueUso({ id }: { id: string }) {
  const uso = useQuery({ queryKey: ['uso', id], queryFn: () => api<Uso>(`/clientes/${id}/uso`), refetchInterval: 30_000 });
  return (
    <Section title="Uso">
      <ErrorMsg error={uso.error} />
      {uso.data && (
        <div className="grid3">
          <UsoBar label="Hoy" {...uso.data.dia} reinicia={`medianoche (${fecha(uso.data.dia.reinicia)})`} />
          <UsoBar label="Esta semana" {...uso.data.semana} reinicia={`lunes ${fecha(uso.data.semana.reinicia)}`} />
          <UsoBar label="Este mes" {...uso.data.mes} reinicia={`día del abono (${fecha(uso.data.mes.reinicia)})`} />
        </div>
      )}
    </Section>
  );
}

function BloqueCanales({ ficha, onChange }: BloqueProps) {
  const accion = useAccion(ficha.id, onChange);
  const [canales, setCanales] = useState<Canal[]>(ficha.canales.map(({ tipo, endpointId, etiqueta }) => ({ tipo, endpointId, etiqueta })));
  return (
    <Section title="Canales" actions={<button onClick={() => accion.mutate({ path: '', method: 'PATCH', body: { canales } })}>Guardar canales</button>}>
      <CanalesEditor value={canales} max={ficha.plan.maxCanales} onChange={setCanales} />
      <ErrorMsg error={accion.error} />
    </Section>
  );
}

function BloquePrompt({ ficha, onChange }: BloqueProps) {
  const accion = useAccion(ficha.id, onChange);
  const [prompt, setPrompt] = useState(ficha.prompt);
  useEffect(() => setPrompt(ficha.prompt), [ficha.prompt]);
  return (
    <Section
      title="Prompt"
      actions={
        <button disabled={prompt === ficha.prompt} onClick={() => accion.mutate({ path: '/prompt', method: 'PUT', body: { prompt } })}>
          Guardar prompt
        </button>
      }
    >
      <textarea aria-label="Prompt" rows={14} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      {accion.isSuccess && <p className="muted small">Guardado. El próximo mensaje ya usa este texto.</p>}
      <ErrorMsg error={accion.error} />
    </Section>
  );
}

const TEXTOS: { key: keyof Mensajes; label: string }[] = [
  { key: 'espera', label: 'Espera' },
  { key: 'tope', label: 'Tope alcanzado' },
  { key: 'handoff', label: 'Handoff' },
  { key: 'recordatorio', label: 'Recordatorio ({{hora}})' },
];

function BloqueTextos({ ficha, onChange }: BloqueProps) {
  const accion = useAccion(ficha.id, onChange);
  const [mensajes, setMensajes] = useState<Mensajes>(ficha.mensajes);
  return (
    <Section title="Textos fijos" actions={<button onClick={() => accion.mutate({ path: '', method: 'PATCH', body: { mensajes } })}>Guardar textos</button>}>
      <p className="muted small">No pasan por el modelo.</p>
      {TEXTOS.map((t) => (
        <label key={t.key}>
          {t.label}
          <input value={mensajes[t.key]} onChange={(e) => setMensajes({ ...mensajes, [t.key]: e.target.value })} />
        </label>
      ))}
      <ErrorMsg error={accion.error} />
    </Section>
  );
}

function BloqueAgenda({ id, conRecordatorios }: { id: string; conRecordatorios: boolean }) {
  const turnos = useQuery({ queryKey: ['turnos', id], queryFn: () => api<Turno[]>(`/clientes/${id}/turnos`) });
  return (
    <Section title="Agenda">
      <ErrorMsg error={turnos.error} />
      {turnos.data?.length === 0 && <p className="muted">Sin turnos.</p>}
      {!!turnos.data?.length && (
        <table className="table">
          <thead>
            <tr>
              <th>Día y hora</th>
              <th>Nombre</th>
              <th>Estado</th>
              {conRecordatorios && <th>Recordatorio</th>}
            </tr>
          </thead>
          <tbody>
            {turnos.data.map((t) => (
              <tr key={t.id}>
                <td>{fecha(t.fecha, true)}</td>
                <td>{t.nombre}</td>
                <td>{t.estado}</td>
                {conRecordatorios && <td>{t.recordatorioEnviado ? 'enviado' : 'pendiente'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function BloqueIntegracion({ ficha, onChange }: BloqueProps) {
  const accion = useAccion(ficha.id, onChange);
  const [appToken, setAppToken] = useState('');
  const base = `${location.origin}/api/webhooks/manychat`;
  return (
    <Section title="Integración ManyChat">
      <dl className="kv">
        <dt>pageId</dt>
        <dd>{ficha.pageId ?? 'sin cargar'}</dd>
        <dt>appToken</dt>
        <dd>{ficha.appTokenMask ?? 'sin cargar'}</dd>
        <dt>X-Orbita-Key</dt>
        <dd>
          <code>{ficha.apiKey}</code>
        </dd>
        <dt>Entrada</dt>
        <dd>
          <code>POST {base}/entrada</code>
        </dd>
        <dt>Salida</dt>
        <dd>
          <code>GET {base}/salida?messageId=...</code>
        </dd>
        <dt>Página del cliente</dt>
        <dd>
          <a href={ficha.linkPublico} target="_blank" rel="noreferrer">
            {ficha.linkPublico}
          </a>
        </dd>
      </dl>
      <div className="row">
        <input
          type="password"
          aria-label="Nuevo appToken"
          placeholder="Reemplazar appToken"
          value={appToken}
          onChange={(e) => setAppToken(e.target.value)}
        />
        <button
          className="secondary"
          disabled={!appToken}
          onClick={() => accion.mutate({ path: '', method: 'PATCH', body: { appToken } }, { onSuccess: () => setAppToken('') })}
        >
          Reemplazar
        </button>
      </div>
      <ErrorMsg error={accion.error} />
    </Section>
  );
}
