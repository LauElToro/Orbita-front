import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, CODIGO_REFERIDO, codigoDeReferido, referido } from '../api';
import { Badge, Check, Copiar, ErrorMsg, Section } from '../components/ui';
import { pesos } from '../format';
import type { Cuenta, PanelAfiliado } from '../types';
import { useAccionCuenta } from './useCuenta';

type EstadoCodigo = 'vacio' | 'formato' | 'verificando' | 'valido' | 'invalido';

/** Verifica contra el backend, con una pausa para no consultar en cada tecla. */
export function useCodigoReferido(texto: string): { codigo: string; estado: EstadoCodigo } {
  const codigo = codigoDeReferido(texto);
  const [consulta, setConsulta] = useState('');
  const formatoOk = CODIGO_REFERIDO.test(codigo);
  useEffect(() => {
    if (!formatoOk) return;
    const t = setTimeout(() => setConsulta(codigo), 400);
    return () => clearTimeout(t);
  }, [codigo, formatoOk]);
  const check = useQuery({
    queryKey: ['referido-valido', consulta],
    queryFn: () => api<{ valido: boolean }>(`/publico/referido/${encodeURIComponent(consulta)}`),
    enabled: formatoOk && consulta === codigo,
    staleTime: 60_000,
  });
  if (!codigo) return { codigo, estado: 'vacio' };
  if (!formatoOk) return { codigo, estado: 'formato' };
  if (consulta !== codigo || check.isPending) return { codigo, estado: 'verificando' };
  return { codigo, estado: check.data?.valido ? 'valido' : 'invalido' };
}

const AVISO: Record<EstadoCodigo, { texto: string; clase: string } | null> = {
  vacio: null,
  formato: { texto: 'El código lleva entre 3 y 40 letras, números o guiones.', clase: 'error' },
  verificando: { texto: 'Verificando el código...', clase: 'small muted' },
  valido: { texto: 'Código de referido válido.', clase: 'ok-msg small' },
  invalido: { texto: 'No encontramos ese código de referido.', clase: 'error' },
};

export function AvisoCodigo({ estado }: { estado: EstadoCodigo }) {
  const aviso = AVISO[estado];
  return aviso ? <span className={`referido-aviso ${aviso.clase}`}>{aviso.texto}</span> : null;
}

/** Campo opcional del registro: viene completo si la persona entró con un link de referidos. */
export function CampoReferidoAcceso({ value, onChange, estado }: { value: string; onChange: (v: string) => void; estado: EstadoCodigo }) {
  return (
    <label>
      Código o link de referido <span className="muted">(opcional)</span>
      <span className="auth-control">
        <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={200} placeholder="Pegá el link o escribí el código" autoComplete="off" />
      </span>
      <AvisoCodigo estado={estado} />
    </label>
  );
}

/** Plan y pagos: el link con el que quedó vinculada la cuenta, o el campo para cargarlo. */
export function ReferidoPlan({ cuenta }: { cuenta: Cuenta }) {
  const [texto, setTexto] = useState(() => referido.get() ?? '');
  const { codigo, estado } = useCodigoReferido(texto);
  const aplicar = useAccionCuenta(() => referido.limpiar());
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    aplicar.mutate({ path: 'referido', body: { codigo } });
  };

  if (cuenta.referido) {
    return (
      <Section title="Link de referido">
        <div className="narrow">
          <label>
            Código de referido
            <input value={cuenta.referido.codigo} disabled readOnly aria-label="Código de referido" />
          </label>
          <p className="small muted">Tu cuenta está vinculada a este link de referido. No se puede cambiar.</p>
        </div>
      </Section>
    );
  }

  if (!cuenta.referidoEditable) {
    return (
      <Section title="Link de referido">
        <div className="narrow">
          <input value="" disabled readOnly aria-label="Código de referido" placeholder="Sin link de referido" />
          <p className="small muted">El link de referido se carga antes del primer pago.</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Link de referido">
      <form onSubmit={enviar} className="narrow">
        <p className="small muted">
          Si alguien te recomendó Orbita, cargá su código o pegá su link antes de pagar. Se carga una sola vez y después no se puede cambiar.
        </p>
        <div className="row">
          <input aria-label="Código de referido" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} placeholder="Pegá el link o escribí el código" />
          <button type="submit" disabled={aplicar.isPending || estado !== 'valido'}>
            {aplicar.isPending ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
        <AvisoCodigo estado={estado} />
        <ErrorMsg error={aplicar.error} />
      </form>
    </Section>
  );
}

/** Editor del código propio. Prefijo = link sin el código, para que se vea cómo queda. */
export function EditorCodigo({ panel, guardar }: { panel: PanelAfiliado; guardar: (codigo: string) => Promise<unknown> }) {
  const [codigo, setCodigo] = useState(panel.codigo);
  useEffect(() => setCodigo(panel.codigo), [panel.codigo]);
  const cambio = useMutation({ mutationFn: guardar });
  const normalizado = codigo.trim().toLowerCase();
  const formatoOk = CODIGO_REFERIDO.test(normalizado);
  const prefijo = panel.link.slice(0, panel.link.length - panel.codigo.length);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    cambio.mutate(normalizado);
  };
  return (
    <form onSubmit={enviar} className="editor-codigo">
      <label>
        Personalizá tu link
        <span className="editor-codigo-campo">
          <span className="editor-codigo-prefijo">{prefijo.replace(/^https?:\/\//, '')}</span>
          <input aria-label="Código de referido" value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={40} />
        </span>
      </label>
      {codigo && !formatoOk && <p className="error">Entre 3 y 40 letras, números o guiones, sin guion al principio ni al final.</p>}
      {formatoOk && normalizado !== panel.codigo && <p className="small muted">Al guardar, el link anterior deja de sumar referidos nuevos.</p>}
      <ErrorMsg error={cambio.error} />
      {cambio.isSuccess && normalizado === panel.codigo && <p className="ok-msg small">Link actualizado.</p>}
      <button type="submit" disabled={cambio.isPending || !formatoOk || normalizado === panel.codigo}>
        {cambio.isPending ? 'Guardando...' : 'Guardar link'}
      </button>
    </form>
  );
}

/** Programa de referidos del cliente. Mismas condiciones que el de cualquier afiliado. */
export function ReferidosCuenta({ titulo = 'Referidos' }: { titulo?: string }) {
  const qc = useQueryClient();
  const datos = useQuery({ queryKey: ['cuenta-afiliado'], queryFn: () => api<{ afiliado: PanelAfiliado | null }>('/cuenta/afiliado') });
  const [terminos, setTerminos] = useState(false);
  const [cobro, setCobro] = useState('');
  const panel = datos.data?.afiliado;
  useEffect(() => setCobro(panel?.datosCobro ?? ''), [panel?.datosCobro]);
  const actualizar = (afiliado: PanelAfiliado) => qc.setQueryData(['cuenta-afiliado'], { afiliado });
  const activar = useMutation({
    mutationFn: () => api<PanelAfiliado>('/cuenta/afiliado', { method: 'POST', body: { aceptaTerminos: terminos } }),
    onSuccess: actualizar,
  });
  const patch = (body: Record<string, unknown>) =>
    api<PanelAfiliado>('/cuenta/afiliado', { method: 'PATCH', body }).then((a) => {
      actualizar(a);
      return a;
    });
  const guardarCobro = useMutation({ mutationFn: () => patch({ datosCobro: cobro.trim() || null }) });

  return (
    <Section title={titulo}>
      <ErrorMsg error={datos.error} />
      {datos.isLoading && <div className="skeleton" style={{ height: 80 }} />}
      {datos.data && !panel && (
        <div className="narrow">
          <p>
            Recomendá Orbita a otros comercios con tu propio link. Por cada uno que contrate un plan te llevás el 50% de su primer pago.
          </p>
          <Check checked={terminos} onChange={setTerminos}>
            Acepto los{' '}
            <Link to="/terminos#afiliados" target="_blank">
              Términos del programa de afiliados
            </Link>
            .
          </Check>
          <ErrorMsg error={activar.error} />
          <button onClick={() => activar.mutate()} disabled={activar.isPending || !terminos}>
            {activar.isPending ? 'Activando...' : 'Activar mi link de referidos'}
          </button>
        </div>
      )}
      {panel && (
        <div className="referidos-cuenta">
          <p className="small muted">
            Cada comercio que contrate un plan desde tu link te genera el {panel.porcentaje}% de su primer pago.
          </p>
          <div>
            <strong className="small">Tu link</strong>
            <br />
            <Copiar texto={panel.link} />
          </div>
          <EditorCodigo panel={panel} guardar={(codigo) => patch({ codigo })} />
          <div className="afiliado-totales">
            <div>
              <span className="muted">Referidos</span>
              <strong>{panel.referidos.length}</strong>
            </div>
            <div>
              <span className="muted">Por cobrar</span>
              <strong>{pesos(panel.totales.pendiente)}</strong>
            </div>
            <div>
              <span className="muted">Cobrado</span>
              <strong>{pesos(panel.totales.pagada)}</strong>
            </div>
          </div>
          <form
            className="narrow"
            onSubmit={(e) => {
              e.preventDefault();
              guardarCobro.mutate();
            }}
          >
            <label>
              Datos de cobro (CBU, CVU o alias)
              <input value={cobro} onChange={(e) => setCobro(e.target.value)} maxLength={300} placeholder="mi.alias.mp" />
            </label>
            <ErrorMsg error={guardarCobro.error} />
            <button type="submit" className="secondary" disabled={guardarCobro.isPending}>
              {guardarCobro.isPending ? 'Guardando...' : guardarCobro.isSuccess ? 'Guardado' : 'Guardar datos de cobro'}
            </button>
          </form>
          {panel.referidos.length > 0 && (
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
                {panel.referidos.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleDateString('es-AR')}</td>
                    <td>{r.negocio}</td>
                    <td>{r.plan ?? 'Sin plan'}</td>
                    <td>{r.pago ? <Badge tone="ok">Pagó</Badge> : <Badge tone="muted">Pendiente</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Section>
  );
}
