/**
 * Motor de la presentación de la landing: línea de tiempo, escenario en canvas 2D con
 * proyección en perspectiva, sonido sintetizado y sincronización de la capa HUD.
 * Trabaja sobre el DOM que monta <Presentacion /> y no depende de React.
 */

type V3 = [number, number, number];
interface XY { x: number; y: number }
interface Pt extends XY { s: number; z: number }
interface Ring { r: number; ax: number; az: number }
interface Snap { scene: number; t: number; playing: boolean; started: boolean; ended: boolean }
interface Paso { l: string; d: string; a: number; b: number }
interface Titular { id: string; eyebrow: string; title: string; sub?: string; subId?: string }
interface Llamada { k: string; anchor: string; title: string; sub: string; side?: string }

export interface Presentacion {
  irA(destino: string): void;
  refrescar(): void;
  desmontar(): void;
}

/* ───────── utilidades ───────── */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const easeIn = (k: number) => k * k * k;
const INK = '#0a0a0e', BLUE = '#2f5be8', BLUE_HI = '#4d7cff', TAU = Math.PI * 2, D2R = Math.PI / 180;
const FUENTE = 'Manrope, system-ui, sans-serif';

/* ───────── línea de tiempo ───────── */
export const ESCENAS = [
  { key: 'intro', n: '01', label: 'Órbita', dur: 9 },
  { key: 'ia', n: '02', label: 'Qué es la IA', dur: 14 },
  { key: 'negocio', n: '03', label: 'Tu negocio', dur: 11 },
  { key: 'demo', n: '04', label: 'Un ejemplo', dur: 15 },
  { key: 'canales', n: '05', label: 'Canales', dur: 12 },
  { key: 'planes', n: '06', label: 'Planes', dur: 17 },
];
const TOTAL = ESCENAS.reduce((a, s) => a + s.dur, 0);
/** Destinos a los que se puede saltar desde la navegación o el hash de la URL: [escena, segundo]. */
const DESTINOS: Record<string, [number, number]> = { 'como-funciona': [1, 0], 'demo-chat': [3, 0], planes: [5, 6.4] };

/* ───────── contenido ───────── */
const TOK_IN = ['¿Tienen', 'turno', 'para', 'corte', 'mañana', 'a la tarde', '?'];
const TOK_OUT = ['¡Hola!', 'Mañana', 'tengo', 'libre', 'a las', '16:00', 'y a las', '17:30'];
const DOCS = [['Lista de precios', 'PDF'], ['Planilla de stock', 'XLSX'], ['Horarios', 'Tu info'], ['Envíos', 'Tu info'], ['Medios de pago', 'Tu info']];
const CHANNELS = ['WhatsApp', 'Instagram', 'TikTok'];
const DOC_T = (i: number) => 3.4 + i * 1.2;
const IA_STEPS: Paso[] = [
  { l: 'Lee el mensaje', d: 'Recibe el texto tal como lo escribió tu cliente', a: 0, b: 3 },
  { l: 'Lo separa en piezas', d: 'Palabras y partes de palabras, llamadas tokens', a: 3, b: 5.4 },
  { l: 'Relaciona lo que aprendió', d: 'Un modelo de lenguaje conecta esas piezas', a: 5.4, b: 8.4 },
  { l: 'Escribe la respuesta', d: 'Elige la palabra más probable, una tras otra', a: 8.4, b: 12.2 },
  { l: 'Responde en segundos', d: 'No es magia: es cálculo, muy rápido', a: 12.2, b: 99 },
];
const CHAT_STEPS: Paso[] = [
  { l: 'Llega la consulta', d: 'A cualquier hora, por el canal del cliente', a: 0, b: 2.6 },
  { l: 'Responde con tu info', d: 'Precios, horarios y turnos libres', a: 2.6, b: 6 },
  { l: 'El cliente elige', d: 'Sin que nadie quede en visto', a: 6, b: 7.8 },
  { l: 'Agenda el turno sola', d: 'Dentro de tus horarios', a: 7.8, b: 10.2 },
  { l: 'Avisa un día antes', d: 'Para que no falten', a: 10.2, b: 99 },
];
const CONTROL = [['Canales', 'WhatsApp, Instagram y TikTok'], ['Derivación', 'Te pasa la charla al instante'], ['Simulador', 'Probala antes de activarla'], ['Pausa', 'Pausala cuando quieras'], ['Métricas', 'Mirá cuántos mensajes respondió']];
const CONTROL_T = [0, 5.6, 8.6, 9.7, 10.8];
const MSGS = [
  { t: 1.8, who: 'c', text: 'Hola! Tienen turno para corte mañana a la tarde?' },
  { t: 3.8, who: 'b', text: '¡Hola! 😊 Mañana tengo libre a las 16:00 y a las 17:30. ¿Cuál te queda mejor?' },
  { t: 6.0, who: 'c', text: '17:30 porfa, soy Sofi' },
  { t: 7.8, who: 'b', text: 'Listo Sofi, te agendé mañana a las 17:30 para corte. Te escribo un rato antes para recordarte ✂️' },
  { t: 10.2, who: 'sys', text: '✓ Turno agendado · mañana 17:30' },
];
const TYPING = [[2.6, 3.8], [6.8, 7.8]];
const FLOW = [['Creás tu cuenta', 'Te registrás en dos minutos'], ['Le contás de tu negocio', 'Tutorial guiado, sin prompts'], ['Conectás tus canales', 'Directo, sin apps intermedias'], ['Probás y activás', 'Simulador y un clic']];
const SIDE: Record<number, { title: string; tag: string; steps?: Paso[]; specs?: string[][] }> = {
  1: { title: 'Cómo responde una IA', tag: 'PASO A PASO', steps: IA_STEPS },
  2: { title: 'Lo que aprende', tag: 'TU NEGOCIO', specs: DOCS.map((d) => [d[1], d[0]]) },
  3: { title: 'Una charla de ejemplo', tag: 'TURNOS', steps: CHAT_STEPS },
  4: { title: 'Vos tenés el control', tag: 'PANEL', specs: CONTROL },
};
export const TITULO_INICIAL = 'Tu comercio responde al instante, <b>las 24 horas.</b>';

function headlineFor(s: Snap): Titular | null {
  const t = s.t;
  switch (s.scene) {
    case 0: return t >= 6.6 ? { id: 'h0', eyebrow: 'Asistente con IA para comercios', title: TITULO_INICIAL } : null;
    case 1: {
      const subs = ['Todo empieza con un mensaje, como el que te manda cualquier cliente.', 'La IA no lee como nosotros: parte el texto en piezas pequeñas llamadas tokens.', 'Un modelo de lenguaje aprendió de millones de textos cómo se relacionan esas piezas.', 'Con eso calcula la palabra más probable y arma la respuesta, una tras otra.', 'Por eso responde en segundos, a cualquier hora.'];
      const b = IA_STEPS.findIndex((x) => t >= x.a && t < x.b);
      return { id: 'h1', eyebrow: '02 · Qué es la inteligencia artificial', title: 'Un modelo que lee, entiende <b>y responde.</b>', sub: subs[Math.max(0, b)], subId: 'a' + b };
    }
    case 2: return { id: 'h2', eyebrow: '03 · Aprende de tu negocio', title: 'Le contás de tu negocio. <b>Sin escribir prompts.</b>', sub: t < 9.2 ? 'Subís tu PDF o tu planilla de stock y un tutorial guiado le pregunta lo que necesita saber.' : 'Desde ahí responde con la información de tu comercio, no con respuestas genéricas.', subId: t < 9.2 ? 'n0' : 'n1' };
    case 3: return { id: 'h3', eyebrow: '04 · Así atiende', title: 'Responde consultas y <b>agenda turnos sola.</b>', sub: t < 10.2 ? 'Un ejemplo: una peluquería recibe un pedido de turno fuera de horario.' : 'Toma, confirma y cancela turnos, y avisa un día antes para que no falten.', subId: t < 10.2 ? 'd0' : 'd1' };
    case 4: return t < 5.6 ? { id: 'h4a', eyebrow: '05 · Canales', title: 'WhatsApp, Instagram y TikTok. <b>Una sola IA.</b>', sub: 'Se conecta directo con tus canales, sin apps intermedias.', subId: 'c0' } : { id: 'h4b', eyebrow: '05 · Vos tenés el control', title: 'Sabe cuándo <b>pasarte la charla.</b>', sub: 'Si alguien pide hablar con una persona o hay un reclamo, te deriva la conversación al instante.', subId: 'c1' };
    default: return null;
  }
}

/* ───────── geometría ───────── */
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function ringPt(R: Ring, th: number): V3 {
  const x = R.r * Math.cos(th), z = R.r * Math.sin(th);
  const y1 = -z * Math.sin(R.ax), z1 = z * Math.cos(R.ax);
  return [x * Math.cos(R.az) - y1 * Math.sin(R.az), x * Math.sin(R.az) + y1 * Math.cos(R.az), z1];
}
const MAIN: Ring = { r: 8, ax: 0.3, az: 0.44 }, RING2: Ring = { r: 10.5, ax: -0.22, az: -0.16 };
const CORE_R = 2.6;
const DECOR: Ring[] = [{ r: 17, ax: 0.5, az: 0.5 }, { r: 23, ax: 0.42, az: 0.38 }, { r: 31, ax: 0.6, az: 0.3 }];
const NET = (() => {
  const pts: V3[] = [], n = 34;
  for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996; pts.push([Math.cos(th) * r * 1.95, y * 1.95, Math.sin(th) * r * 1.95]); }
  const ed: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]) < 1.45) ed.push([i, j]);
  return { pts, ed };
})();
function quad(a: XY, b: XY, c: XY, u: number): XY { const k = 1 - u; return { x: a.x * k * k + c.x * 2 * u * k + b.x * u * u, y: a.y * k * k + c.y * 2 * u * k + b.y * u * u }; }
interface Clave { t: number; pos: V3; tgt: V3 }
function camKeys(list: Clave[], t: number): { pos: V3; tgt: V3 } {
  if (t <= list[0].t) return list[0];
  for (let i = 0; i < list.length - 1; i++) { const a = list[i], b = list[i + 1]; if (t <= b.t) { const k = ease(seg(t, a.t, b.t)); return { pos: mix3(a.pos, b.pos, k), tgt: mix3(a.tgt, b.tgt, k) }; } }
  return list[list.length - 1];
}

/* ───────── sonido (Web Audio, sintetizado) ───────── */
const NOTE = { E2: 82.41, B2: 123.47, E3: 164.81, FS3: 185, GS3: 207.65, E4: 329.63, GS4: 415.3, B4: 493.88, E5: 659.25, FS5: 739.99, GS5: 830.61, B5: 987.77, CS6: 1108.73, E6: 1318.51, GS6: 1661.22 };
interface Tono { f: number; to?: number; t?: number; a?: number; d?: number; g?: number; type?: OscillatorType; wet?: number }
interface Ruido { t?: number; dur?: number; type?: BiquadFilterType; q?: number; f?: number; f2?: number; g?: number; a?: number; wet?: number }

/** Volumen general: el sonido acompaña, no protagoniza. */
const VOLUMEN = 0.5;

function crearAudio() {
  let ctx: AudioContext | null = null;
  let master: GainNode, bus: GainNode, revIn: GainNode, noiseBuf: AudioBuffer, padG: GainNode, padF: BiquadFilterNode;
  let enabled = true;
  try { enabled = localStorage.getItem('orbita-sound') !== 'off'; } catch { /* sin almacenamiento */ }
  let prevScene = -1, prevT = 0, lastSpark = 0, lastType = 0, sonando = false;
  const subs = new Set<() => void>();
  // iOS < 17 (sin audioSession): un <audio> sonando pasa la sesión a "reproducción" y el switch de silencio deja de mutear Web Audio.
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
  let puente: HTMLAudioElement | null = null;
  function silencioWav() {
    const n = 4000, b = new DataView(new ArrayBuffer(44 + n)), txt = (o: number, s: string) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
    txt(0, 'RIFF'); b.setUint32(4, 36 + n, true); txt(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
    b.setUint32(24, 8000, true); b.setUint32(28, 8000, true); b.setUint16(32, 1, true); b.setUint16(34, 8, true); txt(36, 'data'); b.setUint32(40, n, true);
    for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([b.buffer], { type: 'audio/wav' }));
  }
  function puenteIOS(on: boolean) {
    if (!ios || 'audioSession' in navigator) return;
    if (on && !puente) { puente = new Audio(silencioWav()); puente.loop = true; puente.setAttribute('playsinline', ''); puente.setAttribute('x-webkit-airplay', 'deny'); }
    if (!puente) return;
    if (on) void puente.play().catch(() => {}); else puente.pause();
  }
  function init() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    // iOS: sin esto, el switch de silencio apaga Web Audio aunque el volumen esté alto.
    const sesion = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (sesion) try { sesion.type = 'playback'; } catch { /* no soportado */ }
    const c = new AC(); ctx = c;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    master = c.createGain(); master.gain.value = 0; bus = c.createGain();
    bus.connect(comp); comp.connect(master); master.connect(c.destination);
    const rev = c.createConvolver(), len = Math.floor(c.sampleRate * 2.6), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    rev.buffer = ir; revIn = c.createGain(); revIn.gain.value = 0.5; revIn.connect(rev); rev.connect(bus);
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    padF = c.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 300; padG = c.createGain(); padG.gain.value = 0;
    ([[NOTE.E2, 'sawtooth', -6, 0.3], [NOTE.B2, 'sawtooth', 5, 0.3], [NOTE.FS3, 'triangle', -3, 0.5], [NOTE.GS3, 'triangle', 4, 0.5], [NOTE.E3, 'sine', 0, 0.5]] as [number, OscillatorType, number, number][]).forEach(([f, type, det, gn]) => {
      const os = c.createOscillator(); os.type = type; os.frequency.value = f; os.detune.value = det;
      const gg = c.createGain(); gg.gain.value = gn; os.connect(gg); gg.connect(padF); os.start();
    });
    padF.connect(padG); out(padG, 0.5);
    return true;
  }
  const now = () => ctx!.currentTime + 0.012;
  function out(node: AudioNode, wet: number) { node.connect(bus); if (wet > 0) { const w = ctx!.createGain(); w.gain.value = wet; node.connect(w); w.connect(revIn); } }
  function tone(o: Tono) {
    const c = ctx!, t0 = now() + (o.t || 0), a = o.a || 0.005, d = o.d || 0.4;
    const os = c.createOscillator(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.f, t0); if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t0 + a + d);
    const gn = c.createGain(); gn.gain.setValueAtTime(0.0001, t0); gn.gain.linearRampToValueAtTime(o.g || 0.1, t0 + a); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    os.connect(gn); out(gn, o.wet == null ? 0.25 : o.wet); os.start(t0); os.stop(t0 + a + d + 0.05);
  }
  function noise(o: Ruido) {
    const c = ctx!, t0 = now() + (o.t || 0), dur = o.dur || 0.5;
    const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const fl = c.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.Q.value = o.q || 1; fl.frequency.setValueAtTime(o.f || 1000, t0); if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
    const gn = c.createGain(); gn.gain.setValueAtTime(0.0001, t0); gn.gain.linearRampToValueAtTime(o.g || 0.1, t0 + Math.max(o.a || 0.01, 0.005)); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(gn); out(gn, o.wet == null ? 0.2 : o.wet); src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
  }
  const bell = (f: number, t = 0, gn = 0.07, d = 1.5) => { tone({ f, t, g: gn, d, wet: 0.5 }); tone({ f: f * 2.01, t, g: gn * 0.3, d: d * 0.5, wet: 0.5 }); };
  const S = {
    blip: (f = 1400, gn = 0.045, t = 0) => tone({ f, t, a: 0.002, d: 0.08, g: gn, wet: 0.15 }),
    tick: () => noise({ dur: 0.025, g: 0.03, f: 3000 + Math.random() * 900, q: 4, wet: 0.02 }),
    whoosh: (dur = 1, gn = 0.09) => noise({ dur, g: gn, f: 280, f2: 2600, q: 1.4, a: dur * 0.55, wet: 0.3 }),
    riser: (dur = 1.2) => noise({ dur, g: 0.07, type: 'highpass', f: 400, f2: 7000, q: 0.8, a: dur * 0.9, wet: 0.35 }),
    impact: (gn = 0.3) => { tone({ f: 90, to: 36, a: 0.003, d: 1, g: gn, wet: 0.3 }); noise({ dur: 0.8, g: gn * 0.3, type: 'lowpass', f: 2200, f2: 120, q: 0.5, wet: 0.6 }); },
    pop: () => tone({ f: 520, to: 1040, a: 0.004, d: 0.12, g: 0.06, wet: 0.2 }),
    chirp: () => [NOTE.B4, NOTE.E5, NOTE.GS5].forEach((f, i) => tone({ f, t: i * 0.055, a: 0.003, d: 0.12, g: 0.05, type: 'triangle' })),
    signature: (full = true) => { const sq = full ? [NOTE.E5, NOTE.B5, NOTE.E6, NOTE.GS6] : [NOTE.B5, NOTE.E6]; sq.forEach((f, i) => bell(f, i * 0.13, 0.07, full && i === sq.length - 1 ? 2.6 : 1.4)); if (full) tone({ f: NOTE.E2, a: 0.08, d: 2.6, g: 0.15, wet: 0.4 }); },
    star: (i: number) => bell([NOTE.E5, NOTE.FS5, NOTE.GS5, NOTE.B5, NOTE.CS6][i % 5], 0, 0.035, 0.9),
    success: () => [NOTE.E5, NOTE.GS5, NOTE.B5, NOTE.E6].forEach((f) => bell(f, 0, 0.03, 1.8)),
    node: (i: number) => bell([NOTE.E4, NOTE.GS4, NOTE.B4, NOTE.E5, NOTE.GS5][i % 5], 0, 0.05, 1.2),
    sparkle: () => tone({ f: [NOTE.E6, NOTE.GS6, NOTE.B5, NOTE.CS6][(Math.random() * 4) | 0], a: 0.002, d: 0.25, g: 0.006 + Math.random() * 0.006, wet: 0.6 }),
  };
  const CUES: [number, () => void][][] = [
    [[0.05, () => S.impact(0.25)], [3.5, () => S.signature(true)], [4.1, () => S.riser(0.9)], [5, () => { S.impact(0.45); S.whoosh(1.6, 0.14); }], [6.6, () => bell(NOTE.B4, 0, 0.05, 2.2)]],
    [[0.6, () => S.whoosh(0.9)], [1.2, () => S.pop()], ...TOK_IN.map((x, i): [number, () => void] => [3 + i * 0.18, () => S.blip(1100 + i * 110, 0.02)]), ...TOK_OUT.map((x, i): [number, () => void] => [8.4 + i * 0.4, () => S.star(i)]), [12.2, () => S.success()]],
    [[0.4, () => S.whoosh(1.2)], ...DOCS.map((x, i): [number, () => void] => [DOC_T(i) + 0.75, () => S.node(i)]), [9.3, () => { S.success(); S.signature(false); }]],
    [[0.5, () => S.whoosh(1)], [1.8, () => S.pop()], [3.8, () => S.chirp()], [6, () => S.pop()], [7.8, () => S.chirp()], [10.2, () => S.success()], [11.5, () => S.blip(1500)]],
    [[0.4, () => S.whoosh(1)], [1, () => S.blip(1200)], [1.3, () => S.blip(1400)], [1.6, () => S.blip(1600)], [5.6, () => S.blip(500, 0.06)], [6.6, () => S.impact(0.22)], [7.4, () => S.signature(false)], [8.6, () => S.blip(1300)], [9.7, () => S.blip(1450)], [10.8, () => S.blip(1600)]],
    [...FLOW.map((x, i): [number, () => void] => [1.2 + i, () => S.node(i)]), ...[0, 1, 2, 3].map((i): [number, () => void] => [6.7 + i * 0.3, () => S.pop()]), [10.4, () => S.riser(1.3)], [11.8, () => { S.impact(0.45); S.signature(true); }]],
  ];
  function update(E: Snap & { clock: number }) {
    const c = ctx;
    if (!c) return;
    // En pausa se baja el volumen en vez de suspender el contexto: iOS solo deja reanudarlo dentro de un toque.
    const run = enabled && E.started && E.playing;
    if (run !== sonando) { sonando = run; master.gain.setTargetAtTime(run ? VOLUMEN : 0, c.currentTime, 0.08); puenteIOS(run); }
    if (run && c.state !== 'running') void c.resume().catch(() => {});
    if (!run) return;
    const s = E.scene, t = E.t;
    if (s !== prevScene) { if (prevScene !== -1 || s !== 0) S.whoosh(1, 0.05); prevScene = s; prevT = -0.001; }
    if (t < prevT || t - prevT > 0.6) prevT = t - 0.001;
    for (const [ct, fn] of CUES[s]) if (ct > prevT && ct <= t) { try { fn(); } catch { /* nunca romper el render */ } }
    if (s === 0 && t > 0.3 && t < 3.5 && E.clock - lastSpark > 0.12) { lastSpark = E.clock; if (Math.random() < 0.4) S.sparkle(); }
    if (s === 3 && TYPING.some(([a, b]) => t > a && t < b) && E.clock - lastType > 0.12) { lastType = E.clock; S.tick(); }
    padG.gain.setTargetAtTime(s === 0 ? 0.02 + 0.03 * seg(t, 3.4, 6.4) : 0.025, c.currentTime, 0.4);
    padF.frequency.setTargetAtTime(s === 0 ? 280 + 900 * seg(t, 0.3, 6.5) : s === 5 ? 900 + 1400 * seg(t, 10, 12.5) : 950, c.currentTime, 0.4);
    prevT = t;
  }
  return {
    get enabled() { return enabled; },
    /** Tiene que correr dentro de un gesto del usuario (toque, clic o tecla): es lo que habilita el audio en iOS. */
    unlock() {
      if (!ctx && !init()) return;
      const c = ctx!;
      if (c.state !== 'running') void c.resume().catch(() => {});
      const silencio = c.createBufferSource(); silencio.buffer = c.createBuffer(1, 1, 22050); silencio.connect(c.destination); silencio.start(0);
      if (enabled) puenteIOS(true);
    },
    toggle() {
      enabled = !enabled;
      if (enabled) puenteIOS(true);
      try { localStorage.setItem('orbita-sound', enabled ? 'on' : 'off'); } catch { /* sin almacenamiento */ }
      subs.forEach((f) => f());
    },
    subscribe(f: () => void) { subs.add(f); },
    update,
    cerrar() {
      subs.clear(); if (ctx) void ctx.close(); ctx = null;
      if (puente) { puente.pause(); URL.revokeObjectURL(puente.src); puente = null; }
    },
  };
}

/* ───────── interfaz ───────── */
const ICON = {
  play: '<svg class="i f" viewBox="0 0 24 24"><path d="M8 5.6v12.8L18.5 12z"/></svg>',
  pause: '<svg class="i f" viewBox="0 0 24 24"><rect x="7" y="5.5" width="3.4" height="13" rx="1.2"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1.2"/></svg>',
  on: '<svg class="i" viewBox="0 0 24 24"><path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path d="M15 9.2a4 4 0 0 1 0 5.6"/><path d="M17.6 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>',
  off: '<svg class="i" viewBox="0 0 24 24"><path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg>',
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = (x: number) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(Math.floor(x % 60)).padStart(2, '0')}`;

export function montarPresentacion(root: HTMLElement): Presentacion {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const cancel = (id: number) => { window.clearTimeout(id); timers.delete(id); };

  /* línea de tiempo */
  const engine = {
    scene: 0, t: 0, clock: 0, playing: false, started: false, ended: false, requestBlend: false, beat: -1,
    subs: new Set<() => void>(),
    snap: { scene: 0, t: 0, playing: false, started: false, ended: false } as Snap,
    emit() { this.snap = { scene: this.scene, t: this.t, playing: this.playing, started: this.started, ended: this.ended }; this.subs.forEach((f) => f()); },
    goTo(i: number, play = true, t0 = 0) { this.scene = clamp(i, 0, ESCENAS.length - 1); this.t = t0; this.beat = -1; this.started = true; this.ended = false; this.requestBlend = true; if (play) this.playing = true; this.emit(); },
    toggle() { if (!this.started || this.ended) return this.goTo(0); this.playing = !this.playing; this.emit(); },
    pause() { if (this.playing) { this.playing = false; this.emit(); } },
    next() { if (this.scene < ESCENAS.length - 1) this.goTo(this.scene + 1); },
    prev() { this.goTo(this.t > 1.5 ? this.scene : this.scene - 1); },
    elapsed() { let a = 0; for (let i = 0; i < this.scene; i++) a += ESCENAS[i].dur; return a + this.t; },
    tick(dt: number) {
      if (!this.started) { this.clock += dt; return; }
      if (!this.playing) return;
      this.clock += dt; this.t += dt;
      const d = ESCENAS[this.scene].dur;
      if (this.t >= d) {
        if (this.scene < ESCENAS.length - 1) { this.goTo(this.scene + 1); return; }
        this.t = d; this.playing = false; this.ended = true; this.emit(); return;
      }
      const b = Math.floor(this.t * 10);
      if (b !== this.beat) { this.beat = b; this.emit(); }
    },
  };

  /* escenario */
  const cv = $<HTMLCanvasElement>('stage');
  const lienzo = cv.getContext('2d');
  const g = lienzo as CanvasRenderingContext2D;
  let W = 1, H = 1, DPR = 1, UI = 1, aspect = 1, narrow = false;
  const cam = { pos: [0, 2, 40] as V3, tgt: [0, 0, 0] as V3, epos: [0, 2, 40] as V3, fov: 32, f: [0, 0, -1] as V3, r: [1, 0, 0] as V3, u: [0, 1, 0] as V3, focal: 1, cx: 0, cy: 0, zoom: 1 };
  let blend: { pos: V3; tgt: V3 } | null = null;
  let anchors: Record<string, XY> = {};
  /** Franja vertical libre para la animación: entre la barra superior y el texto (o el bloque final). */
  const hueco = { top: 0, bottom: 1 };
  let cuadro = 0;
  function medirHueco(cierre: boolean) {
    const base = root.getBoundingClientRect();
    const barra = root.querySelector('.topbar')?.getBoundingClientRect();
    const debajo = (cierre ? $('final') : root.querySelector('.columna'))?.getBoundingClientRect();
    hueco.top = (barra ? barra.bottom - base.top : 0) + 12;
    hueco.bottom = Math.max(hueco.top + 1, (debajo ? debajo.top - base.top : H) - 16);
  }
  function P(p: V3): Pt | null {
    const d = sub3(p, cam.epos), z = dot3(d, cam.f);
    if (z < 0.5) return null;
    const s = cam.focal / z;
    return { x: cam.cx + dot3(d, cam.r) * s, y: cam.cy - dot3(d, cam.u) * s, s, z };
  }
  const RING2R = (): Ring => (narrow ? { r: 8.2, ax: RING2.ax, az: RING2.az } : RING2);
  function camFor(s: number, t: number) {
    switch (s) {
      case 0: return camKeys([{ t: 0, pos: [0, 2, 42], tgt: [0, 0, 0] }, { t: 9, pos: [4, 4, 35], tgt: [0, 0, 0] }], t);
      case 1: return camKeys([{ t: 0, pos: [-3, 3, 38], tgt: [0, 0.4, 0] }, { t: 14, pos: [3, 4.5, 34], tgt: [0, 0.4, 0] }], t);
      case 2: return camKeys([{ t: 0, pos: [7, 7, 37], tgt: [0, 0, 0] }, { t: 11, pos: [-5, 5, 34], tgt: [0, 0, 0] }], t);
      case 3: return camKeys([{ t: 0, pos: [0, 4, 44], tgt: [0, 0, 0] }, { t: 15, pos: [3, 5, 40], tgt: [0, 0, 0] }], t);
      case 4: return camKeys([{ t: 0, pos: [-2, 5, 40], tgt: [0, 1, 0] }, { t: 12, pos: [3, 6.5, 36], tgt: [0, 1, 0] }], t);
      default: return camKeys([{ t: 0, pos: [-6, 4, 46], tgt: [0, 0, 0] }, { t: 11, pos: [-2, 2, 44], tgt: [0, -1, 0] }, { t: 13.2, pos: [0, 2.3, 38], tgt: [0, 0, 0] }, { t: 17, pos: [1.5, 2.6, 36], tgt: [0, 0, 0] }], t);
    }
  }
  /** Llamadas ancladas a la escena. Siempre hacia la derecha, lejos de la columna de texto; en pantallas angostas no hay lugar. */
  function calloutsFor(s: Snap): Llamada[] {
    const t = s.t, c: Llamada[] = [];
    if (narrow || H <= 500) return c;
    if (s.scene === 1) {
      if (t > 1.4 && t < 3) c.push({ k: 'm', anchor: 'msgIn', title: 'Mensaje del cliente', sub: 'texto libre' });
      if (t > 5.9 && t < 8.3) c.push({ k: 'md', anchor: 'core', title: 'Modelo de lenguaje', sub: 'relaciona las piezas' });
      if (t > 12.7) c.push({ k: 'rp', anchor: 'reply', title: 'Respuesta', sub: 'palabra por palabra' });
    }
    if (s.scene === 2 && t > 9.4) c.push({ k: 'ok', anchor: 'core', title: 'Lista para responder', sub: 'con la info de tu negocio' });
    if (s.scene === 3) {
      if (t > 4.2 && t < 6) c.push({ k: 'p1', anchor: 'phone', title: 'Usa tu información', sub: 'según tus horarios' });
      if (t > 11.4) c.push({ k: 'p2', anchor: 'phone', title: 'Turno agendado', sub: 'sin que toques el teléfono' });
    }
    if (s.scene === 4) {
      if (t > 2.2 && t < 5.4) c.push({ k: 'c1', anchor: 'core', title: 'Una sola IA', sub: 'atiende los 3 canales' });
      if (t > 7.4 && t < 11.6) c.push({ k: 'c2', anchor: 'vos', title: 'Te pasa la charla', sub: 'reclamos o pedido de persona' });
    }
    return c;
  }

  /* partículas del logo (intro): se forman en negro, la línea de luz las pasa a blanco */
  const N = 2600;
  const pS = new Float32Array(N * 2), pL = new Float32Array(N * 2), pE = new Float32Array(N * 2), pDelay = new Float32Array(N), pPhase = new Float32Array(N), pBlue = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const a = Math.random() * TAU, r = 0.35 + Math.random() * 0.75; pS[i * 2] = Math.cos(a) * r; pS[i * 2 + 1] = Math.sin(a) * r * 0.7; pDelay[i] = Math.random() * 0.35; pPhase[i] = Math.random() * TAU; }
  let logoScale = 1;
  function buildLogo() {
    const c = document.createElement('canvas'), LW = 900, LH = 520; c.width = LW; c.height = LH;
    const x = c.getContext('2d', { willReadFrequently: true });
    if (!x) return;
    x.translate(430, 170); x.strokeStyle = '#fff'; x.lineWidth = 10;
    x.beginPath(); x.arc(0, 0, 60, 0, TAU); x.stroke();
    x.save(); x.rotate(-27 * D2R); x.beginPath(); x.ellipse(0, 0, 190, 66, 0, 0, TAU); x.stroke(); x.restore();
    x.fillStyle = '#0000ff'; x.beginPath(); x.arc(166, -76, 30, 0, TAU); x.fill();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.font = `300 120px ${FUENTE}`;
    const chars = 'órbita'.split(''), sp = 16; let tw = 0; chars.forEach((ch) => { tw += x.measureText(ch).width + sp; }); tw -= sp;
    let px = (LW - tw) / 2; chars.forEach((ch) => { x.fillText(ch, px, 420); px += x.measureText(ch).width + sp; });
    const d = x.getImageData(0, 0, LW, LH).data, cand: number[] = [];
    for (let yy = 0; yy < LH; yy += 2) for (let xx = 0; xx < LW; xx += 2) { const k = (yy * LW + xx) * 4; if (d[k + 3] > 140) cand.push(xx, yy, d[k] < 100 ? 1 : 0); }
    const n = cand.length / 3; if (!n) return;
    logoScale = Math.min(W * 0.86, H * 0.9, 640) / LW;
    for (let i = 0; i < N; i++) {
      const j = ((Math.random() * n) | 0) * 3;
      pL[i * 2] = cand[j] + Math.random() * 2 - LW / 2; pL[i * 2 + 1] = cand[j + 1] + Math.random() * 2 - LH / 2; pBlue[i] = cand[j + 2];
      const a = Math.random() * TAU, r = 200 + Math.random() * 600; pE[i * 2] = pL[i * 2] + Math.cos(a) * r; pE[i * 2 + 1] = pL[i * 2 + 1] + Math.sin(a) * r - 80;
    }
  }
  function resize() {
    W = root.clientWidth || 1; H = root.clientHeight || 1; DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    aspect = W / H; narrow = aspect <= 1 || (W <= 860 && aspect <= 1.5); cuadro = 0; UI = clamp(Math.min(W / 420, H / 780), 0.72, 1.12);
    const ph = $('phoneWrap').offsetHeight; if (ph) $('phone').style.fontSize = (ph / 40).toFixed(2) + 'px';
    if (lienzo) buildLogo();
  }
  function drawParticles(conv: number, alpha: number, sweepX: number, burst: number, clock: number) {
    const cx = W / 2, cy = H * 0.44, R = Math.max(W, H);
    const sz = Math.max(1.4, 2.1 * logoScale * 1.5);
    for (let pass = 0; pass < 4; pass++) {
      // 0: blanco, 1: azul claro (sobre negro) · 2: tinta, 3: azul (sobre blanco)
      g.fillStyle = [`rgba(243,244,248,${alpha})`, `rgba(77,124,255,${alpha})`, `rgba(10,10,14,${alpha})`, `rgba(47,91,232,${alpha})`][pass];
      g.beginPath();
      for (let i = 0; i < N; i++) {
        const k = easeOut(clamp(conv * 1.35 - pDelay[i]));
        const ang = (1 - k) * 2.2 + clock * 0.05 * (1 - k), ca = Math.cos(ang), sa = Math.sin(ang);
        const sx = (pS[i * 2] * ca - pS[i * 2 + 1] * sa) * R, sy = (pS[i * 2] * sa + pS[i * 2 + 1] * ca) * R;
        let x = lerp(sx, pL[i * 2] * logoScale, k) + Math.sin(clock * 0.7 + pPhase[i]) * (1 - k) * 14;
        let y = lerp(sy, pL[i * 2 + 1] * logoScale, k) + Math.cos(clock * 0.5 + pPhase[i]) * (1 - k) * 14 + Math.sin(clock * 1.8 + pPhase[i]) * k * 0.6;
        if (burst > 0) { const b = easeIn(clamp(burst * 1.3 - pDelay[i])); x = lerp(x, pE[i * 2] * logoScale, b); y = lerp(y, pE[i * 2 + 1] * logoScale, b); }
        x += cx; y += cy;
        const light = x < sweepX, want = (light ? 2 : 0) + (pBlue[i] ? 1 : 0);
        if (want === pass) g.rect(x - sz / 2, y - sz / 2, sz, sz);
      }
      g.fill();
    }
  }

  function rr(x: number, y: number, w: number, h: number, r: number) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function chip(x: number, y: number, text: string, o: { a?: number; px?: number; sc?: number; w?: number; fill?: string | null; stroke?: string; col?: string; dot?: string } = {}) {
    const a = o.a == null ? 1 : o.a, px = (o.px || 14) * UI * (o.sc == null ? 1 : o.sc);
    if (a <= 0.01 || px < 2) return 0;
    g.save(); g.globalAlpha = a;
    g.font = `${o.w || 500} ${px}px ${FUENTE}`;
    const tw = g.measureText(text).width, padX = px * 0.85, h = px * 2.15, dotW = o.dot ? px * 1.1 : 0, w = tw + padX * 2 + dotW;
    if (o.fill !== null) {
      rr(x - w / 2, y - h / 2, w, h, h / 2);
      g.shadowColor = 'rgba(20,30,80,.14)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
      g.fillStyle = o.fill || '#fff'; g.fill();
      g.shadowColor = 'transparent';
      g.strokeStyle = o.stroke || 'rgba(10,10,14,.16)'; g.lineWidth = 1; g.stroke();
    }
    if (o.dot) { g.fillStyle = o.dot; g.beginPath(); g.arc(x - w / 2 + padX + px * 0.25, y, px * 0.32, 0, TAU); g.fill(); }
    g.fillStyle = o.col || INK; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(text, x - w / 2 + padX + dotW, y + px * 0.06);
    g.restore();
    return w;
  }
  function docCard(x: number, y: number, title: string, tag: string, sc: number, a: number) {
    if (a <= 0.01 || sc < 0.05) return;
    const k = UI * sc, w = 172 * k, h = 56 * k;
    g.save(); g.globalAlpha = a;
    rr(x - w / 2, y - h / 2, w, h, 14 * k);
    g.shadowColor = 'rgba(20,30,80,.16)'; g.shadowBlur = 22; g.shadowOffsetY = 8; g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(10,10,14,.14)'; g.lineWidth = 1; g.stroke();
    const ix = x - w / 2 + 12 * k, iy = y - 16 * k;
    rr(ix, iy, 26 * k, 32 * k, 5 * k); g.fillStyle = 'rgba(47,91,232,.1)'; g.fill();
    g.strokeStyle = BLUE; g.lineWidth = 1.4 * k; g.beginPath();
    for (let i = 0; i < 3; i++) { g.moveTo(ix + 6 * k, iy + (10 + i * 6.5) * k); g.lineTo(ix + (i === 2 ? 15 : 20) * k, iy + (10 + i * 6.5) * k); } g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = INK; g.font = `600 ${13 * k}px ${FUENTE}`;
    g.fillText(title, ix + 36 * k, y - 7 * k);
    g.fillStyle = '#9a9eb2'; g.font = `600 ${9 * k}px ${FUENTE}`; g.fillText(tag.toUpperCase(), ix + 36 * k, y + 10 * k);
    g.restore();
  }
  function strokeRing(R: Ring, col: string, lw: number, a: number) {
    g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
    let started = false;
    for (let i = 0; i <= 120; i++) { const p = P(ringPt(R, (i / 120) * TAU)); if (!p) { started = false; continue; } if (started) g.lineTo(p.x, p.y); else { g.moveTo(p.x, p.y); started = true; } }
    g.stroke(); g.restore();
  }

  function drawSystem(a: number, o: { net: number; act: number; arc: number; pulse: number; ring2: number }, clock: number): Pt | null {
    if (a <= 0.01) return null;
    const c = P([0, 0, 0]); if (!c) return null;
    const lw = clamp(c.s * 0.11, 1.4, 3);
    DECOR.forEach((R) => strokeRing(R, 'rgba(47,91,232,.13)', 1.2, a));
    if (o.ring2) strokeRing(RING2R(), 'rgba(10,10,14,.12)', 1, a * o.ring2);
    // red interna (el "modelo")
    if (o.net > 0.01) {
      const rot = clock * 0.35, cr = Math.cos(rot), sr = Math.sin(rot);
      const pp = NET.pts.map((p) => P([p[0] * cr - p[2] * sr, p[1], p[0] * sr + p[2] * cr]));
      g.save(); g.lineWidth = 1;
      NET.ed.forEach(([i, j], e) => {
        const pi = pp[i], pj = pp[j];
        if (!pi || !pj) return;
        const hot = o.act > 0 ? Math.max(0, Math.sin(clock * 5 + e * 1.7)) * o.act : 0;
        g.globalAlpha = a * o.net * (0.16 + hot * 0.7); g.strokeStyle = hot > 0.25 ? BLUE : INK;
        g.beginPath(); g.moveTo(pi.x, pi.y); g.lineTo(pj.x, pj.y); g.stroke();
      });
      pp.forEach((p, i) => { if (!p) return; const hot = o.act > 0 ? Math.max(0, Math.sin(clock * 4 + i * 2.1)) * o.act : 0; g.globalAlpha = a * o.net * (0.5 + hot * 0.5); g.fillStyle = hot > 0.4 ? BLUE : INK; g.beginPath(); g.arc(p.x, p.y, Math.max(1.4, c.s * 0.085) * (1 + hot * 0.6), 0, TAU); g.fill(); });
      g.restore();
    }
    // núcleo + órbita + satélite (el logo, en 3D)
    g.save(); g.globalAlpha = a; g.strokeStyle = INK; g.lineWidth = lw;
    g.beginPath(); g.arc(c.x, c.y, CORE_R * c.s, 0, TAU); g.stroke(); g.restore();
    strokeRing(MAIN, INK, lw, a);
    const sp = P(ringPt(MAIN, clock * 0.25 + 5.5));
    if (sp) { g.save(); g.globalAlpha = a; g.fillStyle = BLUE_HI; g.beginPath(); g.arc(sp.x, sp.y, Math.min(sp.s * 0.42, 9), 0, TAU); g.fill(); g.restore(); }
    if (o.arc > 0.001) {
      g.save(); g.globalAlpha = a; g.strokeStyle = BLUE; g.lineWidth = lw * 1.6; g.lineCap = 'round';
      g.beginPath(); g.arc(c.x, c.y, (CORE_R + 0.75) * c.s, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, o.arc)); g.stroke();
      g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `300 ${c.s * 1.5}px ${FUENTE}`;
      g.fillText(Math.round(o.arc * 100) + '%', c.x, c.y + c.s * 0.08); g.restore();
    }
    if (o.pulse > 0.001) { g.save(); g.globalAlpha = a * (1 - o.pulse) * 0.8; g.strokeStyle = BLUE; g.lineWidth = 2; g.beginPath(); g.arc(c.x, c.y, (CORE_R + o.pulse * 5) * c.s, 0, TAU); g.stroke(); g.restore(); }
    return c;
  }

  function draw() {
    const s = engine.scene, t = engine.t, clock = engine.clock, started = engine.started;
    /* cámara */
    const target = camFor(s, t);
    if (engine.requestBlend) { engine.requestBlend = false; blend = { pos: [...cam.pos], tgt: [...cam.tgt] }; }
    const bk = blend ? ease(seg(t, 0, 1.5)) : 1; if (blend && bk >= 1) blend = null;
    cam.pos = blend ? mix3(blend.pos, target.pos, bk) : target.pos;
    cam.tgt = blend ? mix3(blend.tgt, target.tgt, bk) : target.tgt;
    const m = aspect < 1.3 ? Math.pow(1.3 / aspect, 0.82) : 1, hand = reduceMotion ? 0.2 : 1;
    cam.epos = [cam.tgt[0] + (cam.pos[0] - cam.tgt[0]) * m + Math.sin(clock * 0.47) * 0.25 * hand, cam.tgt[1] + (cam.pos[1] - cam.tgt[1]) * m + Math.sin(clock * 0.31 + 1) * 0.18 * hand, cam.tgt[2] + (cam.pos[2] - cam.tgt[2]) * m];
    cam.f = norm3(sub3(cam.tgt, cam.epos)); cam.r = norm3(cross3(cam.f, [0, 1, 0])); cam.u = cross3(cam.r, cam.f);
    cam.focal = (H / 2) / Math.tan(cam.fov * D2R / 2);
    // Escenas con texto: en escritorio la animación va a la derecha de la columna; en angosto, en el hueco entre la barra y el texto.
    // En el cierre, el logo va en el hueco de arriba del bloque final, achicado para que no pise nada.
    const conTexto = started && ((s >= 1 && s <= 4) || (s === 0 && t > 6.4));
    const cierre = started && s === 5 && t > 11;
    let cx = conTexto && !narrow ? W * 0.66 : W / 2, cy = narrow ? H * 0.4 : H * 0.48, zoom = 1;
    if (cierre || (narrow && conTexto)) {
      if (cuadro++ % 12 === 0) medirHueco(cierre);
      const unidad = cam.focal / Math.max(1, dot3(sub3(cam.tgt, cam.epos), cam.f));
      const alto = cierre ? 5 : s === 1 || s === 4 ? 9.5 : 6.5, ancho = cierre ? 8.6 : 9.2;
      cy = (hueco.top + hueco.bottom) / 2;
      zoom = clamp(Math.min((hueco.bottom - hueco.top) / 2 / (alto * unidad), (W * 0.46) / (ancho * unidad)), 0.12, cierre ? 1 : 1.15);
    } else cuadro = 0;
    const suave = cam.cx === 0 || reduceMotion ? 1 : 0.06;
    cam.cx += (cx - cam.cx) * suave; cam.cy += (cy - cam.cy) * suave; cam.zoom += (zoom - cam.zoom) * suave;
    cam.focal *= cam.zoom;
    anchors = {};

    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    /* fondo: negro en la intro, la línea de luz revela el blanco */
    let sweepX = W + 10;
    if (!started || (s === 0 && t < 5)) sweepX = -10;
    else if (s === 0 && t < 6.6) sweepX = (-0.06 + ease(seg(t, 5, 6.6)) * 1.12) * W;
    g.fillStyle = '#fcfcfe'; g.fillRect(0, 0, W, H);
    if (sweepX < W) { g.fillStyle = '#050507'; g.fillRect(Math.max(0, sweepX), 0, W - Math.max(0, sweepX), H); }

    /* sistema orbital */
    let sysA = 1; const o = { net: 0, act: 0, arc: 0, pulse: 0, ring2: 0 };
    if (!started) sysA = 0;
    else if (s === 0) sysA = seg(t, 6.9, 8.3);
    else if (s === 1) { o.net = seg(t, 4.6, 5.6) * (1 - seg(t, 12.8, 13.8)); o.act = seg(t, 5.4, 6) * (1 - seg(t, 11.9, 12.5)); }
    else if (s === 2) { o.ring2 = seg(t, 0.2, 1); let pr = 0; DOCS.forEach((d, i) => { pr += ease(seg(t, DOC_T(i), DOC_T(i) + 0.9)); }); o.arc = pr / DOCS.length; o.pulse = t > 9.3 ? seg(t, 9.3, 10.4) % 1 : 0; }
    else if (s === 3) { sysA = 0.3; o.net = 0.6; o.act = (t > 2.6 && t < 3.8) || (t > 6.8 && t < 7.8) ? 1 : 0.15; }
    else if (s === 4) { o.ring2 = seg(t, 0.2, 1); o.net = 0.5; o.act = 0.35; o.pulse = t > 6.5 && t < 7.6 ? seg(t, 6.5, 7.6) : 0; }
    else if (s === 5) sysA = lerp(0.07, 1, ease(seg(t, 11, 12.6))) * (cierre ? clamp((hueco.bottom - hueco.top - 50) / 50) : 1);
    const c = drawSystem(sysA, o, clock);
    if (c) anchors.core = { x: c.x + CORE_R * c.s * 0.72, y: c.y - CORE_R * c.s * 0.72 };

    /* escena 2: cómo responde una IA */
    if (started && s === 1 && c) {
      // Flujo vertical: el mensaje entra arriba, pasa por el modelo y la respuesta sale abajo.
      const pIn = P(narrow ? [0, 8.6, 0] : [0, 7.4, 0]);
      if (pIn) {
        const inA = seg(t, 0.6, 1.2) * (1 - seg(t, 3, 3.4)), slide = (1 - easeOut(seg(t, 0.6, 1.6))) * -60;
        const w = chip(pIn.x + slide, pIn.y, '¿Tienen turno para corte mañana a la tarde?', { a: inA, fill: INK, col: '#fff', stroke: INK, px: 14 });
        if (inA > 0.5) anchors.msgIn = { x: pIn.x + w / 2 - 14, y: pIn.y - 14 * UI };
        TOK_IN.forEach((tok, i) => {
          const tl = 3 + i * 0.18, ta = 5.4 + i * 0.38; if (t < tl) return;
          const rp = P(ringPt(MAIN, i * TAU / TOK_IN.length + clock * 0.45)); if (!rp) return;
          const k = ease(seg(t, tl, tl + 1)), ab = ease(seg(t, ta, ta + 0.7));
          const x = lerp(lerp(pIn.x, rp.x, k), c.x, ab), y = lerp(lerp(pIn.y, rp.y, k), c.y, ab);
          chip(x, y, tok, { a: seg(t, tl, tl + 0.2) * (1 - ab), sc: (1 - ab * 0.7), px: 13, stroke: 'rgba(47,91,232,.5)', col: BLUE, w: 600 });
          if (i === 1 && t > 3.8 && ab < 0.1) anchors.token = { x: x - 20, y: y - 12 * UI };
        });
      }
      // respuesta: una palabra tras otra
      const px = 15 * UI; g.font = `500 ${px}px ${FUENTE}`;
      const ws = TOK_OUT.map((w) => g.measureText(w).width + px * 1.7), gap = 6 * UI, maxW = Math.min(narrow ? W - 40 : 330 * UI, W - 40);
      const rows: number[][] = [[]]; let rw = 0;
      ws.forEach((w, i) => { if (rw + w > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += w + gap; });
      const an = P([0, -6.8, 0]);
      if (an) {
        const rh = px * 2.15 + gap, tgt: XY[] = [], y0 = an.y - (rows.length - 1) * rh / 2; let bx0 = 1e9, bx1 = -1e9;
        rows.forEach((row, ri) => { const tot = row.reduce((s2, i) => s2 + ws[i] + gap, -gap); let x = an.x - tot / 2; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x + tot); row.forEach((i) => { tgt[i] = { x: x + ws[i] / 2, y: y0 + ri * rh }; x += ws[i] + gap; }); });
        const mg = ease(seg(t, 12.2, 12.9));
        if (mg > 0) { g.save(); g.globalAlpha = mg; rr(bx0 - 10, y0 - rh / 2 - 6, bx1 - bx0 + 20, rows.length * rh + 12, 22 * UI); g.shadowColor = 'rgba(47,91,232,.4)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = BLUE; g.fill(); g.restore(); }
        TOK_OUT.forEach((tok, i) => {
          const te = 8.4 + i * 0.4; if (t < te) return;
          const k = easeOut(seg(t, te, te + 0.7));
          chip(lerp(c.x, tgt[i].x, k), lerp(c.y, tgt[i].y, k), tok, { a: seg(t, te, te + 0.15), sc: 0.4 + 0.6 * k, px: 15, fill: mg > 0.5 ? null : '#fff', col: mg > 0.5 ? '#fff' : INK, stroke: `rgba(10,10,14,${0.16 * (1 - mg)})` });
        });
        if (mg > 0.9) anchors.reply = { x: bx1 + 4, y: y0 - rh / 2 };
      }
    }

    /* escena 3: aprende de tu negocio */
    if (started && s === 2 && c) {
      const R2 = RING2R(), items: { z: number; x: number; y: number; sc: number; a: number; d: string[] }[] = [];
      DOCS.forEach((d, i) => {
        const p = P(ringPt(R2, i * TAU / DOCS.length + clock * 0.3 + 0.6)); if (!p) return;
        const ab = ease(seg(t, DOC_T(i), DOC_T(i) + 0.9));
        items.push({ z: p.z, x: lerp(p.x, c.x, ab), y: lerp(p.y, c.y, ab), sc: clamp(p.s / c.s, 0.7, 1.25) * (1 - ab * 0.85), a: seg(t, 0.4 + i * 0.3, 1 + i * 0.3) * (1 - easeIn(ab)), d });
      });
      items.sort((a, b) => b.z - a.z).forEach((it) => docCard(it.x, it.y, it.d[0], it.d[1], it.sc, it.a));
    }

    /* escena 4: haz entre el teléfono y la IA */
    if (started && s === 3) {
      const base = root.getBoundingClientRect(), pr = $('phoneWrap').getBoundingClientRect();
      anchors.phone = { x: pr.right - base.left - 6, y: pr.top - base.top + pr.height * 0.3 };
    }
    $('phone').style.transform = narrow ? 'none' : `rotateY(${(-9 + Math.sin(clock * 0.6) * 3).toFixed(2)}deg) rotateX(${(2 + Math.sin(clock * 0.45)).toFixed(2)}deg)`;

    /* escena 5: canales y derivación */
    if (started && s === 4 && c) {
      const R2 = RING2R(), sats = CHANNELS.map((n, i) => P(ringPt(R2, i * TAU / 3 + clock * 0.22 + 0.4)));
      g.save(); g.fillStyle = BLUE;
      sats.forEach((p, j) => { if (!p || t < 1.4) return; const C = { x: (p.x + c.x) / 2, y: (p.y + c.y) / 2 - 50 }; for (let n = 0; n < 3; n++) { const u = (clock * 0.42 + j * 0.31 + n / 3) % 1, q = quad(p, c, C, u); g.globalAlpha = Math.sin(u * Math.PI) * 0.85 * seg(t, 1.4, 2.2); g.beginPath(); g.arc(q.x, q.y, 3.2, 0, TAU); g.fill(); } });
      g.restore();
      sats.forEach((p, j) => { if (p) chip(p.x, p.y, CHANNELS[j], { a: seg(t, 0.4 + j * 0.3, 1 + j * 0.3), sc: clamp(p.s / c.s, 0.8, 1.2), px: 14, w: 600, dot: BLUE }); });
      // un reclamo llega → la IA te pasa la charla
      const vos = P(narrow ? [0, 8.6, 0] : [0, 7.4, 0]);
      const s0 = sats[0];
      if (s0 && t > 5.6 && t < 6.7) { const u = ease(seg(t, 5.6, 6.6)), q = quad(s0, c, { x: (s0.x + c.x) / 2, y: (s0.y + c.y) / 2 - 50 }, u); chip(q.x, q.y, 'Reclamo', { px: 12, fill: INK, col: '#fff', stroke: INK, w: 600, a: 1 - seg(t, 6.5, 6.7) }); }
      if (vos && t > 6.6) {
        const k = ease(seg(t, 6.6, 7.5));
        g.save(); g.strokeStyle = INK; g.lineWidth = 1.5; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(c.x, c.y - CORE_R * c.s); g.lineTo(lerp(c.x, vos.x, k), lerp(c.y - CORE_R * c.s, vos.y, k)); g.stroke(); g.restore();
        const w = chip(vos.x, vos.y, 'Vos · seguís la charla', { a: seg(t, 7.3, 7.8), px: 14, fill: INK, col: '#fff', stroke: INK, w: 600, dot: BLUE_HI });
        if (t > 7.4) anchors.vos = { x: vos.x + w / 2 - 10, y: vos.y - 15 * UI };
      }
    }

    /* partículas del logo */
    if (!started) drawParticles(0, 0.55, -10, 0, clock);
    else if (s === 0 && t < 8.2) drawParticles(seg(t, 0.25, 3.6), 1 - seg(t, 6.9, 8.1), sweepX, seg(t, 6.7, 8.2), clock);
    /* línea de luz */
    if (started && s === 0 && t > 4.95 && t < 6.7) {
      const a = seg(t, 4.95, 5.1) * (1 - seg(t, 6.5, 6.7));
      g.save(); g.globalAlpha = a; g.shadowColor = BLUE_HI; g.shadowBlur = 40; g.fillStyle = '#fff'; g.fillRect(sweepX - 1.5, 0, 3, H);
      const gr = g.createLinearGradient(sweepX, 0, sweepX + 160, 0); gr.addColorStop(0, 'rgba(77,124,255,.35)'); gr.addColorStop(1, 'rgba(77,124,255,0)'); g.shadowBlur = 0; g.fillStyle = gr; g.fillRect(sweepX, 0, 160, H);
      g.restore();
    }
  }

  /* capa HUD */
  const audio = crearAudio();
  $('segs').innerHTML = ESCENAS.map((sc, i) => `<button class="seg" data-i="${i}" aria-label="Ir a ${sc.label}"><span class="barra"><span class="fill"></span></span><span class="lbl"><em>${sc.n}</em>${sc.label}</span></button>`).join('');
  const segEls = [...root.querySelectorAll<HTMLElement>('.seg')], fillEls = segEls.map((e) => e.querySelector<HTMLElement>('.fill')!);
  segEls.forEach((e) => e.addEventListener('click', () => engine.goTo(+e.dataset.i!)));
  $('msgs').innerHTML = MSGS.map((m) => `<div class="msg ${m.who}">${esc(m.text)}</div>`).join('') + '<div class="msg typing"><i></i><i></i><i></i></div>';
  const msgEls = [...$('msgs').querySelectorAll<HTMLElement>('.msg:not(.typing)')], typingEl = $('msgs').querySelector<HTMLElement>('.typing')!;
  $('flowRow').innerHTML = FLOW.map((n, i) => `${i ? '<div class="conn"><span></span></div>' : ''}<div class="node"><div class="node-icon">${i + 1}</div><b>${n[0]}</b><span>${n[1]}</span></div>`).join('');
  const nodeEls = [...root.querySelectorAll<HTMLElement>('.node')], connEls = [...root.querySelectorAll<HTMLElement>('.conn')];
  $('hTitle').innerHTML = TITULO_INICIAL;

  let sideScene = -1, sideBuilt = -1, sideTimer = 0, hCur: string | null = null, hTimer = 0, subCur: string | undefined, subTimer = 0;
  let playState: boolean | null = null;
  const calloutEls = new Map<string, HTMLElement>();

  function render() {
    const s = engine.snap, sc = s.scene, t = s.t, live = s.started;
    root.classList.toggle('dark', !live || (sc === 0 && t < 5.8));
    root.classList.toggle('paused', live && !s.playing);
    $('start').classList.toggle('on', !live);
    if (playState !== s.playing) { playState = s.playing; $('bPlay').innerHTML = s.playing ? ICON.pause : ICON.play; $('bPlay').setAttribute('aria-label', s.playing ? 'Pausar' : 'Reproducir'); }
    segEls.forEach((e, i) => { e.classList.toggle('on', live && i === sc); e.classList.toggle('done', live && i < sc); });
    $('introTag').classList.toggle('on', live && sc === 0 && t > 3.5 && t < 4.9);

    /* titular */
    const h = live ? headlineFor(s) : null, hl = $('headline'), id = h ? h.id : null;
    if (id !== hCur) {
      const wasOn = hl.classList.contains('on'); hCur = id; hl.classList.remove('on'); cancel(hTimer);
      if (h) hTimer = later(() => { $('hEyebrow').textContent = h.eyebrow; $('hTitle').innerHTML = h.title; $('hSub').textContent = h.sub || ''; $('hSub').style.display = h.sub ? '' : 'none'; subCur = h.subId; hl.classList.add('on'); }, wasOn ? 420 : 40);
    } else if (h && h.subId !== subCur) {
      subCur = h.subId; const el = $('hSub'); el.classList.add('swap'); cancel(subTimer);
      subTimer = later(() => { el.textContent = h.sub || ''; el.classList.remove('swap'); }, 260);
    }

    /* panel lateral */
    const want = live && SIDE[sc] ? sc : -1, sw = $('sideWrap');
    if (want !== sideScene) {
      sideScene = want; sw.classList.remove('on'); cancel(sideTimer);
      if (want > 0) sideTimer = later(() => {
        const d = SIDE[want];
        $('side').innerHTML = `<div class="side-head"><span>${d.title}</span><span class="caps">${d.tag}</span></div>` + (d.steps ? `<ol class="steps">${d.steps.map((x, i) => `<li><span class="num">${i + 1}</span><div><b>${x.l}</b><span>${x.d}</span><i></i></div></li>`).join('')}</ol>` : `<ul class="specs">${(d.specs || []).map((x) => `<li><span class="k">${x[0]}</span><span class="v">${x[1]}</span></li>`).join('')}</ul>`);
        sideBuilt = want; sw.classList.add('on'); render();
      }, 320);
    }
    if (sideBuilt === sc && SIDE[sc]) {
      const d = SIDE[sc], lis = $('side').querySelectorAll('li');
      if (d.steps) d.steps.forEach((x, i) => { const li = lis[i]; if (!li) return; const st = t >= x.b ? 'done' : t >= x.a ? 'on' : ''; li.className = st; li.querySelector('.num')!.textContent = st === 'done' ? '✓' : String(i + 1); li.querySelector('i')!.style.transform = `scaleX(${st ? (x.b > 50 ? 1 : clamp((t - x.a) / (x.b - x.a))) : 0})`; });
      else { let act = -1; if (sc === 2) DOCS.forEach((x, i) => { if (t >= DOC_T(i)) act = i; }); else CONTROL_T.forEach((x, i) => { if (t >= x) act = i; }); lis.forEach((li, i) => { li.className = i === act ? 'on' : i < act ? 'seen' : ''; }); }
    }

    /* llamadas */
    const list = live ? calloutsFor(s) : [], keep = new Set(list.map((c) => c.k));
    list.forEach((c) => {
      if (calloutEls.has(c.k)) return;
      const el = document.createElement('div'); el.className = 'callout ' + (c.side || ''); el.dataset.anchor = c.anchor;
      el.innerHTML = `<div class="callout-in"><span class="dot"></span><span class="leader"></span><div class="label"><b>${c.title}</b><span>${c.sub}</span></div></div>`;
      $('callouts').appendChild(el); calloutEls.set(c.k, el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
    });
    calloutEls.forEach((el, k) => { if (!keep.has(k)) { calloutEls.delete(k); el.classList.remove('on'); later(() => el.remove(), 450); } });

    /* teléfono */
    const demo = live && sc === 3;
    $('phoneWrap').classList.toggle('on', demo && t > 0.5);
    msgEls.forEach((e, i) => e.classList.toggle('on', demo && t >= MSGS[i].t));
    typingEl.classList.toggle('on', demo && TYPING.some(([a, b]) => t >= a && t < b));

    /* planes y cierre */
    const fin = live && sc === 5;
    $('flow').classList.toggle('on', fin && t > 0.7 && t < 6.2);
    nodeEls.forEach((e, i) => e.classList.toggle('on', fin && t >= 1.2 + i)); connEls.forEach((e, i) => e.classList.toggle('on', fin && t >= 2.2 + i));
    $('plansBlock').classList.toggle('on', fin && t > 6.5 && t < 11.4);
    root.querySelectorAll('.tarifa').forEach((e, i) => e.classList.toggle('on', fin && t >= 6.7 + i * 0.3));
    $('final').classList.toggle('on', fin && t > 12);
    $('final').classList.toggle('ended', s.ended);
  }
  function renderSound() {
    const on = audio.enabled;
    $('bSound').innerHTML = on ? ICON.on : ICON.off; $('bSound').classList.toggle('off', !on); $('bSound').setAttribute('aria-pressed', String(on));
    $('sSound').innerHTML = (on ? ICON.on : ICON.off) + `<span>${on ? 'Sonido suave · podés silenciarlo cuando quieras' : 'Sin sonido · tocá para activarlo'}</span>`; $('sSound').classList.toggle('on', on);
  }
  engine.subs.add(render); audio.subscribe(renderSound);

  function applyDom() {
    calloutEls.forEach((el) => { const p = anchors[el.dataset.anchor!]; if (p) { el.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`; el.style.visibility = 'visible'; } else el.style.visibility = 'hidden'; });
    fillEls.forEach((f, i) => { f.style.transform = `scaleX(${!engine.started ? 0 : i < engine.scene ? 1 : i === engine.scene ? engine.t / ESCENAS[i].dur : 0})`; });
    const txt = `${fmt(engine.started ? engine.elapsed() : 0)} / ${fmt(TOTAL)}`; if ($('tc').textContent !== txt) $('tc').textContent = txt;
  }

  /* controles */
  const on = (id: string, fn: () => void) => $(id).addEventListener('click', fn);
  on('bStart', () => engine.goTo(0)); on('sIA', () => engine.goTo(1)); on('sChat', () => engine.goTo(3));
  on('bPrev', () => engine.prev()); on('bNext', () => engine.next()); on('bPlay', () => engine.toggle()); on('replay', () => engine.goTo(0));
  on('bSound', () => audio.toggle()); on('sSound', () => audio.toggle());
  /** Los atajos solo aplican mientras la presentación ocupa la mayor parte de la pantalla. */
  const enVista = () => { const r = root.getBoundingClientRect(); return r.bottom > r.height * 0.5; };
  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (e.ctrlKey || e.metaKey || e.altKey || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !enVista()) return;
    if (e.code === 'Space') { if (tag === 'BUTTON' || tag === 'A') return; e.preventDefault(); engine.toggle(); }
    else if (e.key === 'ArrowRight') engine.next(); else if (e.key === 'ArrowLeft') engine.prev();
    else if (e.key === 'r' || e.key === 'R') engine.goTo(0); else if (e.key === 'i' || e.key === 'I') engine.goTo(1);
    else if (e.key === 'd' || e.key === 'D') engine.goTo(3); else if (e.key === 'm' || e.key === 'M') audio.toggle();
  };
  // iOS solo habilita el audio en touchend o click (no en pointerdown/touchstart).
  const GESTOS = ['touchend', 'click', 'keydown'] as const;
  const unlock = () => audio.unlock();
  window.addEventListener('keydown', onKey);
  GESTOS.forEach((ev) => window.addEventListener(ev, unlock, true));
  window.addEventListener('resize', resize);

  /* bucle */
  let vivo = true;
  resize(); engine.emit(); renderSound();
  if (lienzo && document.fonts && document.fonts.load) document.fonts.load(`300 120px ${FUENTE}`).then(() => { if (vivo) buildLogo(); }).catch(() => {});
  let last = performance.now(), logged = false, frame = 0;
  const loop = (nowT: number) => {
    const dt = Math.min(0.05, Math.max(0, ((nowT || last) - last) / 1000)); last = nowT || last;
    const visible = enVista();
    if (!visible) engine.pause();
    engine.tick(dt);
    try { audio.update(engine); } catch { /* el sonido nunca frena la escena */ }
    if (lienzo && visible) { try { draw(); } catch (e) { if (!logged) { console.error('[órbita] render:', e); logged = true; } } }
    applyDom();
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);

  return {
    irA(destino) {
      const d = DESTINOS[destino];
      if (!d) return;
      if (root.getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      engine.goTo(d[0], true, d[1]);
    },
    refrescar() { render(); },
    desmontar() {
      vivo = false;
      cancelAnimationFrame(frame);
      timers.forEach((id) => window.clearTimeout(id)); timers.clear();
      window.removeEventListener('keydown', onKey);
      GESTOS.forEach((ev) => window.removeEventListener(ev, unlock, true));
      window.removeEventListener('resize', resize);
      engine.subs.clear();
      audio.cerrar();
      calloutEls.forEach((el) => el.remove()); calloutEls.clear();
    },
  };
}
