import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { session } from '../api';
import { Logo } from './Sitio';

export function Layout() {
  const navigate = useNavigate();
  const salir = () => {
    session.clear();
    navigate('/admin/login');
  };
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/admin" className="brand">
          <Logo claro />
        </Link>
        <span className="badge badge-muted">Equipo</span>
        <nav>
          <NavLink to="/admin" end>
            Resumen
          </NavLink>
          <NavLink to="/admin/clientes">Clientes</NavLink>
          <NavLink to="/admin/tickets">Tickets</NavLink>
        </nav>
        <button className="link" onClick={salir}>
          Salir
        </button>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
