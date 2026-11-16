import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ErrorMsg, Section } from '../components/ui';
import { ESTADO_PAGO, ESTADO_TICKET, MEDIO, fecha, pesos } from '../format';
import type { EstadoPago, Metricas, TicketEstado } from '../types';

function Kpi({ label, valor, detalle, tono }: { label: string; valor: string; detalle?: string; tono?: 'ok' | 'warn' | 'bad' }) {
  return (
    <div className={`kpi ${tono ? `kpi-${tono}` : ''}`}>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-valor">{valor}</strong>
      {detalle && <span className="kpi-detalle">{detalle}</span>}
    </div>
  );
}

function Barras({ datos, formato, etiqueta }: { datos: { x: string; y: number }[]; formato: (n: number) => string; etiqueta: (x: string) => string }) {
  const max = Math.max(1, ...datos.map((d) => d.y));
  const ancho = 100 / datos.length;
  return (
    <svg className="barras" viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label="Gráfico de barras">
      {datos.map((d, i) => {
        const alto = (d.y / max) * 44;
        return (
          <rect key={d.x} x={i * ancho + ancho * 0.15} y={46 - alto} width={ancho * 0.7} height={Math.max(alto, 0.4)} rx={0.6}>
            <title>{`${etiqueta(d.x)}: ${formato(d.y)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const mesCorto = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`;
const diaCorto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const numero = (n: number) => n.toLocaleString('es-AR');

export function Dashboard() {
  const { data: m, error, isLoading } = useQuery({
    queryKey: ['metricas'],
    queryFn: () => api<Metricas>('/admin/metricas'),
    refetchInterval: 60_000,
  });

  if (isLoading) return <p className="muted">Cargando...</p>;
  if (!m) return <ErrorMsg error={error ?? 'Sin datos'} />;
  const operativos = m.clientes.total - m.clientes.enOnboarding;

  return (
    <>
      <div className="page-head">
        <h1>Resumen del negocio</h1>
        <Link className="button" to="/admin/clientes/nuevo">
          Nuevo cliente
        </Link>
      </div>

      <div className="kpis">
        <Kpi label="MRR" valor={pesos(m.ingresos.mrr)} detalle={`ARPU ${pesos(m.ingresos.arpu)}`} />
        <Kpi label="Cobrado (30 días)" valor={pesos(m.ingresos.cobrado30d)} detalle={m.ingresos.porAcreditar ? `${pesos(m.ingresos.porAcreditar)} por acreditar` : undefined} />
        <Kpi label="MRR en riesgo" valor={pesos(m.ingresos.mrrEnRiesgo)} detalle="Pagos pendientes o impagos" tono={m.ingresos.mrrEnRiesgo ? 'warn' : undefined} />
        <Kpi label="Clientes activos" valor={`${m.clientes.activos} / ${operativos}`} detalle={`${m.clientes.enOnboarding} en onboarding`} />
        <Kpi
          label="Leads"
          valor={String(m.embudo.onboardingSinPago)}
          detalle={`Se registraron y no pagaron · ${m.embudo.probaronDemo} probaron la demo`}
          tono={m.embudo.onboardingSinPago ? 'warn' : undefined}
        />
        <Kpi label="Respuestas hoy" valor={numero(m.mensajes.hoy)} detalle={`${numero(m.mensajes.ultimos30)} en 30 días`} />
        <Kpi
          label="Arrepentimientos"
          valor={String(m.tickets.arrepentimientosAbiertos)}
          detalle="Abiertos (responder en 24 h)"
          tono={m.tickets.arrepentimientosAbiertos ? 'bad' : undefined}
        />
      </div>

      <div className="split">
        <Section title="Ingresos por mes">
          <Barras datos={m.ingresos.porMes.map((x) => ({ x: x.mes, y: x.total }))} formato={pesos} etiqueta={mesCorto} />
          <div className="barras-eje">
            {m.ingresos.porMes.map((x) => (
              <span key={x.mes}>{mesCorto(x.mes)}</span>
            ))}
          </div>
        </Section>
        <Section title="Respuestas por día (30 días)">
          <Barras datos={m.mensajes.serie.map((x) => ({ x: x.dia, y: x.respuestas }))} formato={numero} etiqueta={diaCorto} />
          <div className="barras-eje">
            <span>{diaCorto(m.mensajes.serie[0]?.dia ?? '')}</span>
            <span>hoy</span>
          </div>
        </Section>
      </div>

      <div className="grid3">
        <Section title="Clientes">
          <dl className="kv">
            <dt>Total</dt>
            <dd>{m.clientes.total}</dd>
            <dt>Activos</dt>
            <dd>{m.clientes.activos}</dd>
            <dt>Pausados (manual)</dt>
            <dd>{m.clientes.pausadosManual}</dd>
            <dt>Pausados (impago)</dt>
            <dd>{m.clientes.pausadosImpago}</dd>
            {Object.entries(m.clientes.porPlan).map(([plan, n]) => (
              <div key={plan} className="kv-par">
                <dt>Plan {plan}</dt>
                <dd>{n}</dd>
              </div>
            ))}
          </dl>
        </Section>
        <Section title="Embudo (30 días)">
          <dl className="kv">
            <dt>Registros</dt>
            <dd>{m.embudo.registros30d}</dd>
            <dt>En onboarding</dt>
            <dd>{m.embudo.enOnboarding}</dd>
            <dt>Leads</dt>
            <dd>{m.embudo.onboardingSinPago}</dd>
            <dt>Leads que probaron la demo</dt>
            <dd>{m.embudo.probaronDemo}</dd>
            <dt>Activados</dt>
            <dd>{m.embudo.activados30d}</dd>
          </dl>
        </Section>
        <Section title="Cobranza y tickets">
          <dl className="kv">
            {Object.entries(m.cobranza).map(([estado, n]) => (
              <div key={estado} className="kv-par">
                <dt>Pago {ESTADO_PAGO[estado as EstadoPago] ?? estado}</dt>
                <dd>{n}</dd>
              </div>
            ))}
            {Object.entries(m.tickets.porEstado).map(([estado, n]) => (
              <div key={estado} className="kv-par">
                <dt>Tickets {ESTADO_TICKET[estado as TicketEstado]?.toLowerCase() ?? estado}</dt>
                <dd>{n}</dd>
              </div>
            ))}
            <dt>Conversión de tickets</dt>
            <dd>{m.tickets.conversion}%</dd>
          </dl>
        </Section>
      </div>

      <div className="split">
        <Section title="Cerca del tope mensual">
          {m.alertas.cercaDelTope.length === 0 ? (
            <p className="muted small">Ningún cliente supera el 80% de su tope. Si aparecen, son candidatos a subir de plan.</p>
          ) : (
            <table className="table">
              <tbody>
                {m.alertas.cercaDelTope.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/admin/clientes/${a.id}`}>{a.nombre}</Link>
                    </td>
                    <td>
                      {numero(a.usado)} / {numero(a.tope)}
                    </td>
                    <td>
                      <span className={`badge ${a.pct >= 100 ? 'badge-bad' : 'badge-warn'}`}>{a.pct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
        <Section title="Vencen en los próximos 7 días">
          {m.alertas.proximosVencimientos.length === 0 ? (
            <p className="muted small">Sin vencimientos próximos.</p>
          ) : (
            <table className="table">
              <tbody>
                {m.alertas.proximosVencimientos.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/admin/clientes/${v.id}`}>{v.nombre}</Link>
                    </td>
                    <td>{fecha(v.vencimiento)}</td>
                    <td>{MEDIO[v.medio]}</td>
                    <td>{pesos(v.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </>
  );
}
