import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CanalesEditor, canalesParaEnviar, canalVacio } from '../components/CanalesEditor';
import { ErrorMsg } from '../components/ui';
import { pesos } from '../format';
import type { Canal, Ficha, MedioPago, Plan, PlanId } from '../types';

export interface AltaForm {
  clientId: string;
  nombre: string;
  planId: PlanId;
  medio: MedioPago;
  canales: Canal[];
  prompt: string;
  emailContacto?: string;
}

export const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]/)
    .filter(Boolean)
    .join('-')
    .slice(0, 49);

export function Alta() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const planes = useQuery({ queryKey: ['planes'], queryFn: () => api<Plan[]>('/planes') });
  const [form, setForm] = useState<AltaForm>({
    clientId: '',
    nombre: '',
    planId: 'mensajes',
    medio: 'mercadopago',
    canales: [canalVacio()],
    prompt: '',
  });
  const [clientIdTocado, setClientIdTocado] = useState(false);

  const crear = useMutation({
    mutationFn: (body: AltaForm) => api<Ficha>('/clientes', { method: 'POST', body }),
    onSuccess: (ficha) => {
      void qc.invalidateQueries({ queryKey: ['clientes'] });
      navigate(`/admin/clientes/${ficha.id}`);
    },
  });

  const estandar = planes.data?.filter((p) => p.id !== 'personalizado') ?? [];
  const plan = estandar.find((p) => p.id === form.planId);
  const set = (patch: Partial<AltaForm>) => setForm((f) => ({ ...f, ...patch }));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    crear.mutate({ ...form, canales: canalesParaEnviar(form.canales), emailContacto: form.emailContacto || undefined });
  };

  return (
    <form className="card" onSubmit={enviar}>
      <h1>Nuevo cliente</h1>
      <div className="grid2">
        <label>
          Nombre
          <input
            value={form.nombre}
            onChange={(e) => set({ nombre: e.target.value, ...(clientIdTocado ? {} : { clientId: slug(e.target.value) }) })}
            required
          />
        </label>
        <label>
          clientId
          <input
            value={form.clientId}
            onChange={(e) => {
              setClientIdTocado(true);
              set({ clientId: e.target.value });
            }}
            pattern="[a-z0-9][a-z0-9-]{1,48}"
            required
          />
        </label>
        <label>
          Plan
          <select value={form.planId} onChange={(e) => set({ planId: e.target.value as PlanId })}>
            {estandar.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Email del cliente (opcional)
          <input type="email" value={form.emailContacto ?? ''} onChange={(e) => set({ emailContacto: e.target.value })} />
        </label>
      </div>

      {plan && (
        <p className="precio">
          Va a pagar <strong>{pesos(plan.precioMercadoPago)}</strong> por mes con Mercado Pago. Topes: {plan.topeDia} por día, {plan.topeSemana} por
          semana, {plan.topeMes} por mes. Módulos: {plan.modulos.join(', ')}.
        </p>
      )}

      <h3>Canales</h3>
      <CanalesEditor value={form.canales} max={plan?.maxCanales ?? 1} onChange={(canales) => set({ canales })} />

      <label>
        Prompt inicial
        <textarea rows={8} value={form.prompt} onChange={(e) => set({ prompt: e.target.value })} placeholder="Qué vende, precios, horarios, tono y cuándo pasar a una persona." />
      </label>

      <ErrorMsg error={crear.error} />
      <button type="submit" disabled={crear.isPending}>
        {crear.isPending ? 'Guardando...' : 'Crear cliente'}
      </button>
    </form>
  );
}
