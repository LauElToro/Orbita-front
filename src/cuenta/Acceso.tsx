import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, sesionCliente } from '../api';
import { PlanCard } from '../components/Planes';
import { PaginaSitio } from '../components/Sitio';
import { Check, ErrorMsg } from '../components/ui';
import type { MedioPago, Plan, PlanId } from '../types';

export function Registro() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });
  const [form, setForm] = useState({
    negocio: '',
    rubro: '',
    nombre: '',
    email: '',
    password: '',
    planId: (params.get('plan') as PlanId | null) ?? 'turnos',
    medio: (params.get('medio') as MedioPago | null) ?? 'mercadopago',
  });
  const [terminos, setTerminos] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const registrar = useMutation({
    mutationFn: () =>
      api<{ token: string }>('/cuenta/registro', {
        method: 'POST',
        body: { ...form, aceptaTerminos: terminos, aceptaPrivacidad: privacidad },
      }),
    onSuccess: ({ token }) => {
      sesionCliente.set(token);
      navigate('/cuenta', { replace: true });
    },
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    registrar.mutate();
  };

  return (
    <PaginaSitio>
      <form className="registro" onSubmit={enviar}>
        <div className="registro-planes">
          <h1>Creá tu cuenta</h1>
          <p className="muted">Elegí un plan. Podés cambiarlo cuando quieras.</p>
          <div className="toggle" role="group" aria-label="Medio de pago">
            <button type="button" className={form.medio === 'mercadopago' ? 'on' : ''} onClick={() => set({ medio: 'mercadopago' })}>
              Mercado Pago
            </button>
            <button type="button" className={form.medio === 'transferencia' ? 'on' : ''} onClick={() => set({ medio: 'transferencia' })}>
              Transferencia
            </button>
          </div>
          <div className="planes planes-compactos">
            {planes.data?.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                medio={form.medio}
                seleccionado={p.id === form.planId}
                accion={
                  <button type="button" className={p.id === form.planId ? '' : 'secondary'} onClick={() => set({ planId: p.id })}>
                    {p.id === form.planId ? 'Seleccionado' : `Elegir ${p.nombre}`}
                  </button>
                }
              />
            ))}
          </div>
        </div>
        <div className="card registro-form">
          <label>
            Nombre del negocio
            <input value={form.negocio} onChange={(e) => set({ negocio: e.target.value })} required minLength={2} />
          </label>
          <label>
            Rubro
            <input value={form.rubro} onChange={(e) => set({ rubro: e.target.value })} required minLength={2} placeholder="Gastronomía, estética, indumentaria..." />
          </label>
          <label>
            Tu nombre
            <input value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} required minLength={2} />
          </label>
          <label>
            Email
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} required />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              required
              minLength={8}
            />
            <small className="muted">Mínimo 8 caracteres.</small>
          </label>
          <Check checked={terminos} onChange={setTerminos}>
            Leí y acepto los{' '}
            <Link to="/terminos" target="_blank">
              Términos y Condiciones
            </Link>
            , incluido que las respuestas de la IA pueden contener errores y que soy responsable de la información que cargo.
          </Check>
          <Check checked={privacidad} onChange={setPrivacidad}>
            Leí y acepto la{' '}
            <Link to="/privacidad" target="_blank">
              Política de Privacidad
            </Link>
            .
          </Check>
          <ErrorMsg error={registrar.error} />
          <button type="submit" disabled={registrar.isPending || !terminos || !privacidad}>
            {registrar.isPending ? 'Creando cuenta...' : 'Crear cuenta y continuar al pago'}
          </button>
          <p className="small muted">
            ¿Ya tenés cuenta? <Link to="/ingresar">Ingresá</Link>
          </p>
        </div>
      </form>
    </PaginaSitio>
  );
}

export function Ingresar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useMutation({
    mutationFn: () => api<{ token: string }>('/cuenta/login', { method: 'POST', body: { email, password } }),
    onSuccess: ({ token }) => {
      sesionCliente.set(token);
      navigate('/cuenta', { replace: true });
    },
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    login.mutate();
  };
  return (
    <PaginaSitio angosta>
      <form className="card acceso" onSubmit={enviar}>
        <h1>Ingresá a tu cuenta</h1>
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <ErrorMsg error={login.error} />
        <button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
        <p className="small muted">
          ¿No tenés cuenta? <Link to="/registro">Registrate</Link>. ¿Olvidaste tu contraseña? Escribinos y te enviamos un link para restablecerla.
        </p>
      </form>
    </PaginaSitio>
  );
}

export function Restablecer() {
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const restablecer = useMutation({
    mutationFn: () => api<{ ok: true }>('/cuenta/restablecer', { method: 'POST', body: { token, password } }),
  });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    restablecer.mutate();
  };
  return (
    <PaginaSitio angosta>
      {restablecer.isSuccess ? (
        <div className="card acceso">
          <h1>Listo</h1>
          <p>Ya podés ingresar con tu nueva contraseña.</p>
          <Link to="/ingresar" className="button">
            Ingresar
          </Link>
        </div>
      ) : (
        <form className="card acceso" onSubmit={enviar}>
          <h1>Elegí tu contraseña</h1>
          <label>
            Nueva contraseña
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
          <label>
            Repetila
            <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required />
          </label>
          {repetir && repetir !== password && <p className="error">Las contraseñas no coinciden.</p>}
          <ErrorMsg error={restablecer.error} />
          <button type="submit" disabled={restablecer.isPending || password !== repetir}>
            Guardar contraseña
          </button>
        </form>
      )}
    </PaginaSitio>
  );
}
