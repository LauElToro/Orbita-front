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

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const esCliente = (path: string) => path.startsWith('/cuenta/') && !/^\/cuenta\/(registro|login|restablecer)$/.test(path);

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const cliente = esCliente(path);
  const sesion = cliente ? sesionCliente : session;
  const headers: Record<string, string> = {};
  const token = sesion.get();
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
      const login = cliente ? '/ingresar' : '/admin/login';
      if (location.pathname !== login) location.assign(login);
    }
    throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? `Error ${res.status}`);
  }
  return data as T;
}
