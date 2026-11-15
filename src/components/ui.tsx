import { useState, type ReactNode } from 'react';
import { porcentaje } from '../format';

export function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {actions && <div className="actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function UsoBar({ label, usado, tope, reinicia }: { label: string; usado: number; tope: number; reinicia?: string }) {
  const pct = porcentaje(usado, tope);
  const tone = pct >= 100 ? 'bad' : pct >= 80 ? 'warn' : 'ok';
  return (
    <div className="uso">
      <div className="uso-head">
        <span>{label}</span>
        <strong>
          {usado} / {tope}
        </strong>
      </div>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`bar-fill bar-${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {reinicia && <small className="muted">Reinicia: {reinicia}</small>}
    </div>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
      <span>{children}</span>
    </label>
  );
}

export function Copiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    void navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  };
  return (
    <span className="copiar">
      <code>{texto}</code>
      <button type="button" className="link small" onClick={copiar}>
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </span>
  );
}

export function ErrorMsg({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="error">{error instanceof Error ? error.message : String(error)}</p>;
}
