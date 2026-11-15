import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PaginaSitio } from '../components/Sitio';
import { Check, ErrorMsg } from '../components/ui';

const VACIO = { nombre: '', email: '', negocio: '', motivo: '', website: '' };

export function Arrepentimiento() {
  const [form, setForm] = useState(VACIO);
  const [acepta, setAcepta] = useState(false);
  const enviar = useMutation({
    mutationFn: () =>
      api<{ ok: true; codigo: string }>('/publico/arrepentimiento', {
        method: 'POST',
        body: { ...form, negocio: form.negocio || undefined, motivo: form.motivo || undefined, aceptaPrivacidad: acepta },
      }),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    enviar.mutate();
  };
  const campo = (key: keyof typeof VACIO) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <PaginaSitio angosta>
      <h1>Botón de arrepentimiento</h1>
      <p>
        Si contrataste un plan como consumidor, podés revocar la contratación dentro de los <strong>10 días corridos</strong> desde que la hiciste,
        sin costo ni explicación (art. 34 de la Ley 24.240 y Resolución 424/2020). Te reintegramos lo abonado por el mismo medio de pago.
      </p>
      {enviar.isSuccess ? (
        <div className="card">
          <h2>Recibimos tu pedido</h2>
          <p>
            Tu código de trámite es <code>{enviar.data.codigo}</code>. Guardalo: te escribimos al email que indicaste dentro de las próximas 24
            horas hábiles.
          </p>
        </div>
      ) : (
        <form className="card" onSubmit={submit}>
          <label>
            Nombre y apellido
            <input {...campo('nombre')} required minLength={2} />
          </label>
          <label>
            Email con el que te registraste
            <input type="email" {...campo('email')} required />
          </label>
          <label>
            Nombre del negocio (opcional)
            <input {...campo('negocio')} />
          </label>
          <label>
            Comentario (opcional)
            <textarea rows={3} {...campo('motivo')} />
          </label>
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" {...campo('website')} />
          <Check checked={acepta} onChange={setAcepta}>
            Leí la <Link to="/privacidad">Política de Privacidad</Link> y acepto que traten mis datos para gestionar este pedido.
          </Check>
          <ErrorMsg error={enviar.error} />
          <button type="submit" disabled={enviar.isPending || !acepta}>
            {enviar.isPending ? 'Enviando...' : 'Revocar contratación'}
          </button>
        </form>
      )}
    </PaginaSitio>
  );
}
