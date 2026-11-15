import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PaginaSitio } from '../components/Sitio';
import { Check, ErrorMsg } from '../components/ui';

const VACIO = { nombre: '', email: '', telefono: '', empresa: '', rubro: '', necesidad: '', website: '' };

export function Contacto() {
  const [form, setForm] = useState(VACIO);
  const [acepta, setAcepta] = useState(false);
  const enviar = useMutation({
    mutationFn: () =>
      api<{ ok: true }>('/publico/contacto', {
        method: 'POST',
        body: { ...form, telefono: form.telefono || undefined, aceptaPrivacidad: acepta },
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

  if (enviar.isSuccess) {
    return (
      <PaginaSitio angosta>
        <div className="card">
          <h1>¡Gracias!</h1>
          <p>Recibimos tu consulta. Te contactamos para armar una IA a medida con abono mensual.</p>
        </div>
      </PaginaSitio>
    );
  }

  return (
    <PaginaSitio angosta>
      <form className="card" onSubmit={submit}>
        <h1>IA personalizada para tu comercio</h1>
        <p className="muted">Contanos qué necesitás y armamos una propuesta con abono mensual.</p>
        <label>
          Nombre
          <input {...campo('nombre')} required minLength={2} />
        </label>
        <label>
          Email
          <input type="email" {...campo('email')} required />
        </label>
        <label>
          Teléfono (opcional)
          <input {...campo('telefono')} />
        </label>
        <label>
          Empresa
          <input {...campo('empresa')} required />
        </label>
        <label>
          Rubro
          <input {...campo('rubro')} required placeholder="Gastronomía, ferretería, estética..." />
        </label>
        <label>
          ¿Qué necesitás?
          <textarea rows={5} {...campo('necesidad')} required minLength={10} />
        </label>
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" {...campo('website')} />
        <Check checked={acepta} onChange={setAcepta}>
          Leí y acepto la <Link to="/privacidad">Política de Privacidad</Link>.
        </Check>
        <ErrorMsg error={enviar.error} />
        <button type="submit" disabled={enviar.isPending || !acepta}>
          {enviar.isPending ? 'Enviando...' : 'Enviar consulta'}
        </button>
      </form>
    </PaginaSitio>
  );
}
