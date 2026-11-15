import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EMPRESA } from '../legal/empresa';

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className={`logo ${claro ? 'logo-claro' : ''}`}>
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <circle cx="16" cy="16" r="6.5" fill="currentColor" />
        <ellipse cx="16" cy="16" rx="14" ry="6" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-25 16 16)" opacity="0.7" />
        <circle cx="28" cy="10.5" r="2.2" fill="#ffb648" />
      </svg>
      Orbita
    </span>
  );
}

export function SitioHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="site-brand" aria-label="Orbita, inicio">
        <Logo claro />
      </Link>
      <nav className="site-nav">
        <a href="/#como-funciona">Cómo funciona</a>
        <a href="/#planes">Planes</a>
        <a href="/#preguntas">Preguntas</a>
        <Link to="/ingresar">Ingresar</Link>
        <Link to="/registro" className="button button-sm">
          Empezar
        </Link>
      </nav>
    </header>
  );
}

export function SitioFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <Logo claro />
          <p className="small">Asistentes con IA para comercios, conectados directo a WhatsApp, Instagram y TikTok.</p>
        </div>
        <div>
          <strong>Producto</strong>
          <a href="/#planes">Planes</a>
          <Link to="/contacto">IA personalizada</Link>
          <Link to="/ingresar">Ingresar</Link>
        </div>
        <div>
          <strong>Legal</strong>
          <Link to="/terminos">Términos y Condiciones</Link>
          <Link to="/privacidad">Política de Privacidad</Link>
          <Link to="/arrepentimiento" className="arrepentimiento-link">
            Botón de arrepentimiento
          </Link>
        </div>
        <div>
          <strong>Contacto</strong>
          <a href={`mailto:${EMPRESA.soporte}`}>{EMPRESA.soporte}</a>
          <span className="small">{EMPRESA.domicilio}</span>
        </div>
      </div>
      <p className="small site-legal">
        © {new Date().getFullYear()} {EMPRESA.razonSocial} · CUIT {EMPRESA.cuit}. WhatsApp, Instagram y TikTok son marcas de sus
        respectivos titulares; Orbita no está afiliada ni patrocinada por ellos.
      </p>
    </footer>
  );
}

export function PaginaSitio({ children, angosta = false }: { children: ReactNode; angosta?: boolean }) {
  return (
    <div className="sitio">
      <SitioHeader />
      <main className={angosta ? 'sitio-main sitio-angosta' : 'sitio-main'}>{children}</main>
      <SitioFooter />
    </div>
  );
}
