import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { ErrorMsg, UsoBar } from '../components/ui';
import { ESTADO_PAGO, fecha, pesos } from '../format';
import type { PaginaPublica } from '../types';

export function PaginaCliente() {
  const { token = '' } = useParams();
  const pagina = useQuery({ queryKey: ['publico', token], queryFn: () => api<PaginaPublica>(`/publico/${token}`) });
  const [email, setEmail] = useState('');
  const suscribir = useMutation({
    mutationFn: () =>
      api<{ initPoint: string }>(`/publico/${token}/suscripcion`, { method: 'POST', body: email ? { email } : {} }),
    onSuccess: ({ initPoint }) => location.assign(initPoint),
  });

  if (pagina.isLoading) return <div className="centered muted">Cargando...</div>;
  if (pagina.error || !pagina.data) return <div className="centered"><ErrorMsg error={pagina.error ?? 'No encontrado'} /></div>;
  const p = pagina.data;

  return (
    <div className="centered">
      <div className="card narrow">
        <h1>{p.nombre}</h1>
        <p className="muted">Plan {p.plan.nombre}</p>
        <dl className="kv">
          <dt>Importe de este mes</dt>
          <dd>
            <strong>{pesos(p.importe)}</strong>
          </dd>
          <dt>Vencimiento</dt>
          <dd>{fecha(p.vencimiento)}</dd>
          <dt>Estado del pago</dt>
          <dd>{ESTADO_PAGO[p.estadoPago]}</dd>
          <dt>Bot</dt>
          <dd>{p.estado}</dd>
        </dl>
        <UsoBar label="Respuestas del bot este mes" usado={p.uso.mes} tope={p.uso.tope} reinicia={fecha(p.uso.reinicia)} />

        {p.mercadopago && (
          <div className="pago">
            <h3>Mercado Pago</h3>
            {p.mercadopago.initPoint ? (
              <a className="button" href={p.mercadopago.initPoint}>
                Ir a la suscripción
              </a>
            ) : (
              <>
                {p.mercadopago.requiereEmail && (
                  <label>
                    Email de tu cuenta de Mercado Pago
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>
                )}
                <button onClick={() => suscribir.mutate()} disabled={suscribir.isPending || !p.mercadopago.habilitado}>
                  Aprobar débito automático
                </button>
              </>
            )}
            <p className="muted small">Lo aprobás una sola vez. Los meses siguientes se debita solo.</p>
            <ErrorMsg error={suscribir.error} />
          </div>
        )}

      </div>
    </div>
  );
}
