import type { Canal, CanalTipo } from '../types';

const TIPOS: { value: CanalTipo; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

export const canalVacio = (): Canal => ({ tipo: 'whatsapp', endpointId: '', etiqueta: '' });

interface Props {
  value: Canal[];
  max: number;
  onChange: (canales: Canal[]) => void;
}

export function CanalesEditor({ value, max, onChange }: Props) {
  const set = (i: number, patch: Partial<Canal>) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="canales">
      {value.map((c, i) => (
        <div className="row" key={i}>
          <select aria-label={`Tipo canal ${i + 1}`} value={c.tipo} onChange={(e) => set(i, { tipo: e.target.value as CanalTipo })}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            aria-label={`endpointId canal ${i + 1}`}
            placeholder="endpointId (phone_number_id, Instagram id o TikTok id)"
            value={c.endpointId}
            onChange={(e) => set(i, { endpointId: e.target.value })}
            required
          />
          <input
            aria-label={`Etiqueta canal ${i + 1}`}
            placeholder="Etiqueta"
            value={c.etiqueta}
            onChange={(e) => set(i, { etiqueta: e.target.value })}
            required
          />
          <button type="button" className="link" onClick={() => onChange(value.filter((_, j) => j !== i))} disabled={value.length <= 1}>
            Quitar
          </button>
        </div>
      ))}
      <button type="button" className="secondary" onClick={() => onChange([...value, canalVacio()])} disabled={value.length >= max}>
        Agregar canal ({value.length}/{max})
      </button>
    </div>
  );
}
