import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Icono, type NombreIcono } from '../components/Iconos';
import { ErrorMsg, PageHead, Vacio } from '../components/ui';
import type { Demo as DemoDatos, FuenteDemo, FuncionDemo, Tono } from '../types';
import { ChatPrueba } from './formularios';
import { useCuentaActual } from './Panel';

const FUNCIONES: { id: FuncionDemo; titulo: string; detalle: string; icono: NombreIcono }[] = [
  { id: 'stock', titulo: 'Stock y precios', detalle: 'Consulta tu planilla, avisa si no hay y ofrece alternativas.', icono: 'caja' },
  { id: 'horarios', titulo: 'Horarios', detalle: 'Dice si estás abierto ahora y cuándo abrís.', icono: 'reloj' },
  { id: 'turnos', titulo: 'Turnos', detalle: 'Agenda turnos en tus horarios.', icono: 'agenda' },
  { id: 'pedidos', titulo: 'Pedidos', detalle: 'Arma el pedido, calcula el total y lo confirma.', icono: 'carrito' },
  { id: 'derivar', titulo: 'Atención humana', detalle: 'Te pasa la charla en reclamos o casos especiales.', icono: 'persona' },
];

const TONOS: { id: Tono; label: string }[] = [
  { id: 'cercano', label: 'Cercano' },
  { id: 'formal', label: 'Formal' },
  { id: 'divertido', label: 'Divertido' },
];

const ICONO_FUENTE: Record<FuenteDemo['tipo'], NombreIcono> = { tabla: 'tabla', pdf: 'archivo', texto: 'texto' };
const numero = (n: number) => n.toLocaleString('es-AR');

function describir(f: FuenteDemo): string {
  if (f.tipo === 'tabla') return `Planilla · ${numero(f.filas)} ${f.filas === 1 ? 'fila' : 'filas'}`;
  return `${f.tipo === 'pdf' ? 'PDF' : 'Texto'} · ${numero(f.caracteres)} caracteres`;
}

function leerBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).replace(/^data:[^,]*,/, ''));
    lector.onerror = () => reject(new Error(`No pudimos leer ${archivo.name}`));
    lector.readAsDataURL(archivo);
  });
}

export function sugerenciasDemo(demo: DemoDatos): string[] {
  const producto = demo.fuentes.find((f) => f.tipo === 'tabla')?.muestra?.[0]?.[0];
  const f = demo.config.funciones;
  const lista: string[] = [];
  if (f.includes('stock')) lista.push(producto ? `¿Tienen ${producto}?` : '¿Qué productos tienen?');
  if (f.includes('horarios')) lista.push('¿Están abiertos ahora?');
  if (f.includes('pedidos')) lista.push(producto ? `Quiero comprar 2 ${producto}` : 'Quiero hacer un pedido');
  if (f.includes('turnos')) lista.push('Quiero un turno para mañana a las 10');
  if (demo.fuentes.some((x) => x.tipo !== 'tabla')) lista.push('¿Hacen envíos?');
  if (f.includes('derivar')) lista.push('Quiero hablar con una persona');
  return lista.slice(0, 5);
}

function useDemoAccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path = '', method = 'POST', body }: { path?: string; method?: string; body?: unknown }) =>
      api<DemoDatos>(`/cuenta/demo${path}`, { method, body }),
    onSuccess: (d) => qc.setQueryData(['cuenta-demo'], d),
  });
}

function Fuentes({ demo }: { demo: DemoDatos }) {
  const subir = useDemoAccion();
  const quitar = useDemoAccion();
  const ejemplo = useDemoAccion();
  const input = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [pegar, setPegar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [texto, setTexto] = useState('');
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const lleno = demo.fuentes.length >= demo.limites.fuentes;
  const pct = Math.min(100, Math.round((demo.usados / demo.limites.caracteresTotal) * 100));

  const subirArchivos = async (archivos: FileList | File[]) => {
    setErrorArchivo(null);
    for (const archivo of Array.from(archivos)) {
      if (archivo.size > demo.limites.megas * 1024 * 1024) {
        setErrorArchivo(`${archivo.name} supera los ${demo.limites.megas} MB`);
        continue;
      }
      try {
        await subir.mutateAsync({ path: '/fuentes', body: { nombre: archivo.name, archivo: await leerBase64(archivo) } });
      } catch (err) {
        setErrorArchivo(`${archivo.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (input.current) input.current.value = '';
  };

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    if (!lleno && e.dataTransfer.files.length) void subirArchivos(e.dataTransfer.files);
  };

  const agregarTexto = (e: FormEvent) => {
    e.preventDefault();
    subir.mutate(
      { path: '/fuentes', body: { nombre: nombre.trim() || 'Información del negocio', texto } },
      {
        onSuccess: () => {
          setNombre('');
          setTexto('');
          setPegar(false);
        },
      },
    );
  };

  return (
    <section className="card">
      <p className="paso-titulo">Paso 1 · Tu información</p>
      <label
        className={`dropzone ${arrastrando ? 'dropzone-on' : ''} ${lleno ? 'dropzone-off' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltar}
      >
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept=".pdf,.tsv,.csv,.txt,.md"
          multiple
          disabled={lleno || subir.isPending}
          aria-label="Subir archivos"
          onChange={(e) => e.target.files && void subirArchivos(e.target.files)}
        />
        <span className="icono-tile">
          <Icono nombre="subir" tam={22} />
        </span>
        <strong>{subir.isPending ? 'Leyendo el archivo...' : lleno ? 'Llegaste al máximo de archivos' : 'Arrastrá un PDF, TSV o CSV, o hacé clic para elegirlo'}</strong>
        <small>
          Catálogo, lista de precios, planilla de stock, políticas de envío... Hasta {demo.limites.megas} MB por archivo y {demo.limites.fuentes} archivos.
        </small>
      </label>
      {errorArchivo && <p className="error">{errorArchivo}</p>}

      {pegar ? (
        <form onSubmit={agregarTexto} className="pegar">
          <label>
            Título
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Envíos y medios de pago" maxLength={120} />
          </label>
          <label>
            Información
            <textarea
              rows={5}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pegá lo que quieras que sepa tu IA: precios, políticas, preguntas frecuentes..."
              required
              minLength={10}
            />
          </label>
          <div className="form-acciones">
            <button type="submit" disabled={subir.isPending || texto.trim().length < 10}>
              Agregar texto
            </button>
            <button type="button" className="link" onClick={() => setPegar(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="form-acciones">
          <button type="button" className="secondary" onClick={() => setPegar(true)} disabled={lleno}>
            <Icono nombre="texto" tam={16} /> Pegar texto
          </button>
          <button type="button" className="link" onClick={() => ejemplo.mutate({ path: '/ejemplo' })} disabled={ejemplo.isPending}>
            {ejemplo.isPending ? 'Cargando ejemplo...' : 'Usar datos de ejemplo'}
          </button>
        </div>
      )}
      {!pegar && <ErrorMsg error={subir.error && !errorArchivo ? subir.error : null} />}
      <ErrorMsg error={ejemplo.error ?? quitar.error} />

      {demo.fuentes.length === 0 ? (
        <Vacio icono={<Icono nombre="archivo" tam={22} />} titulo="Todavía no cargaste información">
          <p className="small muted">Subí tu planilla de stock o tu catálogo, o probá con los datos de ejemplo de una tienda de ropa.</p>
        </Vacio>
      ) : (
        <>
          <ul className="fuentes">
            {demo.fuentes.map((f) => (
              <li key={f.id}>
                <div className="fuente">
                  <span className="icono-tile icono-tile-sm">
                    <Icono nombre={ICONO_FUENTE[f.tipo]} />
                  </span>
                  <div className="fuente-datos">
                    <strong>{f.nombre}</strong>
                    <small>{describir(f)}</small>
                  </div>
                  <button type="button" className="icon-btn" aria-label={`Quitar ${f.nombre}`} disabled={quitar.isPending} onClick={() => quitar.mutate({ path: `/fuentes/${f.id}`, method: 'DELETE' })}>
                    <Icono nombre="basura" tam={16} />
                  </button>
                </div>
                {f.tipo === 'tabla' && f.columnas && (
                  <details className="fuente-muestra">
                    <summary>Ver muestra</summary>
                    <div className="tabla-scroll">
                      <table className="table">
                        <thead>
                          <tr>
                            {f.columnas.map((c, i) => (
                              <th key={i}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {f.muestra?.map((fila, i) => (
                            <tr key={i}>
                              {fila.map((v, j) => (
                                <td key={j}>{v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
                {f.tipo !== 'tabla' && f.vista && <p className="fuente-vista">{f.vista}…</p>}
              </li>
            ))}
          </ul>
          <div className="uso">
            <div className="uso-head">
              <span>Información cargada</span>
              <strong>{pct}%</strong>
            </div>
            <div className="bar" role="progressbar" aria-label="Información cargada" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className={`bar-fill ${pct >= 90 ? 'bar-warn' : 'bar-ok'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Funciones({ demo }: { demo: DemoDatos }) {
  const guardar = useDemoAccion();
  const [horarios, setHorarios] = useState(demo.config.horarios);
  const [negocio, setNegocio] = useState(demo.config.negocio);
  useEffect(() => setHorarios(demo.config.horarios), [demo.config.horarios]);
  useEffect(() => setNegocio(demo.config.negocio), [demo.config.negocio]);
  const config = (patch: Partial<DemoDatos['config']>) => guardar.mutate({ method: 'PUT', body: { ...demo.config, horarios, negocio, ...patch } });
  const alternar = (id: FuncionDemo) => {
    const on = demo.config.funciones.includes(id);
    config({ funciones: on ? demo.config.funciones.filter((f) => f !== id) : [...demo.config.funciones, id] });
  };
  const sinTabla = !demo.fuentes.some((f) => f.tipo === 'tabla');

  return (
    <section className="card">
      <p className="paso-titulo">Paso 2 · Qué puede hacer</p>
      <div className="funciones">
        {FUNCIONES.map((f) => {
          const on = demo.config.funciones.includes(f.id);
          return (
            <button key={f.id} type="button" role="switch" aria-checked={on} className={`funcion ${on ? 'funcion-on' : ''}`} onClick={() => alternar(f.id)} disabled={guardar.isPending}>
              <span className="icono-tile icono-tile-sm">
                <Icono nombre={f.icono} />
              </span>
              <span className="funcion-texto">
                <strong>{f.titulo}</strong>
                <small>{f.id === 'stock' && on && sinTabla ? 'Subí una planilla TSV o CSV para que tenga de dónde leer.' : f.detalle}</small>
              </span>
              <span className="interruptor" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className="grid2 demo-ajustes">
        {(demo.config.funciones.includes('horarios') || demo.config.funciones.includes('turnos')) && (
          <label>
            Horarios de atención
            <input
              value={horarios}
              onChange={(e) => setHorarios(e.target.value)}
              onBlur={() => horarios !== demo.config.horarios && config({})}
              placeholder="Lunes a viernes de 9 a 18, sábados de 9 a 13"
              maxLength={500}
            />
          </label>
        )}
        <label>
          Nombre en la demo
          <input
            value={negocio}
            onChange={(e) => setNegocio(e.target.value)}
            onBlur={() => negocio !== demo.config.negocio && config({})}
            placeholder="El de tu negocio"
            maxLength={120}
          />
        </label>
      </div>
      <div className="segmento" role="radiogroup" aria-label="Tono">
        {TONOS.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={demo.config.tono === t.id} className={demo.config.tono === t.id ? 'on' : ''} onClick={() => config({ tono: t.id })}>
            {t.label}
          </button>
        ))}
      </div>
      <ErrorMsg error={guardar.error} />
    </section>
  );
}

export function Demo() {
  const cuenta = useCuentaActual();
  const demo = useQuery({ queryKey: ['cuenta-demo'], queryFn: () => api<DemoDatos>('/cuenta/demo') });
  const pago = cuenta.onboarding.requisitos.pago;

  return (
    <>
      <PageHead
        eyebrow="Gratis · sin conectar canales"
        title="Demo de tu IA"
        sub="Subí tu información, elegí qué puede hacer y chateá con ella como si fueras un cliente. Nada se envía ni consume tu plan."
      />
      {demo.isLoading && <div className="skeleton" style={{ height: 320 }} />}
      <ErrorMsg error={demo.error} />
      {demo.data && (
        <div className="demo-grid">
          <div className="demo-col">
            <Fuentes demo={demo.data} />
            <Funciones demo={demo.data} />
          </div>
          <div className="demo-col demo-col-chat">
            <section className="card card-chat">
              <p className="paso-titulo">Paso 3 · Probala</p>
              <ChatPrueba
                endpoint="/cuenta/demo/chat"
                negocio={demo.data.negocio}
                estado="Demo · responde con lo que cargaste"
                sugerencias={sugerenciasDemo(demo.data)}
                vacio={
                  demo.data.fuentes.length
                    ? 'Preguntale por un producto, el precio, el horario o pedile que te arme un pedido.'
                    : 'Cargá un archivo o usá los datos de ejemplo para que tenga de qué hablar.'
                }
              />
            </section>
            <section className="card card-cta">
              <span className="icono-tile">
                <Icono nombre="rayo" tam={20} />
              </span>
              <div>
                <h2>¿Te gustó cómo responde?</h2>
                <p className="small">
                  {pago
                    ? 'Cargá esta información en tu IA y conectala a tus canales para que atienda de verdad.'
                    : 'Activá tu plan y ponela a atender en tu WhatsApp, Instagram, TikTok o tu web, las 24 horas.'}
                </p>
              </div>
              <Link to={pago ? '/cuenta/ia' : '/cuenta/plan'} className="button">
                {pago ? 'Configurar mi IA' : 'Activar mi plan'}
              </Link>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
