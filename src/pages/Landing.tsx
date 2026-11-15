import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PlanCard } from '../components/Planes';
import { PaginaSitio } from '../components/Sitio';
import type { MedioPago, Plan } from '../types';

const BENEFICIOS = [
  { titulo: 'Responde en segundos', texto: 'Precios, horarios, envíos y medios de pago, a cualquier hora y sin dejar a nadie en visto.' },
  { titulo: 'Agenda turnos sola', texto: 'Toma, confirma y cancela turnos dentro de tus horarios, y avisa un día antes para que no falten.' },
  { titulo: 'Sabe cuándo pasarte la charla', texto: 'Si alguien pide hablar con una persona o hay un reclamo, te deriva la conversación al instante.' },
  { titulo: 'Vos tenés el control', texto: 'Probala antes de activarla, pausala cuando quieras y mirá cuántos mensajes respondió.' },
];

const PASOS = [
  { titulo: 'Elegís tu plan', texto: 'Te registrás en dos minutos y pagás con Mercado Pago o transferencia.' },
  { titulo: 'Le contás de tu negocio', texto: 'Un tutorial guiado te pregunta lo que tu IA necesita saber. Sin escribir prompts.' },
  { titulo: 'Conectás ManyChat', texto: 'Te mostramos paso a paso dónde pegar cada dato. Funciona con WhatsApp, Instagram y Telegram.' },
  { titulo: 'Probás y activás', texto: 'Chateás con tu IA en el simulador y, cuando te convence, la activás con un clic.' },
];

const CONFIANZA = [
  { titulo: 'Sin permanencia', texto: 'Abono mensual. Cambiás de plan o das de baja cuando quieras.' },
  { titulo: '10 días para arrepentirte', texto: 'Si no es lo que esperabas, revocás la contratación desde el botón de arrepentimiento.' },
  { titulo: 'Datos protegidos', texto: 'Credenciales cifradas, contraseñas con hash y tratamiento según la Ley 25.326.' },
  { titulo: 'Pagos seguros', texto: 'Cobramos con Mercado Pago o transferencia. Nunca vemos los datos de tu tarjeta.' },
];

const PREGUNTAS = [
  {
    p: '¿Necesito saber de programación o de inteligencia artificial?',
    r: 'No. El tutorial te hace preguntas simples sobre tu negocio y con eso armamos las instrucciones de tu IA. Si querés, después podés ajustarlas a mano.',
  },
  {
    p: '¿Qué necesito para conectarla?',
    r: 'Una cuenta de ManyChat con tu WhatsApp, Instagram o Telegram conectado. En el tutorial te mostramos exactamente qué configurar.',
  },
  {
    p: '¿Qué pasa si la IA no sabe algo?',
    r: 'Responde solo con la información que cargaste y, si no sabe o el cliente lo pide, te pasa la conversación para que sigas vos.',
  },
  {
    p: '¿Qué pasa si llego al tope de mensajes?',
    r: 'Tu IA envía un mensaje fijo que vos definís y deja de usar IA hasta que se renueva el período. Podés subir de plan en cualquier momento.',
  },
  {
    p: '¿Puedo cancelar?',
    r: 'Sí, cuando quieras y sin penalidades. Además, tenés 10 días desde la contratación para arrepentirte y pedir el reintegro.',
  },
  {
    p: '¿Hacen soluciones a medida?',
    r: 'Sí. Con el plan Personalizado integramos tu sistema de stock, catálogo o lo que necesites, con abono mensual.',
  },
];

function ChatDemo() {
  return (
    <div className="demo" aria-label="Ejemplo de conversación">
      <div className="demo-head">
        <span className="demo-avatar">PL</span>
        <div>
          <strong>Peluquería Luna</strong>
          <span>en línea</span>
        </div>
      </div>
      <div className="demo-body">
        <p className="burbuja in">Hola! Tienen turno para corte mañana a la tarde?</p>
        <p className="burbuja out">¡Hola! 😊 Mañana tengo libre a las 16:00 y a las 17:30. ¿Cuál te queda mejor?</p>
        <p className="burbuja in">17:30 porfa, soy Sofi</p>
        <p className="burbuja out">Listo Sofi, te agendé mañana a las 17:30 para corte. Te escribo un rato antes para recordarte ✂️</p>
      </div>
    </div>
  );
}

export function Landing() {
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });
  const [medio, setMedio] = useState<MedioPago>('transferencia');

  return (
    <PaginaSitio>
      <section className="hero">
        <div className="hero-texto">
          <span className="eyebrow">Asistente con IA para comercios</span>
          <h1>Tu comercio responde al instante, las 24 horas.</h1>
          <p className="hero-sub">
            Orbita atiende a tus clientes por WhatsApp, Instagram y Telegram con la información de tu negocio: responde consultas, agenda
            turnos y te pasa la charla cuando hace falta.
          </p>
          <div className="actions">
            <Link to="/registro" className="button button-lg">
              Empezar ahora
            </Link>
            <a href="#planes" className="button button-lg button-ghost">
              Ver planes
            </a>
          </div>
          <p className="small hero-nota">Sin permanencia · 10 días para arrepentirte · Configuración guiada</p>
        </div>
        <ChatDemo />
      </section>

      <section className="canales-strip">
        <span>Se conecta mediante ManyChat con</span>
        <strong>WhatsApp</strong>
        <strong>Instagram</strong>
        <strong>Telegram</strong>
      </section>

      <section className="bloque">
        <h2 className="bloque-titulo">Todo lo que tu negocio necesita para no perder ventas</h2>
        <div className="grid-cards">
          {BENEFICIOS.map((b) => (
            <div className="feature" key={b.titulo}>
              <h3>{b.titulo}</h3>
              <p>{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bloque bloque-alt" id="como-funciona">
        <h2 className="bloque-titulo">Funcionando en una tarde</h2>
        <ol className="pasos">
          {PASOS.map((p, i) => (
            <li key={p.titulo}>
              <span className="paso-num">{i + 1}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bloque" id="planes">
        <h2 className="bloque-titulo">Planes claros, en pesos y sin sorpresas</h2>
        <div className="toggle" role="group" aria-label="Medio de pago">
          <button type="button" className={medio === 'transferencia' ? 'on' : ''} onClick={() => setMedio('transferencia')}>
            Transferencia
          </button>
          <button type="button" className={medio === 'mercadopago' ? 'on' : ''} onClick={() => setMedio('mercadopago')}>
            Mercado Pago
          </button>
        </div>
        {planes.isLoading && <p className="muted centrado">Cargando planes...</p>}
        <div className="planes">
          {planes.data?.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              medio={medio}
              accion={
                <Link to={`/registro?plan=${p.id}&medio=${medio}`} className="button">
                  Elegir {p.nombre}
                </Link>
              }
            />
          ))}
          <div className="plan plan-custom">
            <h3>Personalizado</h3>
            <p className="plan-precio">A medida</p>
            <p className="small muted">Abono mensual según alcance</p>
            <ul className="plan-lista">
              <li>Integraciones con tu sistema (stock, catálogo, CRM)</li>
              <li>Topes y canales a medida</li>
              <li>Acompañamiento del equipo de Orbita</li>
            </ul>
            <Link to="/contacto" className="button button-ghost-dark">
              Hablemos
            </Link>
          </div>
        </div>
        <p className="small muted centrado">Precios finales por mes. Podés cambiar de plan cuando quieras.</p>
      </section>

      <section className="bloque bloque-alt">
        <h2 className="bloque-titulo">Trabajamos con reglas claras</h2>
        <div className="grid-cards">
          {CONFIANZA.map((c) => (
            <div className="feature feature-check" key={c.titulo}>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bloque bloque-angosto" id="preguntas">
        <h2 className="bloque-titulo">Preguntas frecuentes</h2>
        {PREGUNTAS.map((q) => (
          <details className="faq" key={q.p}>
            <summary>{q.p}</summary>
            <p>{q.r}</p>
          </details>
        ))}
      </section>

      <section className="cta-final">
        <h2>Tu próxima venta puede llegar a las 3 de la mañana.</h2>
        <p>Que alguien la conteste.</p>
        <Link to="/registro" className="button button-lg">
          Crear mi cuenta
        </Link>
      </section>
    </PaginaSitio>
  );
}
