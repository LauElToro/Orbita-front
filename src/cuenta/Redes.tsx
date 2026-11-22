import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { ErrorMsg } from '../components/ui';
import type { Cuenta } from '../types';

const REDES = [
  { id: 'facebook', canal: 'instagram', nombre: 'Facebook' },
  { id: 'instagram', canal: 'instagram', nombre: 'Instagram' },
  { id: 'tiktok', canal: 'tiktok', nombre: 'TikTok' },
] as const;

/** Un botón por red: abre la autorización y Orbita guarda el acceso. */
export function ConectarRedes({ cuenta }: { cuenta: Cuenta }) {
  const conectar = useMutation({
    mutationFn: (red: string) => api<{ url: string }>(`/cuenta/redes/${red}/iniciar`, { method: 'POST' }),
    onSuccess: ({ url }) => location.assign(url),
  });
  const instagram = cuenta.canales.find((c) => c.tipo === 'instagram' && c.conectado);
  const tiktok = cuenta.canales.find((c) => c.tipo === 'tiktok' && c.conectado);
  const algunaLista = REDES.some((r) => cuenta.redes?.[r.id]?.listo);
  return (
    <div className="redes-conectar">
      <p className="small muted">
        Tu plan {cuenta.plan.nombre} admite {cuenta.plan.maxCanales} {cuenta.plan.maxCanales === 1 ? 'canal' : 'canales'}. Apretá Conectar:
        se abre la autorización de la red y la cuenta queda enlazada. No hace falta copiar un ID ni un token.
      </p>
      <div className="redes-botones">
        {REDES.map((red) => {
          const listo = Boolean(cuenta.redes?.[red.id]?.listo);
          const ya = red.canal === 'instagram' ? instagram : tiktok;
          return (
            <button key={red.id} type="button" disabled={!listo || conectar.isPending} onClick={() => conectar.mutate(red.id)}>
              {ya ? `Volver a conectar ${red.nombre}` : `Conectar ${red.nombre}`}
            </button>
          );
        })}
      </div>
      {!algunaLista && <p className="small muted">La app todavía no está lista para conectar desde acá.</p>}
      <div className="redes-estado">
        <p className="small">
          Instagram {instagram ? <span className="badge badge-ok">Conectado</span> : <span className="badge badge-muted">Sin conectar</span>}
          {instagram ? <span>{instagram.etiqueta}</span> : null}
        </p>
        <p className="small">
          TikTok {tiktok ? <span className="badge badge-ok">Conectado</span> : <span className="badge badge-muted">Sin conectar</span>}
          {tiktok ? <span>{tiktok.etiqueta}</span> : null}
        </p>
      </div>
      <p className="small muted">
        Facebook toma el Instagram profesional de tu página. Instagram entra directo con esa cuenta. Los dos ocupan el canal de Instagram.
        Si el acceso de TikTok vence, volvé a conectar.
      </p>
      <ErrorMsg error={conectar.error} />
    </div>
  );
}
