import { Outlet, useNavigate } from 'react-router-dom';
import { session } from '../api';
import { PanelShell, type GrupoNav } from './Shell';

const GRUPOS: GrupoNav[] = [
  { items: [{ to: '/admin', label: 'Resumen', icono: 'grafico', end: true }] },
  {
    titulo: 'Gestión',
    items: [
      { to: '/admin/clientes', label: 'Clientes', icono: 'clientes' },
      { to: '/admin/tickets', label: 'Tickets', icono: 'tickets' },
      { to: '/admin/afiliados', label: 'Afiliados', icono: 'persona' },
    ],
  },
];

export function Layout() {
  const navigate = useNavigate();
  const salir = () => {
    session.clear();
    navigate('/admin/login');
  };
  return (
    <PanelShell inicio="/admin" grupos={GRUPOS} usuario={{ nombre: 'Equipo Orbita', detalle: 'Panel interno' }} onSalir={salir}>
      <Outlet />
    </PanelShell>
  );
}
