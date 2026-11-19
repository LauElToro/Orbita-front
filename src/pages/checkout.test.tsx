import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { referido, sesionAfiliado } from '../api';
import { PLANES } from '../test/fixtures';
import { mockApi, renderApp } from '../test/utils';

const PUBLICOS = PLANES.filter((p) => p.id !== 'personalizado');

describe('checkout sin sesión', () => {
  it('paga con solo el email y manda el código del link de referidos', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign, pathname: '/checkout' });
    let body: Record<string, unknown> = {};
    mockApi({
      'GET /publico/planes': PUBLICOS,
      'POST /checkout': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { body: { initPoint: 'https://mp.test/init' } };
      },
    });
    referido.guardar('juan-socio-ab12');
    renderApp('/checkout?plan=completo');
    expect(await screen.findByRole('heading', { name: 'Plan Completo' })).toBeInTheDocument();
    expect(screen.getByLabelText('Plan')).toHaveValue('completo');

    await userEvent.type(screen.getByLabelText('Email'), 'ana@kiosco.com');
    const pagar = screen.getByRole('button', { name: 'Pagar con Mercado Pago' });
    expect(pagar).toBeDisabled();
    for (const c of screen.getAllByRole('checkbox')) await userEvent.click(c);
    await userEvent.click(pagar);

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://mp.test/init'));
    expect(body).toEqual({
      email: 'ana@kiosco.com',
      planId: 'completo',
      aceptaTerminos: true,
      aceptaPrivacidad: true,
      ref: 'juan-socio-ab12',
    });
  });

  it('guarda el código de ?ref= al entrar por un link de referidos', async () => {
    mockApi({ 'GET /publico/planes': PUBLICOS });
    renderApp('/checkout?plan=turnos&ref=Juan-Socio-AB12');
    await screen.findByRole('heading', { name: 'Plan Turnos' });
    expect(referido.get()).toBe('juan-socio-ab12');
  });
});

describe('afiliados', () => {
  it('se registra y ve su link en el panel', async () => {
    mockApi({
      'POST /afiliados/registro': () => ({ status: 201, body: { token: 'jwt-afiliado' } }),
      'GET /afiliados/me': {
        nombre: 'Juan Socio',
        email: 'juan@socio.com',
        codigo: 'juan-socio-ab12',
        link: 'https://orbita.test/?ref=juan-socio-ab12',
        porcentaje: 50,
        plazo: { desde: 30, hasta: 60 },
        datosCobro: null,
        totales: { pendiente: 42000, pagada: 0 },
        referidos: [{ id: 'r1', negocio: 'Kiosco Ana', plan: 'Turnos', pago: true, createdAt: '2026-11-14T15:00:00.000Z' }],
        comisiones: [
          {
            id: 'c1',
            importe: 42000,
            estado: 'pendiente',
            pagableDesde: '2026-12-14T15:00:00.000Z',
            pagarAntes: '2027-01-13T15:00:00.000Z',
            pagadaEn: null,
            createdAt: '2026-11-14T15:00:00.000Z',
          },
        ],
      },
    });
    renderApp('/afiliados');
    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Juan Socio');
    await userEvent.type(screen.getByLabelText('Email'), 'juan@socio.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'clave-socio-1');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Quiero mi link' }));

    expect(await screen.findByText('https://orbita.test/?ref=juan-socio-ab12')).toBeInTheDocument();
    expect(screen.getByText('Kiosco Ana')).toBeInTheDocument();
    expect(screen.queryByText(/días después/)).not.toBeInTheDocument();
    expect(sesionAfiliado.get()).toBe('jwt-afiliado');
  });
});
