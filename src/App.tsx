import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { GoogleVuelta, Ingresar, Olvide, Registro, Restablecer } from './cuenta/Acceso';
import { Demo } from './cuenta/Demo';
import { Agenda, Ajustes, Conexion, CuentaLayout, Inicio, MiIA, PlanYPagos, Probar } from './cuenta/Panel';
import { Arrepentimiento } from './legal/Arrepentimiento';
import { Privacidad } from './legal/Privacidad';
import { Terminos } from './legal/Terminos';
import { Alta } from './pages/Alta';
import { Contacto } from './pages/Contacto';
import { Dashboard } from './pages/Dashboard';
import { Ficha } from './pages/Ficha';
import { Landing } from './pages/Landing';
import { Lista } from './pages/Lista';
import { Login } from './pages/Login';
import { PaginaCliente } from './pages/PaginaCliente';
import { Tickets } from './pages/Tickets';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/arrepentimiento" element={<Arrepentimiento />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/p/:token" element={<PaginaCliente />} />

      <Route path="/registro" element={<Registro />} />
      <Route path="/ingresar" element={<Ingresar />} />
      <Route path="/olvide" element={<Olvide />} />
      <Route path="/google/vuelta" element={<GoogleVuelta />} />
      <Route path="/restablecer/:token" element={<Restablecer />} />
      <Route path="/cuenta" element={<CuentaLayout />}>
        <Route index element={<Inicio />} />
        <Route path="demo" element={<Demo />} />
        <Route path="ia" element={<MiIA />} />
        <Route path="probar" element={<Probar />} />
        <Route path="conexion" element={<Conexion />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="plan" element={<PlanYPagos />} />
        <Route path="ajustes" element={<Ajustes />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Lista />} />
        <Route path="clientes/nuevo" element={<Alta />} />
        <Route path="clientes/:id" element={<Ficha />} />
        <Route path="tickets" element={<Tickets />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
