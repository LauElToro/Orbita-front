import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { sesionCliente } from '../api';
import { DESTACADO } from '../components/Planes';
import { pesos } from '../format';
import type { Plan } from '../types';
import { montarPresentacion, type Presentacion as Motor } from './escena';
import './landing.css';

export function Isotipo() {
  return (
    <svg className="isotipo" viewBox="0 0 120 82" aria-hidden="true">
      <g transform="translate(56,44)">
        <circle className="s" r="13" />
        <ellipse className="s" rx="42" ry="14.5" transform="rotate(-27)" />
        <circle className="d" cx="36.5" cy="-17" r="6.5" />
      </g>
    </svg>
  );
}

function detalleDe(plan: Plan): string {
  if (plan.modulos.includes('recordatorios')) return plan.modeloCapaz ? 'Recordatorios y un modelo de IA más capaz' : 'Recordatorios automáticos';
  if (plan.modulos.includes('turnos')) return 'Agenda y cancela turnos sola';
  return 'Preguntas frecuentes con la info de tu negocio';
}

export function Presentacion({ planes }: { planes: Plan[] | undefined }) {
  const raiz = useRef<HTMLElement>(null);
  const motor = useRef<Motor | null>(null);
  const { hash } = useLocation();
  const demo = sesionCliente.get() ? '/cuenta/demo' : '/registro';

  useEffect(() => {
    const m = montarPresentacion(raiz.current!);
    motor.current = m;
    return () => {
      m.desmontar();
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    if (hash) motor.current?.irA(hash.slice(1));
  }, [hash]);

  useEffect(() => {
    motor.current?.refrescar();
  }, [planes]);

  return (
    <section className="pres dark" ref={raiz} aria-label="Presentación de órbita">
      <canvas id="stage" aria-hidden="true" />

      <div className="callouts" id="callouts" />
      <div className="intro-tag caps" id="introTag">
        IA · Mensajería · Comercios
      </div>

      <div className="headline" id="headline" aria-live="polite">
        <div className="volanta caps" id="hEyebrow" />
        <h1 className="title" id="hTitle" />
        <p className="sub" id="hSub" />
      </div>

      <div className="side-wrap" id="sideWrap">
        <aside className="side panel" id="side" />
      </div>

      <div className="phone-wrap" id="phoneWrap" aria-hidden="true">
        <div className="phone" id="phone">
          <div className="screen">
            <div className="tel-head">
              <div className="tel-avatar">PL</div>
              <div>
                <b>Peluquería Luna</b>
                <span>en línea</span>
              </div>
              <em>Ejemplo</em>
            </div>
            <div className="msgs" id="msgs" />
          </div>
        </div>
      </div>

      <div className="block" id="flow">
        <div className="volanta center caps">06 · Funcionando en una tarde</div>
        <div className="flow-row" id="flowRow" />
      </div>
      <div className="block tarifas-bloque" id="plansBlock">
        <div className="volanta center caps">Planes claros, en pesos y sin sorpresas</div>
        <div className="tarifas">
          {planes?.map((p) => (
            <Link key={p.id} to={`/registro?plan=${p.id}`} className={`tarifa${p.id === DESTACADO ? ' top' : ''}`} aria-label={`Elegir ${p.nombre}`}>
              {p.id === DESTACADO && <span className="tag">El más elegido</span>}
              <h3>{p.nombre}</h3>
              <div className="price">
                {pesos(p.precioMercadoPago)}
                <small>/mes</small>
              </div>
              <p>
                <b>
                  {p.topeMes.toLocaleString('es-AR')} respuestas · {p.maxCanales} {p.maxCanales === 1 ? 'canal' : 'canales'}
                </b>
                <br />
                {detalleDe(p)}
              </p>
            </Link>
          ))}
          <Link to="/contacto" className="tarifa" aria-label="Hablemos de un plan personalizado">
            <h3>Personalizado</h3>
            <div className="price">A medida</div>
            <p>
              <b>Abono según alcance</b>
              <br />
              Integraciones con stock, catálogo o CRM
            </p>
          </Link>
        </div>
        <div className="foot">Precios finales por mes · Se paga con Mercado Pago · Sin permanencia · 10 días para arrepentirte</div>
      </div>
      <div className="block final" id="final">
        <span className="wm">órbita</span>
        <h2>Tu próxima venta puede llegar a las 3 de la mañana.</h2>
        <p>Que alguien la conteste.</p>
        <div className="contact">
          <Link to={demo} className="demo-cta">
            <svg className="i f" viewBox="0 0 24 24">
              <path d="M8 5.6v12.8L18.5 12z" />
            </svg>
            <span>Probá la demo gratis</span>
          </Link>
          <a href="https://orbita-ai.duckdns.org/" target="_blank" rel="noopener noreferrer">
            <svg className="i" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5S9.6 6.1 12 3.5z" />
            </svg>
            <span>orbita-ai.duckdns.org</span>
          </a>
          <a href="https://www.instagram.com/orbita.emp/" target="_blank" rel="noopener noreferrer">
            <svg className="i" viewBox="0 0 24 24">
              <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span>@orbita.emp</span>
          </a>
        </div>
        <button type="button" className="btn ghost replay" id="replay">
          Ver de nuevo
        </button>
      </div>

      <header className="topbar">
        <div className="marca">
          <Isotipo />
          <span className="wm">órbita</span>
          <span className="marca-sub">Asistente con IA para comercios</span>
        </div>
        <div className="topbar-der">
          <div className="meta caps">
            <span className="rec" id="rec" data-on="0" />
            <span className="lbl" id="metaLbl">
              Listo
            </span>
            <span className="tc" id="tc">
              00:00
            </span>
          </div>
          <nav className="nav" aria-label="Principal">
            <button type="button" className="nav-sec" onClick={() => motor.current?.irA('como-funciona')}>
              Cómo funciona
            </button>
            <button type="button" className="nav-sec" onClick={() => motor.current?.irA('planes')}>
              Planes
            </button>
            <Link to="/contacto" className="nav-sec">
              Contacto
            </Link>
            <Link to="/ingresar">Ingresar</Link>
            <Link to="/registro" className="nav-cta">
              Empezar
            </Link>
          </nav>
        </div>
      </header>

      <nav className="dock panel" aria-label="Controles de la presentación">
        <div className="ctrls">
          <button type="button" className="ib" id="bRestart" aria-label="Reiniciar" title="Reiniciar (R)">
            <svg className="i" viewBox="0 0 24 24">
              <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
              <path d="M4.5 4.5v4h4" />
            </svg>
          </button>
          <button type="button" className="ib" id="bPrev" aria-label="Escena anterior" title="Escena anterior (←)">
            <svg className="i f" viewBox="0 0 24 24">
              <path d="M17.5 6.2v11.6L9 12z" />
              <rect x="6" y="6" width="2" height="12" rx="1" />
            </svg>
          </button>
          <button type="button" className="ib play" id="bPlay" aria-label="Reproducir" title="Pausar / reproducir (espacio)" />
          <button type="button" className="ib" id="bNext" aria-label="Escena siguiente" title="Escena siguiente (→)">
            <svg className="i f" viewBox="0 0 24 24">
              <path d="M6.5 6.2v11.6L15 12z" />
              <rect x="16" y="6" width="2" height="12" rx="1" />
            </svg>
          </button>
        </div>
        <div className="segs" id="segs" />
        <div className="demos">
          <button type="button" className="atajo" id="cIA" title="Cómo piensa una IA (I)">
            <svg className="i" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <circle cx="5" cy="6" r="1.6" />
              <circle cx="19" cy="6" r="1.6" />
              <circle cx="5" cy="18" r="1.6" />
              <circle cx="19" cy="18" r="1.6" />
              <path d="M6.3 7l3.4 3M17.7 7l-3.4 3M6.3 17l3.4-3M17.7 17l-3.4-3" />
            </svg>
            <span>Cómo piensa</span>
          </button>
          <button type="button" className="atajo" id="cChat" title="Demo de chat (D)">
            <svg className="i" viewBox="0 0 24 24">
              <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16.5h-7l-4.5 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z" />
            </svg>
            <span>Demo chat</span>
          </button>
          <button type="button" className="ib" id="bSound" aria-label="Sonido" title="Sonido (M)" />
        </div>
      </nav>

      <div className="start on" id="start">
        <div className="start-card">
          <div className="volanta center caps">Presentación interactiva · 6 escenas · 1 min 20</div>
          <Isotipo />
          <span className="wm">órbita</span>
          <p className="lede">Qué es la inteligencia artificial y cómo atiende a los clientes de tu comercio, explicado en poco más de un minuto.</p>
          <button type="button" className="btn primary" id="bStart">
            <svg className="i f" viewBox="0 0 24 24">
              <path d="M8 5.6v12.8L18.5 12z" />
            </svg>
            <span>Iniciar presentación</span>
          </button>
          <div className="start-alt">
            <button type="button" className="btn ghost" id="sIA">
              Cómo piensa una IA
            </button>
            <button type="button" className="btn ghost" id="sChat">
              Demo de chat
            </button>
          </div>
          <button type="button" className="sound-note" id="sSound" />
          <div className="keys">Espacio: pausa · ← →: escenas · R: reiniciar · M: sonido</div>
        </div>
      </div>
    </section>
  );
}
