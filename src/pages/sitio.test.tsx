import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { session, sesionCliente } from '../api';
import { FICHA, METRICAS, PLANES, TICKET } from '../test/fixtures';
import { mockApi, renderApp } from '../test/utils';

const PUBLICOS = PLANES.filter((p) => p.id !== 'personalizado');

describe('sitio público', () => {
  it('la landing muestra planes por medio de pago y lleva al registro', async () => {
    mockApi({ 'GET /publico/planes': PUBLICOS });
    renderApp('/');
    expect(screen.getByRole('heading', { level: 1, name: /responde al instante/ })).toBeInTheDocument();
    const elegir = await screen.findByRole('link', { name: 'Elegir Turnos' });
    expect(elegir).toHaveAttribute('href', '/registro?plan=turnos');
    expect(screen.getByText(/84\.000/)).toBeInTheDocument();
    expect(screen.queryByText('Telegram')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Transferencia' })).not.toBeInTheDocument();
    expect(screen.getByText('El más elegido')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /plan personalizado/ })).toHaveAttribute('href', '/contacto');
    expect(screen.getByRole('link', { name: 'Probá la demo gratis' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'Empezar' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'Botón de arrepentimiento' })).toHaveAttribute('href', '/arrepentimiento');
  });

  it('la demo de la landing lleva al panel si ya hay sesión', async () => {
    sesionCliente.set('jwt');
    mockApi({ 'GET /publico/planes': PUBLICOS });
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'Probá la demo gratis' })).toHaveAttribute('href', '/cuenta/demo');
  });

  it('términos y privacidad muestran las cláusulas clave y la versión vigente', () => {
    mockApi({});
    renderApp('/terminos');
    expect(screen.getByRole('heading', { name: 'Términos y Condiciones del Servicio' })).toBeInTheDocument();
    expect(screen.getByText(/Versión 2026-11-14/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '15. Limitación de responsabilidad' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '16. Indemnidad' })).toBeInTheDocument();
    expect(screen.getAllByText(/encargado del tratamiento/).length).toBeGreaterThan(0);
  });

  it('la política de privacidad incluye la leyenda obligatoria de la AAIP', () => {
    mockApi({});
    renderApp('/privacidad');
    expect(screen.getByText(/AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA/)).toBeInTheDocument();
    expect(screen.getByText(/No vendemos ni alquilamos datos personales/)).toBeInTheDocument();
  });

  it('el botón de arrepentimiento exige privacidad y devuelve el código de trámite', async () => {
    let body: Record<string, unknown> = {};
    mockApi({
      'POST /publico/arrepentimiento': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { status: 201, body: { ok: true, codigo: 'abc-123' } };
      },
    });
    renderApp('/arrepentimiento');
    await userEvent.type(screen.getByLabelText('Nombre y apellido'), 'Sofía Pérez');
    await userEvent.type(screen.getByLabelText('Email con el que te registraste'), 'sofia@luna.com');
    expect(screen.getByRole('button', { name: 'Revocar contratación' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Revocar contratación' }));
    expect(await screen.findByText('abc-123')).toBeInTheDocument();
    expect(body).toMatchObject({ nombre: 'Sofía Pérez', aceptaPrivacidad: true });
    expect(body.negocio).toBeUndefined();
  });

  it('rutas desconocidas vuelven a la landing y /login va al panel del equipo', async () => {
    mockApi({ 'GET /publico/planes': PUBLICOS });
    renderApp('/no-existe');
    expect(await screen.findByRole('heading', { level: 1, name: /responde al instante/ })).toBeInTheDocument();
  });
});

describe('panel del equipo: resumen y cuentas', () => {
  it('muestra KPIs, gráficos y alertas', async () => {
    session.set('jwt');
    mockApi({ 'GET /admin/metricas': METRICAS });
    renderApp('/admin');
    expect(await screen.findByText('Resumen del negocio')).toBeInTheDocument();
    expect(screen.getAllByText(/160\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('Abiertos (responder en 24 h)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pizzería Norte' })).toHaveAttribute('href', '/admin/clientes/pizzeria-norte');
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bar Sur' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Gráfico de barras' })).toHaveLength(2);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('sin sesión de equipo redirige al login del panel', async () => {
    mockApi({});
    renderApp('/admin');
    expect(await screen.findByText('Panel del equipo')).toBeInTheDocument();
  });

  it('invita a un cliente sin cuenta y genera link de restablecimiento para uno con cuenta', async () => {
    session.set('jwt');
    let invitacion: Record<string, unknown> = {};
    const uso = { dia: { usado: 0, tope: 1, reinicia: '' }, semana: { usado: 0, tope: 1, reinicia: '' }, mes: { usado: 0, tope: 1, reinicia: '' } };
    mockApi({
      'GET /clientes/pizzeria-norte': FICHA,
      'GET /planes': PLANES,
      'GET /clientes/pizzeria-norte/uso': uso,
      'GET /clientes/pizzeria-norte/turnos': [],
      'POST /clientes/pizzeria-norte/acceso': (init: RequestInit) => {
        invitacion = JSON.parse(String(init.body));
        return { status: 201, body: { link: 'https://orbita.test/restablecer/tok', expira: '2026-11-15T15:00:00.000Z' } };
      },
    });
    renderApp('/admin/clientes/pizzeria-norte');
    await userEvent.type(await screen.findByLabelText('Email del cliente'), 'marta@pizza.com');
    await userEvent.type(screen.getByLabelText('Nombre del cliente'), 'Marta');
    await userEvent.click(screen.getByRole('button', { name: 'Invitar al panel' }));
    expect(await screen.findByText('https://orbita.test/restablecer/tok')).toBeInTheDocument();
    expect(invitacion).toEqual({ email: 'marta@pizza.com', nombre: 'Marta' });
  });

  it('muestra la cuenta existente y pide el link de reset', async () => {
    session.set('jwt');
    const uso = { dia: { usado: 0, tope: 1, reinicia: '' }, semana: { usado: 0, tope: 1, reinicia: '' }, mes: { usado: 0, tope: 1, reinicia: '' } };
    mockApi({
      'GET /clientes/pizzeria-norte': {
        ...FICHA,
        usuario: { id: 'u1', email: 'marta@pizza.com', nombre: 'Marta', ultimoLogin: null, createdAt: '2026-11-01T15:00:00.000Z' },
      },
      'GET /planes': PLANES,
      'GET /clientes/pizzeria-norte/uso': uso,
      'GET /clientes/pizzeria-norte/turnos': [],
      'POST /clientes/pizzeria-norte/reset-password': { link: 'https://orbita.test/restablecer/otro', expira: '2026-11-15T15:00:00.000Z' },
    });
    renderApp('/admin/clientes/pizzeria-norte');
    expect(await screen.findByText(/Marta · marta@pizza.com/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Generar link para restablecer contraseña' }));
    expect(await screen.findByText('https://orbita.test/restablecer/otro')).toBeInTheDocument();
  });

  it('filtra tickets de arrepentimiento y no ofrece convertirlos', async () => {
    session.set('jwt');
    const fetch = mockApi({
      'GET /tickets?tipo=ia_personalizada': [],
      'GET /tickets?tipo=arrepentimiento': [{ ...TICKET, id: 'a1', tipo: 'arrepentimiento', empresa: 'Peluquería Luna' }],
    });
    renderApp('/admin/tickets');
    await userEvent.selectOptions(screen.getByLabelText('Tipo de ticket'), 'arrepentimiento');
    await userEvent.click(await screen.findByText('Peluquería Luna'));
    expect(screen.getByText(/respondé dentro de las 24 h/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Contratar/ })).not.toBeInTheDocument();
    await waitFor(() => expect(fetch.mock.calls.some(([u]) => String(u).includes('tipo=arrepentimiento'))).toBe(true));
    vi.restoreAllMocks();
  });
});
