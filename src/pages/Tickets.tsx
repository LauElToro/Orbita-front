import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CanalesEditor, canalesParaEnviar, canalVacio } from '../components/CanalesEditor';
import { Badge, ErrorMsg, Section } from '../components/ui';
import { ESTADO_TICKET, fecha, pesos } from '../format';
import type { Canal, Ficha, Ticket, TicketEstado, TicketTipo } from '../types';
import { slug } from './Alta';

const ESTADOS = Object.keys(ESTADO_TICKET) as TicketEstado[];

export function Tickets() {
  const [filtro, setFiltro] = useState<TicketEstado | ''>('');
  const [tipo, setTipo] = useState<TicketTipo>('ia_personalizada');
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const tickets = useQuery({
    queryKey: ['tickets', filtro, tipo],
    queryFn: () => api<Ticket[]>(`/tickets?${new URLSearchParams({ tipo, ...(filtro ? { estado: filtro } : {}) })}`),
  });
  const actual = tickets.data?.find((t) => t.id === seleccion) ?? null;

  return (
    <>
      <div className="page-head">
        <h1>Tickets</h1>
        <div className="actions">
          <select
            aria-label="Tipo de ticket"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TicketTipo);
              setSeleccion(null);
            }}
          >
            <option value="ia_personalizada">IA personalizada</option>
            <option value="arrepentimiento">Arrepentimientos</option>
          </select>
          <select aria-label="Filtrar por estado" value={filtro} onChange={(e) => setFiltro(e.target.value as TicketEstado | '')}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_TICKET[e]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="muted small">
        {tipo === 'arrepentimiento' ? (
          <>
            Llegan desde el botón de arrepentimiento (<code>/arrepentimiento</code>). La ley pide confirmar la recepción y reintegrar lo abonado:
            respondé dentro de las 24 h y marcalos como descartados al cerrarlos.
          </>
        ) : (
          <>
            Llegan desde el formulario público <code>/contacto</code>. Al contratar se convierten en una ficha con plan Personalizado y abono mensual.
          </>
        )}
      </p>
      <ErrorMsg error={tickets.error} />
      <div className="split">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Empresa</th>
              <th>Rubro</th>
              <th>Estado</th>
              <th>Abono</th>
            </tr>
          </thead>
          <tbody>
            {tickets.data?.map((t) => (
              <tr key={t.id} className={t.id === seleccion ? 'selected' : ''} onClick={() => setSeleccion(t.id)}>
                <td>{fecha(t.createdAt)}</td>
                <td>{t.empresa}</td>
                <td>{t.rubro}</td>
                <td>
                  <Badge tone={t.estado === 'contratado' ? 'ok' : t.estado === 'descartado' ? 'muted' : 'warn'}>{ESTADO_TICKET[t.estado]}</Badge>
                </td>
                <td>{t.importeMensual ? pesos(t.importeMensual) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {actual && <DetalleTicket ticket={actual} />}
      </div>
    </>
  );
}

function DetalleTicket({ ticket }: { ticket: Ticket }) {
  const qc = useQueryClient();
  const [estado, setEstado] = useState(ticket.estado);
  const [importe, setImporte] = useState(ticket.importeMensual?.toString() ?? '');
  const [notas, setNotas] = useState(ticket.notas ?? '');
  useEffect(() => {
    setEstado(ticket.estado);
    setImporte(ticket.importeMensual?.toString() ?? '');
    setNotas(ticket.notas ?? '');
  }, [ticket]);

  const guardar = useMutation({
    mutationFn: () =>
      api<Ticket>(`/tickets/${ticket.id}`, {
        method: 'PATCH',
        body: { estado, importeMensual: importe ? Number(importe) : null, notas: notas || null },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });

  return (
    <div>
      <Section title={ticket.empresa}>
        <dl className="kv">
          <dt>Contacto</dt>
          <dd>
            {ticket.nombre} · <a href={`mailto:${ticket.email}`}>{ticket.email}</a>
          </dd>
          <dt>Rubro</dt>
          <dd>{ticket.rubro}</dd>
          <dt>Necesidad</dt>
          <dd className="pre">{ticket.necesidad}</dd>
        </dl>
        {!ticket.tenantId && (
          <>
            <div className="grid2">
              <label>
                Estado
                <select value={estado} onChange={(e) => setEstado(e.target.value as TicketEstado)}>
                  {ESTADOS.filter((e) => e !== 'contratado').map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_TICKET[e]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Abono mensual acordado (ARS)
                <input type="number" min={1} value={importe} onChange={(e) => setImporte(e.target.value)} />
              </label>
            </div>
            <label>
              Notas internas
              <textarea rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </label>
            <button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
              Guardar ticket
            </button>
            <ErrorMsg error={guardar.error} />
          </>
        )}
        {ticket.tenantId && (
          <p>
            Convertido en la ficha <Link to={`/admin/clientes/${ticket.tenantId}`}>{ticket.tenantId}</Link>.
          </p>
        )}
      </Section>
      {!ticket.tenantId && ticket.importeMensual && ticket.tipo !== 'arrepentimiento' && <ConvertirTicket ticket={ticket} />}
    </div>
  );
}

function ConvertirTicket({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    clientId: slug(ticket.empresa),
    nombre: ticket.empresa,
    medio: 'mercadopago' as const,
    prompt: '',
    canales: [canalVacio()] as Canal[],
  });
  const convertir = useMutation({
    mutationFn: () => api<Ficha>(`/tickets/${ticket.id}/convertir`, { method: 'POST', body: { ...form, canales: canalesParaEnviar(form.canales) } }),
    onSuccess: (ficha) => {
      void qc.invalidateQueries({ queryKey: ['tickets'] });
      void qc.invalidateQueries({ queryKey: ['clientes'] });
      navigate(`/admin/clientes/${ficha.id}`);
    },
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    convertir.mutate();
  };
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <form onSubmit={enviar}>
      <Section title={`Contratar: plan Personalizado a ${pesos(ticket.importeMensual ?? 0)}/mes`}>
        <div className="grid2">
          <label>
            Nombre
            <input value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} required />
          </label>
          <label>
            clientId
            <input value={form.clientId} onChange={(e) => set({ clientId: e.target.value })} required />
          </label>
        </div>
        <CanalesEditor value={form.canales} max={5} onChange={(canales) => set({ canales })} />
        <label>
          Prompt inicial
          <textarea rows={6} value={form.prompt} onChange={(e) => set({ prompt: e.target.value })} />
        </label>
        <ErrorMsg error={convertir.error} />
        <button type="submit" disabled={convertir.isPending}>
          Crear ficha
        </button>
      </Section>
    </form>
  );
}
