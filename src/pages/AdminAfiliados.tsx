import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Badge, ErrorMsg, Section } from '../components/ui';
import { pesos } from '../format';
import type { AfiliadoResumen, Comision, ComisionEstado } from '../types';
import { ESTADO_COMISION } from './Afiliados';

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');

export function Afiliados() {
  const qc = useQueryClient();
  const [estado, setEstado] = useState<ComisionEstado | ''>('pendiente');
  const afiliados = useQuery({ queryKey: ['admin-afiliados'], queryFn: () => api<AfiliadoResumen[]>('/admin/afiliados') });
  const comisiones = useQuery({
    queryKey: ['admin-comisiones', estado],
    queryFn: () => api<Comision[]>(`/admin/comisiones${estado ? `?estado=${estado}` : ''}`),
  });
  const cambiar = useMutation({
    mutationFn: ({ id, accion }: { id: string; accion: 'pagada' | 'anular' }) =>
      api<Comision>(`/admin/comisiones/${id}/${accion}`, { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-comisiones'] });
      void qc.invalidateQueries({ queryKey: ['admin-afiliados'] });
    },
  });

  return (
    <>
      <div className="page-head">
        <h1>Afiliados</h1>
      </div>

      <Section
        title="Comisiones"
        actions={
          <select aria-label="Filtrar comisiones" value={estado} onChange={(e) => setEstado(e.target.value as ComisionEstado | '')}>
            <option value="pendiente">Pendientes</option>
            <option value="pagada">Pagadas</option>
            <option value="anulada">Anuladas</option>
            <option value="">Todas</option>
          </select>
        }
      >
        <ErrorMsg error={comisiones.error ?? cambiar.error} />
        {comisiones.data?.length === 0 && <p className="muted">No hay comisiones en este estado.</p>}
        {!!comisiones.data?.length && (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Afiliado</th>
                <th>Cliente</th>
                <th>Primer pago</th>
                <th>Comisión</th>
                <th>Pagar entre</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {comisiones.data.map((c) => {
                const ahora = Date.now();
                const habilitada = ahora >= new Date(c.pagableDesde).getTime();
                const vencida = ahora > new Date(c.pagarAntes).getTime();
                return (
                <tr key={c.id}>
                  <td>{fecha(c.createdAt)}</td>
                  <td>
                    {c.affiliate.nombre}
                    <div className="muted small">{c.affiliate.datosCobro ?? 'Sin datos de cobro'}</div>
                  </td>
                  <td>
                    <Link to={`/admin/clientes/${c.tenant.id}`}>{c.tenant.nombre}</Link>
                  </td>
                  <td>{pesos(c.payment.importe)}</td>
                  <td>
                    <strong>{pesos(c.importe)}</strong>
                  </td>
                  <td>
                    {fecha(c.pagableDesde)} y {fecha(c.pagarAntes)}
                    {c.estado === 'pendiente' && (
                      <div>
                        {vencida ? (
                          <Badge tone="bad">Vencida</Badge>
                        ) : habilitada ? (
                          <Badge tone="ok">Lista para pagar</Badge>
                        ) : (
                          <Badge tone="muted">En espera</Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge tone={ESTADO_COMISION[c.estado].tone}>{ESTADO_COMISION[c.estado].label}</Badge>
                    {c.pagadaEn && <div className="muted small">{fecha(c.pagadaEn)}</div>}
                  </td>
                  <td>
                    {c.estado === 'pendiente' && (
                      <div className="actions">
                        <button
                          type="button"
                          disabled={cambiar.isPending || !habilitada}
                          title={habilitada ? undefined : `Se paga desde el ${fecha(c.pagableDesde)}`}
                          onClick={() => cambiar.mutate({ id: c.id, accion: 'pagada' })}
                        >
                          Marcar pagada
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          disabled={cambiar.isPending}
                          onClick={() => {
                            if (confirm('¿Anular esta comisión?')) cambiar.mutate({ id: c.id, accion: 'anular' });
                          }}
                        >
                          Anular
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Afiliados registrados">
        <ErrorMsg error={afiliados.error} />
        {afiliados.data?.length === 0 && <p className="muted">Todavía no hay afiliados.</p>}
        {!!afiliados.data?.length && (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Datos de cobro</th>
                <th>Referidos</th>
                <th>Por pagar</th>
                <th>Pagado</th>
              </tr>
            </thead>
            <tbody>
              {afiliados.data.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.nombre}
                    <div className="muted small">{a.email}</div>
                  </td>
                  <td>
                    <code>{a.codigo}</code>
                  </td>
                  <td>{a.datosCobro ?? <span className="muted">Sin cargar</span>}</td>
                  <td>{a.referidos}</td>
                  <td>{pesos(a.pendiente)}</td>
                  <td>{pesos(a.pagada)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </>
  );
}
