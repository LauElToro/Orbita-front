import type { Canal, CanalTipo } from '../types';

const TIPOS: { value: CanalTipo; label: string; id: string; ejemplo: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', id: 'Identificador del número de teléfono', ejemplo: '109876543210987' },
  { value: 'instagram', label: 'Instagram', id: 'ID de la cuenta de Instagram', ejemplo: '17841400000000000' },
  { value: 'tiktok', label: 'TikTok', id: 'ID de la cuenta Business (business_id)', ejemplo: '-000aBcD...' },
];

export const canalVacio = (tipo: CanalTipo = 'whatsapp'): Canal => ({ tipo, endpointId: '', etiqueta: '', token: '' });

/** El backend conserva el token guardado cuando no viene uno nuevo, y rechaza un token vacío. */
export const canalesParaEnviar = (canales: Canal[]) =>
  canales.map(({ tipo, endpointId, etiqueta, token }) => ({ tipo, endpointId, etiqueta, ...(token?.trim() ? { token: token.trim() } : {}) }));

interface Props {
  value: Canal[];
  max: number;
  onChange: (canales: Canal[]) => void;
  permitidos?: CanalTipo[];
}

export function CanalesEditor({ value, max, onChange, permitidos }: Props) {
  const tipos = permitidos ? TIPOS.filter((t) => permitidos.includes(t.value)) : TIPOS;
  const set = (i: number, patch: Partial<Canal>) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="canales">
      {value.map((c, i) => {
        const tipo = tipos.find((t) => t.value === c.tipo) ?? tipos[0];
        return (
          <div className="canal-card" key={i}>
            <div className="canal-cabecera">
              <select aria-label={`Tipo canal ${i + 1}`} value={c.tipo} onChange={(e) => set(i, { tipo: e.target.value as CanalTipo })}>
                {tipos.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {c.conectado ? <span className="badge badge-ok">Conectado</span> : <span className="badge badge-muted">Sin token</span>}
              <button type="button" className="link" onClick={() => onChange(value.filter((_, j) => j !== i))} disabled={value.length <= 1}>
                Quitar
              </button>
            </div>
            <div className="grid2">
              <label>
                {tipo.id}
                <input
                  aria-label={`endpointId canal ${i + 1}`}
                  placeholder={tipo.ejemplo}
                  value={c.endpointId}
                  onChange={(e) => set(i, { endpointId: e.target.value })}
                  required
                />
              </label>
              <label>
                Token de acceso
                <input
                  type="password"
                  aria-label={`Token canal ${i + 1}`}
                  placeholder={c.conectado ? `Guardado (${c.tokenMask ?? '****'}). Pegá uno nuevo para reemplazarlo` : 'Pegá el token'}
                  value={c.token ?? ''}
                  onChange={(e) => set(i, { token: e.target.value })}
                  minLength={10}
                  autoComplete="off"
                />
              </label>
            </div>
            <label>
              Etiqueta
              <input
                aria-label={`Etiqueta canal ${i + 1}`}
                placeholder={`${tipo.label} del local`}
                value={c.etiqueta}
                onChange={(e) => set(i, { etiqueta: e.target.value })}
                required
              />
            </label>
          </div>
        );
      })}
      <button type="button" className="secondary" onClick={() => onChange([...value, canalVacio(tipos[0]?.value ?? 'instagram')])} disabled={value.length >= max}>
        Agregar canal ({value.length}/{max})
      </button>
    </div>
  );
}
