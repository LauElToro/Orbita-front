import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icono, type NombreIcono } from './Iconos';
import { Logo } from './Sitio';

export interface ItemNav {
  to: string;
  label: string;
  icono: NombreIcono;
  end?: boolean;
  bloqueado?: boolean;
  etiqueta?: string;
}

export interface GrupoNav {
  titulo?: string;
  items: ItemNav[];
}

type Tema = 'oscuro' | 'claro';
const CLAVE_TEMA = 'orbita.tema';

function useTema() {
  const [tema, setTema] = useState<Tema>(() => (localStorage.getItem(CLAVE_TEMA) === 'claro' ? 'claro' : 'oscuro'));
  const alternar = () => {
    const nuevo = tema === 'oscuro' ? 'claro' : 'oscuro';
    localStorage.setItem(CLAVE_TEMA, nuevo);
    setTema(nuevo);
  };
  return { tema, alternar };
}

function itemActual(grupos: GrupoNav[], path: string): ItemNav | undefined {
  return grupos
    .flatMap((g) => g.items)
    .filter((i) => (i.end ? path === i.to : path === i.to || path.startsWith(`${i.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0];
}

interface ShellProps {
  inicio: string;
  grupos: GrupoNav[];
  usuario: { nombre: string; detalle?: string };
  onSalir: () => void;
  banner?: ReactNode;
  children: ReactNode;
}

export function PanelShell({ inicio, grupos, usuario, onSalir, banner, children }: ShellProps) {
  const { tema, alternar } = useTema();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);
  const actual = itemActual(grupos, pathname);
  const enInicio = !actual || actual.to === inicio;

  return (
    <div className="app" data-tema={tema}>
      <aside className={`app-sidebar ${menu ? 'abierta' : ''}`}>
        <Link to={inicio} className="app-logo">
          <Logo claro={tema === 'oscuro'} />
        </Link>
        <nav className="app-nav" aria-label="Panel">
          {grupos.map((g, i) => (
            <div className="app-nav-grupo" key={g.titulo ?? i}>
              {g.titulo && <p className="app-nav-titulo">{g.titulo}</p>}
              {g.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="app-nav-item">
                  <Icono nombre={item.icono} />
                  <span className="app-nav-label">{item.label}</span>
                  {item.etiqueta && <span className="app-nav-etiqueta" aria-hidden="true">{item.etiqueta}</span>}
                  {item.bloqueado && (
                    <span className="app-nav-candado" title="Se habilita con tu plan">
                      <Icono nombre="candado" tam={14} />
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="app-usuario">
          <span className="avatar" aria-hidden="true">
            {usuario.nombre.trim().charAt(0).toUpperCase() || 'O'}
          </span>
          <div className="app-usuario-datos">
            <strong>{usuario.nombre}</strong>
            {usuario.detalle && <small>{usuario.detalle}</small>}
          </div>
          <button type="button" className="icon-btn" onClick={onSalir} title="Salir">
            <Icono nombre="salir" />
            <span className="sr-only">Salir</span>
          </button>
        </div>
      </aside>
      {menu && <div className="app-velo" onClick={() => setMenu(false)} aria-hidden="true" />}

      <div className="app-main">
        <header className="app-topbar">
          <button type="button" className="icon-btn app-menu-btn" onClick={() => setMenu(true)} aria-label="Abrir menú">
            <Icono nombre="menu" />
          </button>
          <nav className="migas" aria-label="Ubicación">
            <Link to={inicio}>
              <Icono nombre="inicio" tam={15} /> Inicio
            </Link>
            {!enInicio && actual && (
              <>
                <span aria-hidden="true">/</span>
                <strong>{actual.label}</strong>
              </>
            )}
          </nav>
          <div className="app-topbar-acciones">
            <button
              type="button"
              className="icon-btn"
              onClick={alternar}
              aria-label={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              title="Cambiar tema"
            >
              <Icono nombre={tema === 'oscuro' ? 'sol' : 'luna'} />
            </button>
          </div>
        </header>
        <main className="content">
          {banner}
          {children}
        </main>
      </div>
    </div>
  );
}
