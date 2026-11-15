import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { CanalesEditor, canalesParaEnviar, canalVacio } from '../components/CanalesEditor';
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

export function GuiaCanales() {
  return (
    <div className="guia-canales">
      <p className="small muted">
        Tu IA responde directo desde tu cuenta, sin apps intermedias. Para cada canal necesitás dos datos: el ID de la cuenta que recibe los
        mensajes y un token de acceso que la autoriza a contestar. Los webhooks ya están configurados del lado de Orbita.
      </p>
      <details>
        <summary>WhatsApp</summary>
        <ol>
          <li>
            Tu número tiene que estar en la <strong>API de WhatsApp Business (Cloud API)</strong>, dentro de una cuenta de Meta Business verificada.
          </li>
          <li>
            El ID es el <strong>Identificador del número de teléfono</strong>: aparece en Meta for Developers → WhatsApp → Configuración de la
            API, al lado de tu número. No es el número en sí.
          </li>
          <li>
            El token es uno <strong>permanente</strong> de un usuario del sistema (Configuración del negocio → Usuarios del sistema → Generar
            token) con los permisos <code>whatsapp_business_messaging</code> y <code>whatsapp_business_management</code>.
          </li>
          <li>Meta cobra los mensajes que inicia el negocio fuera de las 24 horas desde el último mensaje del cliente.</li>
        </ol>
      </details>
      <details>
        <summary>Instagram</summary>
        <ol>
          <li>La cuenta tiene que ser profesional (empresa o creador).</li>
          <li>
            En la app de Instagram activá <strong>Configuración → Mensajes y respuestas → Herramientas conectadas → Permitir acceso a los
            mensajes</strong>.
          </li>
          <li>
            El ID y el token salen de autorizar la app de Orbita con <strong>Iniciar sesión con Instagram</strong>, con el permiso{' '}
            <code>instagram_business_manage_messages</code>.
          </li>
          <li>Instagram solo deja responder dentro de las 24 horas desde el último mensaje del cliente.</li>
        </ol>
      </details>
      <details>
        <summary>TikTok</summary>
        <ol>
          <li>La cuenta tiene que ser de empresa (TikTok Business) y tener los mensajes directos habilitados.</li>
          <li>
            El ID (<code>business_id</code>) y el token salen de autorizar la app de Orbita en TikTok for Business con el permiso de mensajes.
          </li>
          <li>El token de TikTok vence rápido: si tu IA deja de contestar ahí, pegá uno nuevo.</li>
          <li>TikTok permite hasta 10 respuestas por conversación cada 48 horas desde el último mensaje del cliente.</li>
        </ol>
      </details>
      <p className="small muted">¿Te trabaste? Escribinos y conectamos la cuenta con vos.</p>
    </div>
  );
}

export function WebForm({ cuenta, boton = 'Guardar integración web', onGuardado }: FormProps) {
  const w = cuenta.web;
  const [activa, setActiva] = useState(w.activa || !w.clave);
  const [origenes, setOrigenes] = useState(w.origenes.join('\n'));
  const [bienvenida, setBienvenida] = useState(w.bienvenida ?? '');
  const [color, setColor] = useState(w.color ?? '#5b4cf0');
  const guardar = useAccionCuenta(onGuardado);
  const rotar = useAccionCuenta();
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    guardar.mutate({
      path: 'web',
      method: 'PUT',
      body: {
        activa,
        origenes: origenes.split(/[\s,]+/).filter(Boolean),
        bienvenida: bienvenida.trim() || undefined,
        color,
      },
    });
  };
  return (
    <form onSubmit={enviar}>
      <p className="small muted">
        Sumá un chat con tu IA a tu web, tienda o cualquier sistema. Pegás una línea de código y listo; también podés llamar a la API
        directo desde tu servidor. No cuenta como canal de tu plan.
      </p>
      <label className="check">
        <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} /> Integración web activa
      </label>
      <div className="grid2">
        <label>
          Dominios permitidos
          <textarea
            rows={3}
            value={origenes}
            onChange={(e) => setOrigenes(e.target.value)}
            placeholder={'mitienda.com\nmitienda.mitiendanube.com'}
          />
          <small className="muted">Uno por línea. Incluye los subdominios. Si lo dejás vacío, funciona en cualquier sitio.</small>
        </label>
        <div>
          <label>
            Mensaje de bienvenida
            <input value={bienvenida} onChange={(e) => setBienvenida(e.target.value)} maxLength={300} placeholder={`¡Hola! Soy el asistente de ${cuenta.negocio.nombre}. ¿En qué te ayudo?`} />
          </label>
          <label>
            Color del chat
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color del chat" />
          </label>
        </div>
      </div>
      <ErrorMsg error={guardar.error} />
      <div className="form-acciones">
        <button type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando...' : boton}
        </button>
        {w.clave && <span className={`badge ${w.activa ? 'badge-ok' : 'badge-muted'}`}>{w.activa ? 'Activa' : 'Desactivada'}</span>}
      </div>
      {w.clave && w.script && w.endpoint && (
        <div className="web-codigo">
          <h3>Código para tu web</h3>
          <p className="small muted">Pegalo antes de cerrar la etiqueta &lt;/body&gt;, en todas las páginas donde quieras el chat.</p>
          <Copiar texto={w.script} />
          <h3>API directa</h3>
          <p className="small muted">Para integrarlo en tu propio sistema, app o servidor:</p>
          <Copiar texto={`POST ${w.endpoint}`} />
          <pre className="codigo">{`curl -X POST ${w.endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"sesion":"cliente-123456","texto":"¿Tienen envío a domicilio?","nombre":"Ana"}'

→ { "texto": "...", "handoff": false, "estado": "respondido" }`}</pre>
          <p className="small muted">
            <code>sesion</code> identifica a cada persona (de 8 a 64 letras, números, guiones o guiones bajos): con la misma sesión la
            IA recuerda la charla. Si <code>handoff</code> es <code>true</code>, pedile un contacto y mandalo a{' '}
            <code>{w.endpoint.replace(/\/mensajes$/, '/contacto')}</code> con <code>{'{"sesion","contacto"}'}</code>: te llega por mail.
          </p>
          <button
            type="button"
            className="link small"
            disabled={rotar.isPending}
            onClick={() => confirm('La clave actual deja de funcionar al instante y vas a tener que pegar el código nuevo. ¿Seguimos?') && rotar.mutate({ path: 'web/clave' })}
          >
            Generar una clave nueva
          </button>
          <ErrorMsg error={rotar.error} />
        </div>
      )}
    </form>
  );
}

export function GuiaWeb() {
  return (
    <div className="guia-canales">
      <details>
        <summary>Cualquier sitio (HTML)</summary>
        <ol>
          <li>Abrí la plantilla o el archivo HTML de tu sitio.</li>
          <li>Pegá el código justo antes de <code>&lt;/body&gt;</code> y publicá.</li>
        </ol>
      </details>
      <details>
        <summary>WordPress</summary>
        <ol>
          <li>Instalá el plugin gratuito <strong>WPCode</strong> (o cualquiera de “insertar código en el pie”).</li>
          <li>En <strong>Code Snippets → Header &amp; Footer</strong>, pegá el código en <em>Footer</em> y guardá.</li>
          <li>Si usás un constructor (Elementor, Divi), también sirve su opción de código personalizado en el pie.</li>
        </ol>
      </details>
      <details>
        <summary>Shopify</summary>
        <ol>
          <li>
            Entrá a <strong>Tienda online → Temas</strong>, en tu tema tocá <strong>⋯ → Editar código</strong>.
          </li>
          <li>
            Abrí <code>layout/theme.liquid</code>, pegá el código antes de <code>&lt;/body&gt;</code> y guardá.
          </li>
        </ol>
      </details>
      <details>
        <summary>Tiendanube</summary>
        <ol>
          <li>
            En el administrador buscá la sección de <strong>códigos externos</strong> o scripts de tu tienda y pegá el código para todas las
            páginas.
          </li>
          <li>Si tu plan no permite códigos propios, cargalo con Google Tag Manager (abajo).</li>
          <li>Sumá en “Dominios permitidos” tu dominio y el de Tiendanube (por ejemplo, <code>mitienda.mitiendanube.com</code>).</li>
        </ol>
      </details>
      <details>
        <summary>Wix, Squarespace y otros</summary>
        <ol>
          <li>
            En Wix: <strong>Configuración → Código personalizado → Agregar código</strong>, ubicación <em>Body - final</em>, en todas las páginas.
          </li>
          <li>En otros constructores buscá “código personalizado”, “inyección de código” o “scripts del pie”.</li>
        </ol>
      </details>
      <details>
        <summary>Google Tag Manager</summary>
        <ol>
          <li>Creá una etiqueta <strong>HTML personalizado</strong> con el código.</li>
          <li>Activador: <strong>All Pages</strong>. Publicá el contenedor.</li>
        </ol>
      </details>
      <p className="small muted">
        Opcional en el código: <code>data-posicion="izquierda"</code> mueve la burbuja y <code>data-abierto="true"</code> la abre al cargar.
        Desde tu web podés usar <code>Orbita.abrir()</code> o <code>Orbita.enviar('texto')</code> en un botón propio.
      </p>
    </div>
  );
}

export function CanalesForm({ cuenta, boton = 'Guardar canales', onGuardado }: FormProps) {
  const [canales, setCanales] = useState<Canal[]>(cuenta.canales.length ? cuenta.canales : [canalVacio()]);
  const guardar = useAccionCuenta((c) => {
    setCanales(c.canales.length ? c.canales : [canalVacio()]);
    onGuardado?.(c);
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    guardar.mutate({ path: 'canales', method: 'PUT', body: { canales: canalesParaEnviar(canales) } });
  };
  return (
    <form onSubmit={enviar}>
      <p className="small muted">
        Tu plan {cuenta.plan.nombre} admite {cuenta.plan.maxCanales} {cuenta.plan.maxCanales === 1 ? 'canal' : 'canales'}. Los tokens se guardan
        cifrados y nunca se muestran completos.
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
