import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { CanalesEditor, canalVacio } from '../components/CanalesEditor';
import { Copiar, ErrorMsg } from '../components/ui';
import { pesos } from '../format';
import type { Canal, Cuenta, Mensajes, Perfil, Plan, PlanId, Simulacion, Tono } from '../types';
import { useAccionCuenta } from './useCuenta';

interface FormProps {
  cuenta: Cuenta;
  boton?: string;
  onGuardado?: (c: Cuenta) => void;
}

const TURNOS_DEFAULT = { servicios: '', horarios: '', duracionMin: 30, anticipacionHoras: 2 };

export function perfilInicial(cuenta: Cuenta): Perfil {
  const p = cuenta.negocio.perfil;
  return {
    descripcion: p?.descripcion ?? '',
    productos: p?.productos ?? '',
    horarios: p?.horarios ?? '',
    ubicacion: p?.ubicacion ?? '',
    pagosEnvios: p?.pagosEnvios ?? '',
    tono: p?.tono ?? 'cercano',
    derivar: p?.derivar ?? '',
    preguntas: p?.preguntas ?? [],
    turnos: p?.turnos ?? TURNOS_DEFAULT,
  };
}

export type SeccionPerfil = 'negocio' | 'turnos' | 'estilo';

const TONOS: { value: Tono; label: string; ejemplo: string }[] = [
  { value: 'cercano', label: 'Cercano', ejemplo: '¡Hola! Sí, tenemos. ¿Querés que te reserve uno?' },
  { value: 'formal', label: 'Formal', ejemplo: 'Buenas tardes. Sí, contamos con disponibilidad. ¿Desea reservar?' },
  { value: 'divertido', label: 'Divertido', ejemplo: '¡Holaa! 🙌 Obvio que sí, ¿te guardo uno?' },
];

export function PerfilForm({ cuenta, secciones, boton = 'Guardar', onGuardado }: FormProps & { secciones: SeccionPerfil[] }) {
  const [perfil, setPerfil] = useState<Perfil>(() => perfilInicial(cuenta));
  const guardar = useAccionCuenta(onGuardado);
  const conTurnos = cuenta.negocio.modulos.includes('turnos');
  const set = (patch: Partial<Perfil>) => setPerfil((p) => ({ ...p, ...patch }));
  const setTurnos = (patch: Partial<NonNullable<Perfil['turnos']>>) =>
    setPerfil((p) => ({ ...p, turnos: { ...TURNOS_DEFAULT, ...p.turnos, ...patch } }));
  const setPregunta = (i: number, patch: Partial<Perfil['preguntas'][number]>) =>
    set({ preguntas: perfil.preguntas.map((q, j) => (j === i ? { ...q, ...patch } : q)) });

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const { turnos, ...resto } = perfil;
    guardar.mutate({
      path: 'perfil',
      method: 'PUT',
      body: {
        ...resto,
        preguntas: resto.preguntas.filter((q) => q.pregunta.trim() && q.respuesta.trim()),
        ...(conTurnos ? { turnos } : {}),
      },
    });
  };

  return (
    <form onSubmit={enviar}>
      {secciones.includes('negocio') && (
        <>
          <label>
            ¿Qué hace tu negocio?
            <textarea
              rows={3}
              value={perfil.descripcion}
              onChange={(e) => set({ descripcion: e.target.value })}
              required
              minLength={10}
              placeholder="Somos una pizzería familiar en Palermo, con delivery propio y más de 15 años en el barrio."
            />
          </label>
          <label>
            Productos o servicios y precios
            <textarea
              rows={5}
              value={perfil.productos}
              onChange={(e) => set({ productos: e.target.value })}
              placeholder={'Muzzarella grande $9.000\nNapolitana grande $11.000\nEmpanadas $1.200 c/u'}
            />
            <small className="muted">Cuanto más completo, menos veces tu IA va a tener que decir "no sé".</small>
          </label>
          <div className="grid2">
            <label>
              Horarios de atención
              <input value={perfil.horarios} onChange={(e) => set({ horarios: e.target.value })} placeholder="Martes a domingo de 19 a 24" />
            </label>
            <label>
              Dirección o zona
              <input value={perfil.ubicacion} onChange={(e) => set({ ubicacion: e.target.value })} placeholder="Av. Siempreviva 742, Palermo" />
            </label>
          </div>
          <label>
            Medios de pago y envíos
            <input
              value={perfil.pagosEnvios}
              onChange={(e) => set({ pagosEnvios: e.target.value })}
              placeholder="Efectivo y Mercado Pago. Delivery gratis hasta 2 km."
            />
          </label>
        </>
      )}

      {secciones.includes('turnos') && conTurnos && (
        <>
          <label>
            ¿Qué servicios se reservan con turno?
            <textarea
              rows={3}
              value={perfil.turnos?.servicios ?? ''}
              onChange={(e) => setTurnos({ servicios: e.target.value })}
              placeholder="Corte, color, peinado"
            />
          </label>
          <label>
            Días y horarios en que das turnos
            <input
              value={perfil.turnos?.horarios ?? ''}
              onChange={(e) => setTurnos({ horarios: e.target.value })}
              placeholder="Martes a sábado de 10 a 18"
            />
          </label>
          <div className="grid2">
            <label>
              Duración de cada turno (minutos)
              <input
                type="number"
                min={5}
                max={480}
                value={perfil.turnos?.duracionMin ?? 30}
                onChange={(e) => setTurnos({ duracionMin: Number(e.target.value) })}
              />
            </label>
            <label>
              Anticipación mínima (horas)
              <input
                type="number"
                min={0}
                max={720}
                value={perfil.turnos?.anticipacionHoras ?? 2}
                onChange={(e) => setTurnos({ anticipacionHoras: Number(e.target.value) })}
              />
            </label>
          </div>
        </>
      )}

      {secciones.includes('estilo') && (
        <>
          <fieldset className="tonos">
            <legend>¿Cómo querés que hable?</legend>
            {TONOS.map((t) => (
              <label key={t.value} className={`tono ${perfil.tono === t.value ? 'tono-on' : ''}`}>
                <input type="radio" name="tono" value={t.value} checked={perfil.tono === t.value} onChange={() => set({ tono: t.value })} />
                <strong>{t.label}</strong>
                <span className="small muted">"{t.ejemplo}"</span>
              </label>
            ))}
          </fieldset>
          <label>
            ¿Cuándo tiene que pasarte la conversación?
            <input
              value={perfil.derivar}
              onChange={(e) => set({ derivar: e.target.value })}
              placeholder="Reclamos, pedidos grandes para eventos o si preguntan por facturación"
            />
          </label>
          <h3>Preguntas frecuentes</h3>
          <p className="small muted">Las que más te hacen. Tu IA las va a responder tal cual.</p>
          {perfil.preguntas.map((q, i) => (
            <div className="row" key={i}>
              <input aria-label={`Pregunta ${i + 1}`} placeholder="Pregunta" value={q.pregunta} onChange={(e) => setPregunta(i, { pregunta: e.target.value })} />
              <input aria-label={`Respuesta ${i + 1}`} placeholder="Respuesta" value={q.respuesta} onChange={(e) => setPregunta(i, { respuesta: e.target.value })} />
              <button type="button" className="link" onClick={() => set({ preguntas: perfil.preguntas.filter((_, j) => j !== i) })}>
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            className="secondary"
            disabled={perfil.preguntas.length >= 30}
            onClick={() => set({ preguntas: [...perfil.preguntas, { pregunta: '', respuesta: '' }] })}
          >
            Agregar pregunta
          </button>
        </>
      )}

      <ErrorMsg error={guardar.error} />
      <div className="form-acciones">
        <button type="submit" disabled={guardar.isPending || perfil.descripcion.trim().length < 10}>
          {guardar.isPending ? 'Guardando...' : boton}
        </button>
        {!secciones.includes('negocio') && perfil.descripcion.trim().length < 10 && (
          <span className="small error">Primero completá la descripción de tu negocio.</span>
        )}
      </div>
    </form>
  );
}

const TEXTOS: Record<keyof Mensajes, { label: string; ayuda: string }> = {
  espera: { label: 'Mensaje de espera', ayuda: 'Se envía si la IA tarda más de lo normal en responder.' },
  tope: { label: 'Mensaje al llegar al tope', ayuda: 'Se envía cuando se terminan las respuestas del período.' },
  handoff: { label: 'Mensaje al pasar con una persona', ayuda: 'Se envía cuando la IA te deriva la conversación.' },
  recordatorio: { label: 'Recordatorio de turno', ayuda: 'Usá {{hora}} donde quieras que aparezca la hora del turno.' },
};

export function TextosForm({ cuenta, campos, boton = 'Guardar textos', onGuardado }: FormProps & { campos: (keyof Mensajes)[] }) {
  const [mensajes, setMensajes] = useState<Mensajes>(cuenta.negocio.mensajes);
  const guardar = useAccionCuenta(onGuardado);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    guardar.mutate({ path: 'textos', method: 'PATCH', body: Object.fromEntries(campos.map((k) => [k, mensajes[k]])) });
  };
  return (
    <form onSubmit={enviar}>
      <p className="small muted">Estos textos se envían tal cual, sin pasar por la IA.</p>
      {campos.map((k) => (
        <label key={k}>
          {TEXTOS[k].label}
          <input value={mensajes[k]} onChange={(e) => setMensajes({ ...mensajes, [k]: e.target.value })} required />
          <small className="muted">{TEXTOS[k].ayuda}</small>
        </label>
      ))}
      <ErrorMsg error={guardar.error} />
      <button type="submit" disabled={guardar.isPending}>
        {boton}
      </button>
    </form>
  );
}

export function GuiaManychat({ cuenta }: { cuenta: Cuenta }) {
  const mc = cuenta.manychat;
  const cuerpo = JSON.stringify(
    {
      pageId: mc.pageId ?? 'TU_PAGE_ID',
      subscriberId: '{{user_id}}',
      endpointId: 'ID_DEL_CANAL',
      texto: '{{last_input_text}}',
      nombre: '{{first_name}}',
    },
    null,
    2,
  );
  return (
    <ol className="guia">
      <li>
        En ManyChat creá un flujo nuevo llamado <strong>Orbita</strong> y usalo como <em>Default Reply</em> (respuesta a cualquier mensaje).
      </li>
      <li>
        Agregá una acción <strong>External Request</strong> con método <code>POST</code> a:
        <Copiar texto={mc.entrada} />
        En <em>Headers</em> agregá <code>X-Orbita-Key</code> con este valor:
        <Copiar texto={mc.apiKey} />
        En <em>Body</em> pegá este JSON (los campos entre llaves se insertan desde el selector de ManyChat):
        <pre className="codigo">{cuerpo}</pre>
        En <em>Response mapping</em> guardá <code>$.messageId</code>, <code>$.estado</code> y <code>$.texto</code> en campos personalizados.
      </li>
      <li>
        Si <code>estado</code> es <code>listo</code>, enviá el <code>texto</code>. Si es <code>pendiente</code>, agregá otro External Request con
        método <code>GET</code> a la salida, con el mismo header:
        <Copiar texto={`${mc.salida}?messageId={{messageId}}`} />y enviá el <code>texto</code> que devuelve. Si vuelve pendiente, esperá unos
        segundos y repetí hasta 3 veces.
      </li>
      <li>
        Si la respuesta trae <code>handoff: true</code>, además de enviar el texto, asigná la conversación a una persona en el Live Chat.
      </li>
    </ol>
  );
}

export function ManychatForm({ cuenta, boton = 'Conectar', onGuardado }: FormProps) {
  const [pageId, setPageId] = useState(cuenta.manychat.pageId ?? '');
  const [appToken, setAppToken] = useState('');
  const guardar = useAccionCuenta((c) => {
    setAppToken('');
    onGuardado?.(c);
  });
  const conectado = Boolean(cuenta.manychat.appTokenMask);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    guardar.mutate({ path: 'manychat', method: 'PUT', body: { pageId, appToken } });
  };
  return (
    <form onSubmit={enviar}>
      <p className="small muted">
        En ManyChat andá a <strong>Settings → API</strong> y generá un token. El Page ID aparece en <strong>Settings → General</strong> (o en la
        dirección del navegador, después de <code>/fb</code>).
      </p>
      <div className="grid2">
        <label>
          Page ID de ManyChat
          <input value={pageId} onChange={(e) => setPageId(e.target.value)} required />
        </label>
        <label>
          Token de la API de ManyChat
          <input
            type="password"
            value={appToken}
            onChange={(e) => setAppToken(e.target.value)}
            placeholder={conectado ? `Guardado (${cuenta.manychat.appTokenMask})` : ''}
            required={!conectado}
            minLength={10}
          />
          <small className="muted">Lo guardamos cifrado. Nunca se muestra completo.</small>
        </label>
      </div>
      <ErrorMsg error={guardar.error} />
      <div className="form-acciones">
        <button type="submit" disabled={guardar.isPending || (!appToken && !conectado)}>
          {boton}
        </button>
        {conectado && <span className="badge badge-ok">Conectado</span>}
      </div>
    </form>
  );
}

export function CanalesForm({ cuenta, boton = 'Guardar canales', onGuardado }: FormProps) {
  const [canales, setCanales] = useState<Canal[]>(cuenta.canales.length ? cuenta.canales : [canalVacio()]);
  const guardar = useAccionCuenta(onGuardado);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    guardar.mutate({ path: 'canales', method: 'PUT', body: { canales } });
  };
  return (
    <form onSubmit={enviar}>
      <p className="small muted">
        El ID del canal es el que ManyChat manda en cada mensaje: en WhatsApp el <em>phone number ID</em>, en Instagram el <em>page ID</em> y en
        TikTok el identificador de la cuenta. Tu plan {cuenta.plan.nombre} admite {cuenta.plan.maxCanales}{' '}
        {cuenta.plan.maxCanales === 1 ? 'canal' : 'canales'}.
      </p>
      <CanalesEditor value={canales} max={cuenta.plan.maxCanales} onChange={setCanales} />
      <ErrorMsg error={guardar.error} />
      <button type="submit" disabled={guardar.isPending}>
        {boton}
      </button>
    </form>
  );
}

interface Linea {
  rol: 'user' | 'assistant';
  texto: string;
  acciones?: string[];
  handoff?: boolean;
}

export function sugerenciasDe(cuenta: Cuenta): string[] {
  const base = ['Hola, ¿qué horarios tienen?', '¿Cuánto sale?', '¿Dónde están ubicados?'];
  if (cuenta.negocio.modulos.includes('turnos')) base.push('Quiero un turno para mañana a las 10', 'Necesito cancelar mi turno');
  base.push('Quiero hablar con una persona');
  return base;
}

export function Simulador({ cuenta }: { cuenta: Cuenta }) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [texto, setTexto] = useState('');
  const probar = useMutation({
    mutationFn: (mensaje: string) =>
      api<Simulacion>('/cuenta/probar', {
        method: 'POST',
        body: { texto: mensaje, historial: lineas.slice(-20).map(({ rol, texto: t }) => ({ rol, texto: t })) },
      }),
    onSuccess: (r) => setLineas((ls) => [...ls, { rol: 'assistant', texto: r.texto, acciones: r.acciones, handoff: r.handoff }]),
  });
  const enviar = (mensaje: string) => {
    if (!mensaje.trim() || probar.isPending) return;
    setLineas((ls) => [...ls, { rol: 'user', texto: mensaje }]);
    setTexto('');
    probar.mutate(mensaje);
  };

  return (
    <div className="simulador">
      <div className="sim-chat" aria-live="polite">
        {lineas.length === 0 && <p className="muted small centrado">Escribile como si fueras un cliente. Nada de esto se envía ni consume tu plan.</p>}
        {lineas.map((l, i) => (
          <div key={i} className={`burbuja ${l.rol === 'user' ? 'out' : 'in'}`}>
            {l.texto}
            {l.acciones?.map((a) => (
              <span key={a} className="sim-accion">
                {a}
              </span>
            ))}
            {l.handoff && <span className="sim-accion">Te avisaría para que sigas vos</span>}
          </div>
        ))}
        {probar.isPending && <div className="burbuja in muted">Escribiendo...</div>}
      </div>
      <div className="chips">
        {sugerenciasDe(cuenta).map((s) => (
          <button key={s} type="button" className="chip" onClick={() => enviar(s)}>
            {s}
          </button>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
      >
        <input aria-label="Mensaje de prueba" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí un mensaje..." />
        <button type="submit" disabled={!texto.trim() || probar.isPending}>
          Enviar
        </button>
        {lineas.length > 0 && (
          <button type="button" className="secondary" onClick={() => setLineas([])}>
            Reiniciar
          </button>
        )}
      </form>
      <ErrorMsg error={probar.error} />
    </div>
  );
}

function ElegirPlan() {
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });
  const [planId, setPlanId] = useState<PlanId | ''>('');
  const elegir = useAccionCuenta();
  return (
    <div className="pago-bloque">
      <p>Todavía no elegiste un plan. Elegilo para poder pagar y activar la IA.</p>
      <div className="row">
        <select aria-label="Elegir plan" value={planId} onChange={(e) => setPlanId(e.target.value as PlanId)}>
          <option value="">Elegí un plan</option>
          {planes.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} · {pesos(p.precioMercadoPago)}/mes
            </option>
          ))}
        </select>
        <button onClick={() => planId && elegir.mutate({ path: 'plan', method: 'PATCH', body: { planId } })} disabled={!planId || elegir.isPending}>
          Elegir plan
        </button>
      </div>
      <ErrorMsg error={elegir.error} />
    </div>
  );
}

export function PagoBloque({ cuenta }: { cuenta: Cuenta }) {
  const sub = cuenta.suscripcion;
  const mp = useMutation({
    mutationFn: () => api<{ initPoint: string }>('/cuenta/suscripcion', { method: 'POST' }),
    onSuccess: ({ initPoint }) => location.assign(initPoint),
  });
  if (!sub) return null;
  if (sub.estadoPago === 'al_dia') {
    return <p className="ok-msg">Tu pago está al día. ¡Gracias!</p>;
  }
  if (!cuenta.planElegido) return <ElegirPlan />;
  return (
    <div className="pago-bloque">
      <p>
        Importe mensual: <strong>{pesos(sub.importe)}</strong>
      </p>
      <p className="small muted">Te llevamos a Mercado Pago para aprobar el débito automático mensual. Podés cancelarlo cuando quieras.</p>
      <ErrorMsg error={mp.error} />
      <button onClick={() => (sub.mpInitPoint ? location.assign(sub.mpInitPoint) : mp.mutate())} disabled={mp.isPending}>
        {mp.isPending ? 'Abriendo Mercado Pago...' : 'Pagar con Mercado Pago'}
      </button>
      <p className="small muted">Cuando se acredite el pago, arrancamos con el tutorial y se habilita el resto del panel.</p>
    </div>
  );
}
