import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { session } from '../api';
import { FICHA, PLANES, TICKET } from '../test/fixtures';
import { mockApi, renderApp } from '../test/utils';

const conSesion = () => session.set('jwt');

describe('login y rutas protegidas', () => {
  it('redirige a login sin sesión y entra con credenciales', async () => {
    const fetch = mockApi({ 'POST /auth/login': { token: 'jwt' }, 'GET /clientes': [] });
    renderApp('/admin/clientes');
    await userEvent.type(await screen.findByLabelText('Email'), 'admin@orbita.local');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Todavía no hay clientes.')).toBeInTheDocument();
    expect(session.get()).toBe('jwt');
    expect(fetch.mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'Bearer jwt' });
  });

  it('muestra el error de credenciales', async () => {
    mockApi({ 'POST /auth/login': () => ({ status: 401, body: { error: 'Credenciales inválidas' } }) });
    renderApp('/admin/login');
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });
});

describe('panel del equipo', () => {
  it('lista clientes con estado del bot y del pago', async () => {
    conSesion();
    mockApi({
      'GET /clientes': [
        {
          id: 'pizzeria-norte',
          nombre: 'Pizzería Norte',
          plan: { id: 'turnos', nombre: 'Turnos' },
          canales: [{ tipo: 'whatsapp', etiqueta: 'WhatsApp del local' }],
          estado: 'pausado',
          pausaMotivo: 'impago',
          estadoPago: 'impago',
          vencimiento: null,
        },
      ],
    });
    renderApp('/admin/clientes');
    expect(await screen.findByRole('link', { name: 'Pizzería Norte' })).toHaveAttribute('href', '/admin/clientes/pizzeria-norte');
    expect(screen.getByText('pausado')).toBeInTheDocument();
    expect(screen.getByText('impago')).toBeInTheDocument();
  });

  it('alta muestra el precio según medio y crea la ficha', async () => {
    conSesion();
    let enviado: Record<string, unknown> = {};
    mockApi({
      'GET /planes': PLANES,
      'POST /clientes': (init: RequestInit) => {
        enviado = JSON.parse(String(init.body));
        return { status: 201, body: FICHA };
      },
      'GET /clientes/pizzeria-norte': FICHA,
      'GET /clientes/pizzeria-norte/uso': { dia: { usado: 0, tope: 1, reinicia: '2026-11-15' }, semana: { usado: 0, tope: 1, reinicia: '2026-11-16' }, mes: { usado: 0, tope: 1, reinicia: '2026-12-14' } },
      'GET /clientes/pizzeria-norte/turnos': [],
    });
    renderApp('/admin/clientes/nuevo');
    await userEvent.type(screen.getByLabelText('Nombre'), 'Pizzería Norte');
    expect(screen.getByLabelText('clientId')).toHaveValue('pizzeria-norte');
    await screen.findByRole('option', { name: 'Turnos' });
    expect(screen.queryByRole('option', { name: 'Personalizado' })).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Plan'), 'turnos');
    expect(screen.getByText(/84\.000/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('endpointId canal 1'), '54911');
    await userEvent.type(screen.getByLabelText('Token canal 1'), 'whatsapp-token-largo');
    await userEvent.type(screen.getByLabelText('Etiqueta canal 1'), 'WhatsApp');
    await userEvent.click(screen.getByRole('button', { name: /Agregar canal/ }));
    expect(screen.getByRole('button', { name: /Agregar canal \(2\/2\)/ })).toBeDisabled();
    await userEvent.click(screen.getAllByRole('button', { name: 'Quitar' })[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Crear cliente' }));

    expect(await screen.findByRole('heading', { name: 'Pizzería Norte' })).toBeInTheDocument();
    expect(enviado).toMatchObject({ clientId: 'pizzeria-norte', planId: 'turnos', medio: 'mercadopago', canales: [{ endpointId: '54911', token: 'whatsapp-token-largo' }] });
    expect(enviado).not.toHaveProperty('pageId');
  });

  it('la ficha muestra los bloques y ejecuta acciones', async () => {
    conSesion();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetch = mockApi({
      'GET /clientes/pizzeria-norte': FICHA,
      'GET /planes': PLANES,
      'GET /clientes/pizzeria-norte/uso': {
        dia: { usado: 10, tope: 400, reinicia: '2026-11-15' },
        semana: { usado: 1800, tope: 2000, reinicia: '2026-11-16' },
        mes: { usado: 8000, tope: 8000, reinicia: '2026-12-14' },
      },
      'GET /clientes/pizzeria-norte/turnos': [
        { id: 't1', nombre: 'Ana', fecha: '2026-11-20T23:30:00.000Z', estado: 'reservado', recordatorioEnviado: true },
      ],
      'POST /clientes/pizzeria-norte/pausar': { ...FICHA, estado: 'pausado', pausaMotivo: 'manual' },
      'PUT /clientes/pizzeria-norte/prompt': { ...FICHA, prompt: 'Nuevo' },
      'PATCH /clientes/pizzeria-norte': FICHA,
    });
    renderApp('/admin/clientes/pizzeria-norte');

    expect(await screen.findByText('Conectado')).toBeInTheDocument();
    expect(screen.getByLabelText('Token canal 1')).toHaveAttribute('placeholder', expect.stringContaining('****oken'));
    expect(screen.getByText(/\/api\/webhooks\/meta$/)).toBeInTheDocument();
    expect(screen.queryByText(/manychat/i)).not.toBeInTheDocument();
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('enviado')).toBeInTheDocument();
    expect(await screen.findByLabelText('Este mes')).toHaveAttribute('aria-valuenow', '100');

    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(await screen.findByText('(manual)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar' })).toBeEnabled();

    await userEvent.clear(screen.getByLabelText('Prompt'));
    await userEvent.type(screen.getByLabelText('Prompt'), 'Nuevo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar prompt' }));
    expect(await screen.findByText(/El próximo mensaje ya usa este texto/)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Nuevo plan'), 'turnos');
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar plan' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar textos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar canales' }));

    await waitFor(() => {
      const llamadas = fetch.mock.calls.map(([u, i]) => `${i?.method ?? 'GET'} ${String(u)}`);
      expect(llamadas).not.toContain('POST /api/clientes/pizzeria-norte/transferencia');
      expect(llamadas.filter((l) => l === 'PATCH /api/clientes/pizzeria-norte')).toHaveLength(3);
    });
  });

  it('gestiona tickets y los convierte en ficha', async () => {
    conSesion();
    let convertido: Record<string, unknown> = {};
    mockApi({
      'GET /tickets?tipo=ia_personalizada': [TICKET],
      'PATCH /tickets/t1': { ...TICKET, notas: 'ok' },
      'POST /tickets/t1/convertir': (init: RequestInit) => {
        convertido = JSON.parse(String(init.body));
        return { status: 201, body: { ...FICHA, id: 'ferreteria-sur' } };
      },
      'GET /clientes/ferreteria-sur': { ...FICHA, id: 'ferreteria-sur', nombre: 'Ferretería Sur' },
      'GET /clientes/ferreteria-sur/uso': { dia: { usado: 0, tope: 1, reinicia: '' }, semana: { usado: 0, tope: 1, reinicia: '' }, mes: { usado: 0, tope: 1, reinicia: '' } },
      'GET /clientes/ferreteria-sur/turnos': [],
      'GET /planes': PLANES,
    });
    renderApp('/admin/tickets');
    await userEvent.click(await screen.findByText('Ferretería Sur'));
    expect(screen.getByText('Bot con stock')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Notas internas'), 'ok');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar ticket' }));

    const form = screen.getByRole('heading', { name: /Contratar: plan Personalizado/ }).closest('form')!;
    expect(within(form).getByLabelText('clientId')).toHaveValue('ferreteria-sur');
    await userEvent.type(within(form).getByLabelText('endpointId canal 1'), 'ig-1');
    await userEvent.type(within(form).getByLabelText('Token canal 1'), 'instagram-token-largo');
    await userEvent.type(within(form).getByLabelText('Etiqueta canal 1'), 'Instagram');
    await userEvent.click(within(form).getByRole('button', { name: 'Crear ficha' }));

    expect(await screen.findByRole('heading', { name: 'Ferretería Sur' })).toBeInTheDocument();
    expect(convertido).toMatchObject({ clientId: 'ferreteria-sur', canales: [{ endpointId: 'ig-1', token: 'instagram-token-largo' }] });
    expect(convertido).not.toHaveProperty('pageId');
  });
});

describe('páginas públicas', () => {
  const base = {
    nombre: 'Pizzería Norte',
    plan: { id: 'turnos', nombre: 'Turnos' },
    importe: 80000,
    vencimiento: '2026-12-14T15:00:00.000Z',
    estadoPago: 'pendiente',
    estado: 'activo',
    uso: { mes: 120, tope: 4000, reinicia: '2026-12-14' },
    diasGracia: 7,
  };

  it('la página pública no muestra datos de transferencia', async () => {
    mockApi({
      'GET /publico/tok': { ...base, medio: 'mercadopago', mercadopago: null, transferencia: { alias: 'orbita.alias', importe: 80000, concepto: 'pizzeria-norte' } },
    });
    renderApp('/p/tok');
    expect(await screen.findByText('Pizzería Norte')).toBeInTheDocument();
    expect(screen.queryByText('orbita.alias')).not.toBeInTheDocument();
    expect(screen.queryByText(/Plan Mensajes|Cambiar plan/)).not.toBeInTheDocument();
  });

  it('cliente con Mercado Pago aprueba el débito', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign, pathname: '/p/tok' });
    mockApi({
      'GET /publico/tok': { ...base, medio: 'mercadopago', transferencia: null, mercadopago: { initPoint: null, requiereEmail: true, habilitado: true } },
      'POST /publico/tok/suscripcion': { initPoint: 'https://mp.test/init' },
    });
    renderApp('/p/tok');
    await userEvent.type(await screen.findByLabelText('Email de tu cuenta de Mercado Pago'), 'duenio@pizza.com');
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar débito automático' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://mp.test/init'));
  });

  it('el formulario de contacto crea un ticket', async () => {
    let body: Record<string, unknown> = {};
    mockApi({
      'POST /publico/contacto': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { status: 201, body: { ok: true } };
      },
    });
    renderApp('/contacto');
    expect(screen.queryByLabelText(/Teléfono/)).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nombre'), 'Laura');
    await userEvent.type(screen.getByLabelText('Email'), 'laura@ferre.com');
    await userEvent.type(screen.getByLabelText('Empresa'), 'Ferretería Sur');
    await userEvent.type(screen.getByLabelText('Rubro'), 'Ferretería');
    await userEvent.type(screen.getByLabelText('¿Qué necesitás?'), 'Un bot que consulte stock');
    expect(screen.getByRole('button', { name: 'Enviar consulta' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar consulta' }));
    expect(await screen.findByText('¡Gracias!')).toBeInTheDocument();
    expect(body).toMatchObject({ empresa: 'Ferretería Sur', website: '', aceptaPrivacidad: true });
    expect(body.telefono).toBeUndefined();
  });
});
