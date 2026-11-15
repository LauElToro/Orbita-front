import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Badge, ErrorMsg } from '../components/ui';
import { ESTADO_PAGO } from '../format';
import type { ClienteResumen, EstadoPago } from '../types';

const tonoPago: Record<EstadoPago, 'ok' | 'warn' | 'bad'> = { al_dia: 'ok', pendiente: 'warn', impago: 'bad' };

export function Lista() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api<ClienteResumen[]>('/clientes'),
  });

  return (
    <>
      <div className="page-head">
        <h1>Clientes</h1>
        <Link className="button" to="/admin/clientes/nuevo">
          Nuevo cliente
        </Link>
      </div>
      <ErrorMsg error={error} />
      {isLoading && <p className="muted">Cargando...</p>}
      {data && data.length === 0 && <p className="muted">Todavía no hay clientes.</p>}
      {data && data.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Plan</th>
              <th>Canales</th>
              <th>Bot</th>
              <th>Pago</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/admin/clientes/${c.id}`}>{c.nombre}</Link>
                  <div className="muted small">{c.id}</div>
                </td>
                <td>{c.plan.nombre}</td>
                <td>{c.canales.map((k) => k.etiqueta).join(', ')}</td>
                <td>
                  <Badge tone={c.estado === 'activo' ? 'ok' : 'muted'}>{c.estado}</Badge>
                  {c.pausaMotivo === 'onboarding' && c.estadoPago !== 'al_dia' && <Badge tone="warn">Lead</Badge>}
                  {c.pausaMotivo === 'onboarding' && <div className="muted small">en onboarding</div>}
                </td>
                <td>
                  <Badge tone={tonoPago[c.estadoPago]}>{ESTADO_PAGO[c.estadoPago]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
