import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { ErrorMsg, PageHead, Section } from '../components/ui';
import { coincideCharla, cuandoLista, gruposPorDia, horaDe, tieneTelefono } from '../format';
import type { Cuenta } from '../types';
import { useAccionCuenta } from './useCuenta';
import { useCuentaActual, ZonaExplorar } from './Panel';

export interface AvisoVentana {
  id: string;
  codigo?: string;
  canal: 'whatsapp' | 'instagram' | 'tiktok';
  nombre: string;
  numero?: string;
  texto: string;
  puedeResponder: boolean;
  ultimo?: string;
  corpus?: string;
  at?: string;
  pausada?: boolean;
}

interface MensajeCharla {
  rol: 'user' | 'assistant';
  texto: string;
  at: string;
}

interface Charla {
  id: string;
  codigo?: string;
  canal: 'whatsapp' | 'instagram' | 'tiktok';
  nombre: string;
  numero?: string;
  aviso: string | null;
  puedeResponder: boolean;
  pausada?: boolean;
  mensajes: MensajeCharla[];
}

type CanalFiltro = 'todas' | 'whatsapp' | 'instagram' | 'tiktok';
type EstadoFiltro = 'todas' | 'vencer' | 'pausa' | 'numero';

const CANAL: Record<string, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', tiktok: 'TikTok' };
const CANALES: { id: CanalFiltro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
];
const ESTADOS: { id: EstadoFiltro; label: string }[] = [
  { id: 'todas', label: 'Cualquier estado' },
  { id: 'vencer', label: 'Por vencer' },
  { id: 'pausa', label: 'IA pausada' },
  { id: 'numero', label: 'Con número' },
];

export function enlaceCharla(codigo: string): string {
  return `${window.location.origin}/cuenta/conversaciones/${codigo}`;
}

export function Conversaciones() {
  const cuenta = useCuentaActual();
  const navigate = useNavigate();
  const { codigo: abierta } = useParams();
  const [canal, setCanal] = useState<CanalFiltro>('todas');
  const [estado, setEstado] = useState<EstadoFiltro>('todas');
  const [buscar, setBuscar] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQ(buscar.trim()), 200);
    return () => clearTimeout(t);
  }, [buscar]);
  const avisos = useQuery({
    queryKey: ['ventanas', q],
    queryFn: () => api<AvisoVentana[]>(`/cuenta/ventanas${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    placeholderData: (prev) => prev,
  });
  const lista = (avisos.data ?? []).filter((a) => {
    if (canal !== 'todas' && a.canal !== canal) return false;
    if (estado === 'vencer' && !a.texto) return false;
    if (estado === 'pausa' && !a.pausada) return false;
    if (estado === 'numero' && !tieneTelefono(a.numero)) return false;
    if (!coincideCharla(a, buscar)) return false;
    return true;
  });
  const abrir = (codigo: string) => navigate(`/cuenta/conversaciones/${codigo}`);
  return (
    <ZonaExplorar cuenta={cuenta}>
      <PageHead
        title="Conversaciones"
        sub="Todas las charlas de WhatsApp, Instagram y TikTok. Buscá por nombre, número o el identificador. Pausá la IA si la seguís vos."
      />
      <CuandoDerivar cuenta={cuenta} />
      <Section title="Bandeja">
        <ErrorMsg error={avisos.error} />
        <div className={`inbox ${abierta ? 'inbox-abierta' : ''}`}>
          <div className="inbox-lista">
            <div className="inbox-herramientas">
              <input
                aria-label="Buscar charla"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Nombre, número o identificador"
              />
              <div className="segmento" role="group" aria-label="Filtrar por red">
                {CANALES.map((f) => (
                  <button key={f.id} type="button" className={`chip ${canal === f.id ? 'on' : ''}`} aria-pressed={canal === f.id} onClick={() => setCanal(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="segmento" role="group" aria-label="Filtrar por estado">
                {ESTADOS.map((f) => (
                  <button key={f.id} type="button" className={`chip ${estado === f.id ? 'on' : ''}`} aria-pressed={estado === f.id} onClick={() => setEstado(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {!buscar.trim() && avisos.data?.length === 0 && (
              <p className="muted">Cuando un cliente escriba por WhatsApp, Instagram o TikTok, la charla aparece acá.</p>
            )}
            {lista.length === 0 && (buscar.trim() || (avisos.data?.length ?? 0) > 0) && (
              <p className="muted">Ninguna charla coincide con ese filtro.</p>
            )}
            {lista.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`inbox-item ${a.texto ? 'aviso' : ''} ${abierta === a.id ? 'on' : ''}`}
                aria-label={`Abrir chat de ${a.nombre}${a.numero ? ` ${a.numero}` : ''}`}
                aria-current={abierta === (a.codigo || a.id) ? 'true' : undefined}
                onClick={() => abrir(a.codigo || a.id)}
              >
                <span className="inbox-tope">
                  <span>
                    <span className={`badge ${a.texto ? 'badge-warn' : 'badge-muted'}`}>{CANAL[a.canal]}</span>{' '}
                    <strong className="inbox-nombre">{a.nombre}</strong>
                    {a.pausada && <span className="badge badge-muted">IA pausada</span>}
                  </span>
                  {a.at && <small className="muted">{cuandoLista(a.at)}</small>}
                </span>
                {a.numero && <span className="small muted inbox-numero">{a.numero}</span>}
                {a.texto && <span className="small">{a.texto}</span>}
                {a.ultimo && <span className="small muted inbox-ultimo">{a.ultimo}</span>}
              </button>
            ))}
          </div>
          <div className="inbox-chat">
            {abierta ? <Chat id={abierta} onVolver={() => navigate('/cuenta/conversaciones')} /> : <p className="chat-vacio">Elegí una charla para ver el chat completo.</p>}
          </div>
        </div>
      </Section>
    </ZonaExplorar>
  );
}

function Chat({ id, onVolver }: { id: string; onVolver: () => void }) {
  const qc = useQueryClient();
  const fondo = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState('');
  const charla = useQuery({ queryKey: ['ventana', id], queryFn: () => api<Charla>(`/cuenta/ventanas/${id}`) });
  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ['ventanas'] });
    void qc.invalidateQueries({ queryKey: ['ventana', id] });
  };
  const enviar = useMutation({
    mutationFn: () => api<{ ok: true }>(`/cuenta/ventanas/${id}/responder`, { method: 'POST', body: { texto } }),
    onSuccess: () => {
      setTexto('');
      invalidar();
    },
  });
  const pausar = useMutation({
    mutationFn: () => api<Charla>(`/cuenta/ventanas/${id}/${charla.data?.pausada ? 'devolver' : 'pausar'}`, { method: 'POST' }),
    onSuccess: invalidar,
  });
  const mensajes = charla.data?.mensajes ?? [];
  const codigo = charla.data?.codigo || id;
  const enlace = enlaceCharla(codigo);
  const fallo = Boolean(charla.error || enviar.error || pausar.error);
  const [copiado, setCopiado] = useState(false);
  useEffect(() => {
    const caja = fondo.current?.parentElement;
    if (caja) caja.scrollTop = caja.scrollHeight;
  }, [mensajes.length, id]);
  const copiar = async () => {
    try {
      await navigator.clipboard?.writeText(enlace);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat-head">
        <button type="button" className="secondary inbox-volver" onClick={onVolver}>
          Volver
        </button>
        <div>
          <strong>{charla.data?.nombre ?? 'Chat'}</strong>
          <small>
            {charla.data ? CANAL[charla.data.canal] : ''}
            {charla.data?.numero ? ` · ${charla.data.numero}` : ''}
            {charla.data ? (charla.data.pausada ? ' · La IA está pausada' : ' · La IA contesta') : ''}
          </small>
        </div>
      </div>
      <div className={fallo ? 'reporte-fallo' : 'chat-id'}>
        {fallo && <p>Hubo un fallo en esta charla.</p>}
        <p>
          Identificador <code>{codigo}</code>
        </p>
        <p>
          {fallo ? 'Reportalo con este enlace: ' : 'Enlace de la charla: '}
          <a className="chat-enlace" href={enlace}>
            {enlace}
          </a>
        </p>
        <button type="button" className="secondary" onClick={() => void copiar()}>
          {copiado ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
      </div>
      {charla.data && (
        <div className="chat-estado">
          <p className="small muted">{charla.data.pausada ? 'La IA no contesta esta charla.' : 'La IA sigue contestando esta charla.'}</p>
          <button type="button" className="secondary" disabled={pausar.isPending} onClick={() => pausar.mutate()}>
            {charla.data.pausada ? 'Reactivar la IA' : 'Pausar la IA'}
          </button>
        </div>
      )}
      {charla.data?.aviso && <p className="small aviso-chat">{charla.data.aviso}</p>}
      <ErrorMsg error={charla.error} />
      <div className="chat-cuerpo" aria-live="polite" aria-label="Chat">
        {charla.data && mensajes.length === 0 && <p className="chat-vacio">Esta charla todavía no tiene mensajes guardados.</p>}
        {gruposPorDia(mensajes).map((grupo, gi) => (
          <div key={`${gi}-${grupo.dia}`} className="chat-dia-grupo">
            {grupo.dia && <p className="chat-dia">{grupo.dia}</p>}
            {grupo.items.map((m, i) => (
              <div key={`${m.at}-${i}`} className={`burbuja ${m.rol === 'user' ? 'in' : 'out'}`}>
                {m.texto}
                {m.at && horaDe(m.at) && <small>{horaDe(m.at)}</small>}
              </div>
            ))}
          </div>
        ))}
        <div ref={fondo} />
      </div>
      {charla.data?.puedeResponder ? (
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (texto.trim()) enviar.mutate();
          }}
        >
          <input aria-label="Respuesta" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Respondé a ${charla.data.nombre}`} />
          <button type="submit" disabled={!texto.trim() || enviar.isPending}>
            Enviar
          </button>
        </form>
      ) : (
        charla.data && <p className="small muted">Ya no se puede responder por esta ventana. Cuando la persona vuelva a escribir, se abre de nuevo.</p>
      )}
      <p className="small muted">Se muestran los últimos mensajes, agrupados por día.</p>
      <ErrorMsg error={enviar.error ?? pausar.error} />
    </div>
  );
}

function CuandoDerivar({ cuenta }: { cuenta: Cuenta }) {
  const perfil = cuenta.negocio.perfil;
  const [texto, setTexto] = useState(perfil?.derivar ?? '');
  const guardar = useAccionCuenta();
  if (!perfil) {
    return (
      <p className="small muted derivar-nota">
        Cuando completes tu negocio en Mi IA, acá indicás en qué casos la IA tiene que derivar la charla sola.
      </p>
    );
  }
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    guardar.mutate({ path: 'perfil', method: 'PUT', body: { ...perfil, derivar: texto.trim() } });
  };
  return (
    <form className="derivar" onSubmit={enviar}>
      <label>
        Cuándo derivar automáticamente
        <textarea
          rows={3}
          maxLength={1000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={'Reclamos\nPedidos para eventos\nSi piden una factura'}
        />
      </label>
      <small className="muted">
        Es lo que la IA tiene que entender para pasar la charla a una persona. Si lo dejás vacío, deriva cuando piden hablar con alguien o hacen
        un reclamo.
      </small>
      <div className="form-acciones">
        <button type="submit" className="secondary" disabled={guardar.isPending || texto.trim() === (perfil.derivar ?? '').trim()}>
          {guardar.isPending ? 'Guardando...' : 'Guardar casos'}
        </button>
        {guardar.isSuccess && <span className="small ok-msg">La IA ya usa estos casos.</span>}
      </div>
      <ErrorMsg error={guardar.error} />
    </form>
  );
}
