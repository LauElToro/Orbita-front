import { useEffect, useState, type ReactNode } from 'react';
import { beneficiosDe } from '../components/Planes';
import { ErrorMsg } from '../components/ui';
import type { Cuenta, Requisitos } from '../types';
import { CanalesForm, GuiaManychat, ManychatForm, PerfilForm, Simulador, TextosForm } from './formularios';
import { useAccionCuenta } from './useCuenta';

type PasoId =
  | 'bienvenida'
  | 'equipo'
  | 'negocio'
  | 'turnos'
  | 'estilo'
  | 'manychat'
  | 'canales'
  | 'textos'
  | 'recordatorios'
  | 'probar'
  | 'activar';

interface Paso {
  id: PasoId;
  titulo: string;
  intro: string;
}

const PASOS: Record<PasoId, Paso> = {
  bienvenida: { id: 'bienvenida', titulo: 'Bienvenida', intro: '' },
  equipo: {
    id: 'equipo',
    titulo: 'Tu equipo de Orbita',
    intro: 'Tu plan es a medida: además de este tutorial, el equipo de Orbita revisa tu configuración y las integraciones acordadas.',
  },
  negocio: {
    id: 'negocio',
    titulo: 'Tu negocio',
    intro: 'Contale a tu IA lo básico. Con esto arma las respuestas, así que cuanto más claro, mejor.',
  },
  turnos: {
    id: 'turnos',
    titulo: 'Turnos',
    intro: 'Tu IA va a agendar y cancelar turnos sola. Decile qué se reserva, cuándo y con cuánta anticipación.',
  },
  estilo: {
    id: 'estilo',
    titulo: 'Estilo y preguntas',
    intro: 'Elegí cómo habla tu IA, cuándo te pasa la charla y cargá las preguntas que más te hacen.',
  },
  manychat: {
    id: 'manychat',
    titulo: 'Conectar ManyChat',
    intro: 'Tu IA responde a través de tu cuenta de ManyChat. Primero pegá tus datos y después armá el flujo siguiendo la guía.',
  },
  canales: {
    id: 'canales',
    titulo: 'Canales',
    intro: 'Indicá por qué canales te escriben. Tu IA solo responde en los canales que cargues acá.',
  },
  textos: {
    id: 'textos',
    titulo: 'Mensajes fijos',
    intro: 'Hay momentos en que no responde la IA sino un texto que vos definís. Revisalos y ajustalos a tu estilo.',
  },
  recordatorios: {
    id: 'recordatorios',
    titulo: 'Recordatorios',
    intro: 'Tu plan Completo envía un recordatorio automático a cada cliente el día anterior a su turno, para que no falten.',
  },
  probar: {
    id: 'probar',
    titulo: 'Probá tu IA',
    intro: 'Chateá con tu IA como si fueras un cliente. Si algo no te convence, volvé a los pasos anteriores y ajustalo.',
  },
  activar: { id: 'activar', titulo: 'Activar', intro: 'Último paso. Revisá que esté todo listo y prendé tu IA.' },
};

export function pasosDe(cuenta: Cuenta): Paso[] {
  const m = cuenta.negocio.modulos;
  const ids: (PasoId | false)[] = [
    'bienvenida',
    cuenta.plan.id === 'personalizado' && 'equipo',
    'negocio',
    m.includes('turnos') && 'turnos',
    'estilo',
    'manychat',
    'canales',
    'textos',
    m.includes('recordatorios') && 'recordatorios',
    'probar',
    'activar',
  ];
  return ids.filter((id): id is PasoId => Boolean(id)).map((id) => PASOS[id]);
}

const REQUISITOS: { key: keyof Requisitos; label: string; paso: PasoId }[] = [
  { key: 'pago', label: 'Pago del plan acreditado', paso: 'bienvenida' },
  { key: 'prompt', label: 'Información de tu negocio', paso: 'negocio' },
  { key: 'manychat', label: 'ManyChat conectado', paso: 'manychat' },
  { key: 'canal', label: 'Al menos un canal cargado', paso: 'canales' },
];

export function Tutorial({ cuenta: cuentaActual }: { cuenta: Cuenta }) {
  const [guardada, setGuardada] = useState<Cuenta | null>(null);
  useEffect(() => setGuardada(null), [cuentaActual]);
  const cuenta = guardada ?? cuentaActual;
  const pasos = pasosDe(cuenta);
  const maximo = Math.min(cuenta.onboarding.paso, pasos.length - 1);
  const [actual, setActual] = useState(maximo);
  const progreso = useAccionCuenta();
  const completar = useAccionCuenta();
  const paso = pasos[actual];

  const ir = (i: number) => {
    setActual(i);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
    if (i > cuenta.onboarding.paso) progreso.mutate({ path: 'onboarding', body: { paso: i } });
  };
  const siguiente = () => ir(Math.min(actual + 1, pasos.length - 1));
  /** El paso siguiente se monta con la cuenta recién guardada, sin esperar a que se actualice la caché. */
  const guardarYSeguir = (c: Cuenta) => {
    setGuardada(c);
    siguiente();
  };
  const irA = (id: PasoId) => {
    const i = pasos.findIndex((p) => p.id === id);
    if (i >= 0) ir(i);
  };

  const contenido: Record<PasoId, ReactNode> = {
    bienvenida: (
      <>
        <p>
          ¡Hola {cuenta.usuario?.nombre.split(' ')[0] ?? ''}! Ya está acreditado tu plan <strong>{cuenta.plan.nombre}</strong>. Incluye:
        </p>
        <ul className="lista-check">
          {beneficiosDe(cuenta.plan).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p>En los próximos {pasos.length - 1} pasos vas a dejar tu IA funcionando:</p>
        <ol className="lista-pasos">
          {pasos.slice(1).map((p) => (
            <li key={p.id}>{p.titulo}</li>
          ))}
        </ol>
        <p className="small muted">Tu progreso se guarda solo. Podés dejarlo y seguir más tarde.</p>
        <button onClick={siguiente}>Empezar</button>
      </>
    ),
    equipo: (
      <>
        <ul className="lista-check">
          <li>Completá los datos de tu negocio y conectá ManyChat como en cualquier plan.</li>
          <li>Las integraciones a medida (stock, catálogo, sistemas propios) las configura el equipo según tu propuesta.</li>
          <li>Los cambios de plan o de alcance se coordinan con el equipo, no desde el panel.</li>
        </ul>
        <button onClick={siguiente}>Entendido</button>
      </>
    ),
    negocio: <PerfilForm cuenta={cuenta} secciones={['negocio']} boton="Guardar y seguir" onGuardado={guardarYSeguir} />,
    turnos: <PerfilForm cuenta={cuenta} secciones={['turnos']} boton="Guardar y seguir" onGuardado={guardarYSeguir} />,
    estilo: <PerfilForm cuenta={cuenta} secciones={['estilo']} boton="Guardar y seguir" onGuardado={guardarYSeguir} />,
    manychat: (
      <>
        <ManychatForm cuenta={cuenta} boton="Guardar datos de ManyChat" />
        <h3>Armá el flujo en ManyChat</h3>
        <GuiaManychat cuenta={cuenta} />
        <button onClick={siguiente} disabled={!cuenta.onboarding.requisitos.manychat}>
          Ya armé el flujo, seguir
        </button>
      </>
    ),
    canales: <CanalesForm cuenta={cuenta} boton="Guardar y seguir" onGuardado={guardarYSeguir} />,
    textos: <TextosForm cuenta={cuenta} campos={['espera', 'tope', 'handoff']} boton="Guardar y seguir" onGuardado={guardarYSeguir} />,
    recordatorios: (
      <>
        <p className="small">
          Se envía por el mismo canal donde se reservó el turno. Si el cliente responde, tu IA puede confirmarlo o cancelarlo.
        </p>
        <TextosForm cuenta={cuenta} campos={['recordatorio']} boton="Guardar y seguir" onGuardado={guardarYSeguir} />
      </>
    ),
    probar: (
      <>
        <Simulador cuenta={cuenta} />
        <button onClick={siguiente}>Me gusta cómo responde, seguir</button>
      </>
    ),
    activar: (
      <>
        <ul className="checklist">
          {REQUISITOS.map((r) => {
            const ok = cuenta.onboarding.requisitos[r.key];
            return (
              <li key={r.key} className={ok ? 'ok' : 'falta'}>
                <span>{ok ? '✓' : '•'}</span> {r.label}
                {!ok && r.paso !== 'bienvenida' && (
                  <button type="button" className="link" onClick={() => irA(r.paso)}>
                    Completar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <ErrorMsg error={completar.error} />
        <button
          className="button-lg"
          onClick={() => completar.mutate({ path: 'onboarding/completar' })}
          disabled={completar.isPending || !Object.values(cuenta.onboarding.requisitos).every(Boolean)}
        >
          {completar.isPending ? 'Activando...' : 'Activar mi IA'}
        </button>
      </>
    ),
  };

  return (
    <div className="tutorial">
      <aside className="tutorial-pasos">
        <p className="small muted">
          Paso {actual + 1} de {pasos.length}
        </p>
        <div className="bar" role="progressbar" aria-label="Progreso del tutorial" aria-valuenow={Math.round(((actual + 1) / pasos.length) * 100)}>
          <div className="bar-fill bar-ok" style={{ width: `${((actual + 1) / pasos.length) * 100}%` }} />
        </div>
        <ol>
          {pasos.map((p, i) => (
            <li key={p.id} className={i === actual ? 'actual' : i < Math.max(maximo, actual) ? 'hecho' : ''}>
              <button type="button" className="link" disabled={i > Math.max(maximo, actual)} onClick={() => ir(i)}>
                {p.titulo}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <section className="card tutorial-paso" key={paso.id}>
        <h1>{paso.titulo}</h1>
        {paso.intro && <p className="muted">{paso.intro}</p>}
        {contenido[paso.id]}
        {actual > 0 && (
          <button type="button" className="link volver" onClick={() => setActual(actual - 1)}>
            ← Volver
          </button>
        )}
      </section>
    </div>
  );
}
