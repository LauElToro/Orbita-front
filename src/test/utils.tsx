import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { App } from '../App';

type Handler = (init: RequestInit & { url: string }) => { status?: number; body: unknown };

/** Mockea fetch por "METHOD /path" (sin el prefijo /api). */
export function mockApi(routes: Record<string, Handler | unknown>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input).replace(/^\/api/, '');
    const key = `${init.method ?? 'GET'} ${url}`;
    const route = routes[key];
    if (route === undefined) return new Response(JSON.stringify({ error: `sin mock: ${key}` }), { status: 404 });
    const { status = 200, body } = typeof route === 'function' ? (route as Handler)({ ...init, url }) : { body: route };
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function renderApp(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
