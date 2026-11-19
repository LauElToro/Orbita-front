import { useEffect } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { referido } from './api';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { GoogleVuelta, Ingresar, Olvide, Registro, Restablecer } from './cuenta/Acceso';
import { Demo } from './cuenta/Demo';
import { Agenda, Ajustes, Conexion, CuentaLayout, Inicio, MiIA, PlanYPagos, Probar, Referidos } from './cuenta/Panel';
import { Arrepentimiento } from './legal/Arrepentimiento';
import { Privacidad } from './legal/Privacidad';
import { Terminos } from './legal/Terminos';
import { Afiliados as AdminAfiliados } from './pages/AdminAfiliados';
import { AfiliadosIngresar, AfiliadosOlvide, AfiliadosPanel, AfiliadosRegistro, AfiliadosRestablecer } from './pages/Afiliados';
import { Alta } from './pages/Alta';
import { Checkout, CheckoutGracias } from './pages/Checkout';
import { Contacto } from './pages/Contacto';
import { Dashboard } from './pages/Dashboard';
import { Ficha } from './pages/Ficha';
import { Landing } from './pages/Landing';
import { Lista } from './pages/Lista';
import { Login } from './pages/Login';
import { PaginaCliente } from './pages/PaginaCliente';
import { Tickets } from './pages/Tickets';

/** Guarda el código de un link de referidos (`?ref=`) para atribuir el alta que venga después. */
function useCapturaReferido() {
  const [params] = useSearchParams();
  const ref = params.get('ref');
  useEffect(() => {
    if (ref && /^[a-z0-9-]{3,40}$/i.test(ref)) referido.guardar(ref.toLowerCase());
  }, [ref]);
}

export function App() {
  useCapturaReferido();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/arrepentimiento" element={<Arrepentimiento />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/p/:token" element={<PaginaCliente />} />

      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout/gracias" element={<CheckoutGracias />} />

      <Route path="/afiliados" element={<AfiliadosRegistro />} />
      <Route path="/afiliados/ingresar" element={<AfiliadosIngresar />} />
      <Route path="/afiliados/olvide" element={<AfiliadosOlvide />} />
      <Route path="/afiliados/restablecer/:token" element={<AfiliadosRestablecer />} />
      <Route path="/afiliados/panel" element={<AfiliadosPanel />} />

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
        <Route path="referidos" element={<Referidos />} />
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
        <Route path="afiliados" element={<AdminAfiliados />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
