const BASE = import.meta.env.VITE_API_URL ?? '/api';

function crearSesion(key: string) {
  return {
    get: () => localStorage.getItem(key),
    set: (token: string) => localStorage.setItem(key, token),
    clear: () => localStorage.removeItem(key),
  };
}

/** Sesión del equipo de Orbita (panel /admin). */
export const session = crearSesion('orbita.token');
/** Sesión del comercio (área /cuenta). */
export const sesionCliente = crearSesion('orbita.cuenta');
/** Sesión del afiliado (área /afiliados/panel). */
export const sesionAfiliado = crearSesion('orbita.afiliado');

const REF_KEY = 'orbita.ref';
const REF_DIAS = 30;

/** Código de afiliado del último link de referidos visitado. Vence a los 30 días. */
export const referido = {
  guardar(codigo: string) {
    localStorage.setItem(REF_KEY, JSON.stringify({ codigo, hasta: Date.now() + REF_DIAS * 86_400_000 }));
  },
  get(): string | undefined {
    try {
      const guardado = JSON.parse(localStorage.getItem(REF_KEY) ?? 'null') as { codigo?: string; hasta?: number } | null;
      if (guardado?.codigo && (guardado.hasta ?? 0) > Date.now()) return guardado.codigo;
    } catch {
      /* valor corrupto: se descarta */
    }
    localStorage.removeItem(REF_KEY);
    return undefined;
  },
  limpiar() {
    localStorage.removeItem(REF_KEY);
  },
};

/** Acepta el código solo o el link completo (`...?ref=codigo`) y devuelve el código en minúsculas. */
export function codigoDeReferido(texto: string): string {
  const limpio = texto.trim();
  const enLink = limpio.match(/[?&]ref=([^&#\s]+)/i)?.[1];
  return (enLink ?? limpio).trim().toLowerCase();
}

export const CODIGO_REFERIDO = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const esCliente = (path: string) => path.startsWith('/cuenta/') && !/^\/cuenta\/(registro|login|restablecer)$/.test(path);
const esAfiliado = (path: string) => path === '/afiliados/me';
const esPublico = (path: string) =>
  path === '/checkout' || /^\/afiliados\/(registro|login|olvide|restablecer)$/.test(path);

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const cliente = esCliente(path);
  const afiliado = esAfiliado(path);
  const sesion = cliente ? sesionCliente : afiliado ? sesionAfiliado : session;
  const headers: Record<string, string> = {};
  const token = esPublico(path) ? null : sesion.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      sesion.clear();
      const login = cliente ? '/ingresar' : afiliado ? '/afiliados/ingresar' : '/admin/login';
      if (location.pathname !== login) location.assign(login);
    }
    throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? `Error ${res.status}`);
  }
  return data as T;
}
