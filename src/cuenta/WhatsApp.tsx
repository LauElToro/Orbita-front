import { useState } from 'react';
import { ErrorMsg } from '../components/ui';
import type { Cuenta, VerificacionWhatsapp } from '../types';
import { useAccionCuenta } from './useCuenta';

const ESTADO: Record<VerificacionWhatsapp, string> = {
  pendiente: 'Pendiente de verificación',
  en_revision: 'En revisión de Meta',
  verificado: 'Verificado',
  rechazado: 'Rechazado',
};

declare global {
  interface Window {
    FB?: {
      init: (opts: object) => void;
      login: (cb: (r: { authResponse?: { code?: string } }) => void, opts: object) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function abrirEmbeddedSignup(appId: string, configId: string, version: string) {
  return new Promise<{ code: string; phoneNumberId: string; wabaId: string }>((resolve, reject) => {
    let phoneNumberId = '';
    let wabaId = '';
    const onMsg = (event: MessageEvent) => {
      if (typeof event.origin !== 'string' || !event.origin.endsWith('facebook.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'WA_EMBEDDED_SIGNUP' && (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA')) {
          phoneNumberId = data.data?.phone_number_id ?? phoneNumberId;
          wabaId = data.data?.waba_id ?? wabaId;
        }
      } catch {
        /* Meta manda otros mensajes que no son JSON. */
      }
    };
    window.addEventListener('message', onMsg);
    const login = () => {
      window.FB?.login(
        (res) => {
          window.removeEventListener('message', onMsg);
          const code = res.authResponse?.code;
          if (!code || !phoneNumberId || !wabaId) {
            reject(new Error('No se completó la conexión con WhatsApp'));
            return;
          }
          resolve({ code, phoneNumberId, wabaId });
        },
        {
          config_id: configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
        },
      );
    };
    const listo = () => {
      window.FB?.init({ appId, cookie: true, xfbml: false, version });
      login();
    };
    if (window.FB) {
      listo();
      return;
    }
    window.fbAsyncInit = listo;
    if (!document.getElementById('facebook-jssdk')) {
      const s = document.createElement('script');
      s.id = 'facebook-jssdk';
      s.async = true;
      s.src = 'https://connect.facebook.net/es_LA/sdk.js';
      document.body.appendChild(s);
    }
  });
}

export function WhatsAppConectar({ cuenta }: { cuenta: Cuenta }) {
  const canal = cuenta.canales.find((c) => c.tipo === 'whatsapp');
  const cfg = cuenta.whatsapp;
  const guardar = useAccionCuenta();
  const refrescar = useAccionCuenta();
  const [error, setError] = useState('');
  const [pendiente, setPendiente] = useState(false);

  const conectar = async () => {
    if (!cfg?.listo) return;
    setError('');
    setPendiente(true);
    try {
      const body = await abrirEmbeddedSignup(cfg.appId, cfg.configId, cfg.version);
      await guardar.mutateAsync({ path: 'whatsapp', body });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar WhatsApp');
    } finally {
      setPendiente(false);
    }
  };

  return (
    <div className="whatsapp-conectar">
      <p className="small muted">
        Orbita verifica el número, lo enlaza con Meta y recibe los mensajes. No hace falta un token ni un equipo técnico.
      </p>
      {canal ? (
        <p>
          <span className={`badge ${canal.verificacion === 'verificado' ? 'badge-ok' : canal.verificacion === 'rechazado' ? 'badge-warn' : 'badge-muted'}`}>
            {canal.verificacion ? ESTADO[canal.verificacion] : canal.conectado ? 'Conectado' : 'Sin conectar'}
          </span>{' '}
          {canal.displayPhone || canal.etiqueta}
          {canal.verificacionDetalle && <span className="small muted"> · {canal.verificacionDetalle}</span>}
        </p>
      ) : (
        <p className="small">Todavía no hay un número conectado.</p>
      )}
      <div className="form-acciones">
        <button type="button" onClick={() => void conectar()} disabled={!cfg?.listo || pendiente || guardar.isPending}>
          {pendiente || guardar.isPending ? 'Conectando...' : canal ? 'Volver a conectar WhatsApp' : 'Conectar WhatsApp'}
        </button>
        {canal?.conectado && (
          <button type="button" className="secondary" disabled={refrescar.isPending} onClick={() => refrescar.mutate({ path: 'whatsapp/estado' })}>
            Actualizar estado
          </button>
        )}
      </div>
      {!cfg?.listo && <p className="small muted">La app de Meta todavía no está lista para conectar números desde acá.</p>}
      {error && <p className="error">{error}</p>}
      <ErrorMsg error={guardar.error ?? refrescar.error} />
    </div>
  );
}
