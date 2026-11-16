import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sesionCliente } from '../api';
import { cuenta, PLANES } from '../test/fixtures';
import { mockApi, renderApp } from '../test/utils';
import type { Cuenta } from '../types';

const PUBLICOS = PLANES.filter((p) => p.id !== 'personalizado');
const USO = {
  dia: { usado: 5, tope: 200, reinicia: '2026-11-15' },
  semana: { usado: 20, tope: 1000, reinicia: '2026-11-16' },
  mes: { usado: 120, tope: 4000, reinicia: '2026-12-14' },
};
const conSesion = () => sesionCliente.set('jwt-cliente');
const lista = (c: Cuenta) => ({ ...c, onboarding: { ...c.onboarding, completado: '2026-11-14T15:00:00.000Z', requisitos: { pago: true, canal: true, prompt: true } }, negocio: { ...c.negocio, estado: 'activo' as const, pausaMotivo: null } });

describe('registro y acceso del cliente', () => {
  it('registra con plan preseleccionado, exige aceptar los documentos y muestra el pago', async () => {
    let body: Record<string, unknown> = {};
    mockApi({
      'GET /publico/planes': PUBLICOS,
      'POST /cuenta/registro': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { status: 201, body: { token: 'jwt-nuevo' } };
      },
      'GET /cuenta/me': cuenta({
        suscripcion: { medio: 'mercadopago', estadoPago: 'pendiente', vencimiento: '2026-11-14T15:00:00.000Z', importe: 115000, mpInitPoint: null },
        transferencia: null,
        onboarding: { paso: 0, completado: null, requisitos: { pago: false, canal: false, prompt: false } },
      }),
    });
    renderApp('/registro?plan=completo');
    expect(await screen.findByRole('option', { name: /Completo/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Plan')).toHaveValue('completo');
    await userEvent.type(screen.getByLabelText('Nombre del negocio'), 'Peluquería Luna');
    await userEvent.type(screen.getByLabelText('Rubro'), 'Estética');
    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Sofía Pérez');
    await userEvent.type(screen.getByLabelText('Email'), 'sofia@luna.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'clave-segura-1');
    const crear = screen.getByRole('button', { name: 'Crear mi cuenta' });
    expect(crear).toBeDisabled();
    const [terminos, privacidad] = screen.getAllByRole('checkbox');
    await userEvent.click(terminos);
    expect(crear).toBeDisabled();
    await userEvent.click(privacidad);
    await userEvent.click(crear);

    expect(await screen.findByText(/Bienvenido a Orbita, Sofía/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar con Mercado Pago' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi IA' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Mi IA' }));
    expect(await screen.findByText(/Esta parte se habilita cuando se acredita el pago/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
    expect(body).toMatchObject({ planId: 'completo', medio: 'mercadopago', aceptaTerminos: true, aceptaPrivacidad: true });
    expect(sesionCliente.get()).toBe('jwt-nuevo');
  });

  it('registra sin plan por defecto y pide elegirlo antes de pagar', async () => {
    let body: Record<string, unknown> = {};
    const pendiente = {
      suscripcion: { medio: 'mercadopago' as const, estadoPago: 'pendiente' as const, vencimiento: '2026-11-14T15:00:00.000Z', importe: 42000, mpInitPoint: null },
      onboarding: { paso: 0, completado: null, requisitos: { pago: false, canal: false, prompt: false } },
    };
    let elegido = false;
    mockApi({
      'GET /publico/planes': PUBLICOS,
      'POST /cuenta/registro': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { status: 201, body: { token: 'jwt-nuevo' } };
      },
      'GET /cuenta/me': () => ({ body: cuenta({ ...pendiente, planElegido: elegido }) }),
      'PATCH /cuenta/plan': () => {
        elegido = true;
        return { body: cuenta({ ...pendiente, planElegido: true }) };
      },
    });
    renderApp('/registro');
    await screen.findByRole('option', { name: /Completo/ });
    expect(screen.getByLabelText('Plan')).toHaveValue('');
    await userEvent.type(screen.getByLabelText('Nombre del negocio'), 'Peluquería Luna');
    await userEvent.type(screen.getByLabelText('Rubro'), 'Estética');
    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Sofía Pérez');
    await userEvent.type(screen.getByLabelText('Email'), 'sofia@luna.com');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'clave-segura-1');
    for (const c of screen.getAllByRole('checkbox')) await userEvent.click(c);
    await userEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }));

    expect(await screen.findByText(/Todavía no elegiste un plan/)).toBeInTheDocument();
    expect(body.planId).toBeUndefined();
    expect(screen.queryByRole('button', { name: 'Pagar con Mercado Pago' })).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText('Elegir plan'), 'turnos');
    await userEvent.click(screen.getByRole('button', { name: 'Elegir plan' }));
    expect(await screen.findByRole('button', { name: 'Pagar con Mercado Pago' })).toBeInTheDocument();
  });

  it('continúa con Google sin completar el formulario y sin plan', async () => {
    const assign = vi.fn();
    const ubicacion = window.location;
    const ponerUbicacion = (valor: Location) => {
      Object.defineProperty(window, 'location', { configurable: true, value: valor });
    };
    ponerUbicacion({ ...ubicacion, assign } as unknown as Location);
    let body: unknown;
    mockApi({
      'GET /publico/planes': PUBLICOS,
      'POST /cuenta/google/iniciar': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { body: { url: 'https://accounts.google.com/o/oauth2/auth?x=1' } };
      },
    });
    renderApp('/registro');
    try {
      const boton = await screen.findByRole('button', { name: 'Continuar con Google' });
      expect(boton).toBeEnabled();
      await userEvent.click(boton);
      await waitFor(() => expect(body).toEqual({ modo: 'registro' }));
      expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/auth?x=1');
    } finally {
      ponerUbicacion(ubicacion);
    }
  });

  it('ingresa, muestra errores y separa la sesión del panel del equipo', async () => {
    let intentos = 0;
    const fetch = mockApi({
      'POST /cuenta/login': () => {
        intentos += 1;
        return intentos === 1 ? { status: 401, body: { error: 'Email o contraseña incorrectos' } } : { body: { token: 'jwt-c' } };
      },
      'GET /cuenta/me': lista(cuenta()),
      'GET /cuenta/uso': USO,
      'GET /cuenta/turnos': [],
    });
    renderApp('/ingresar');
    await userEvent.type(screen.getByLabelText('Email'), 'sofia@luna.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('Email o contraseña incorrectos')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('Respondiendo mensajes')).toBeInTheDocument();
    expect(localStorage.getItem('orbita.token')).toBeNull();
    const me = fetch.mock.calls.find(([u]) => String(u) === '/api/cuenta/me');
    expect(me?.[1]?.headers).toMatchObject({ Authorization: 'Bearer jwt-c' });
  });

  it('restablece la contraseña con el link', async () => {
    let body: Record<string, unknown> = {};
    mockApi({
      'POST /cuenta/restablecer': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { body: { ok: true } };
      },
    });
    renderApp('/restablecer/tok-123');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'nueva-clave-1');
    await userEvent.type(screen.getByLabelText('Repetila'), 'otra');
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Repetila'));
    await userEvent.type(screen.getByLabelText('Repetila'), 'nueva-clave-1');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByText('Ya podés ingresar con tu nueva contraseña.')).toBeInTheDocument();
    expect(body).toEqual({ token: 'tok-123', password: 'nueva-clave-1' });
  });

  it('sin sesión de cliente redirige a ingresar', async () => {
    mockApi({});
    renderApp('/cuenta');
    expect(await screen.findByRole('heading', { name: 'Volvé a Orbita' })).toBeInTheDocument();
  });

  it('bloquea con el modal legal hasta aceptar la nueva versión', async () => {
    conSesion();
    mockApi({
      'GET /cuenta/me': lista(cuenta({ legalPendiente: ['terminos'] })),
      'GET /cuenta/uso': USO,
      'GET /cuenta/turnos': [],
      'POST /cuenta/legal/aceptar': lista(cuenta()),
    });
    renderApp('/cuenta');
    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByRole('link', { name: 'Términos y Condiciones' })).toHaveAttribute('href', '/terminos');
    await userEvent.click(within(modal).getByRole('button', { name: 'Leí y acepto' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('con Mercado Pago lleva a aprobar el débito', async () => {
    conSesion();
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign, pathname: '/cuenta' });
    mockApi({
      'GET /cuenta/me': cuenta({
        suscripcion: { medio: 'mercadopago', estadoPago: 'pendiente', vencimiento: '2026-11-14T15:00:00.000Z', importe: 84000, mpInitPoint: null },
        transferencia: null,
        onboarding: { paso: 0, completado: null, requisitos: { pago: false, canal: false, prompt: false } },
      }),
      'POST /cuenta/suscripcion': { initPoint: 'https://mp.test/pre' },
    });
    renderApp('/cuenta');
    await userEvent.click(await screen.findByRole('button', { name: 'Pagar con Mercado Pago' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://mp.test/pre'));
  });
});

describe('tutorial por plan', () => {
  const titulos = async () => {
    const aside = (await screen.findByText(/Paso 1 de/)).closest('aside')!;
    return within(aside)
      .getAllByRole('button')
      .map((b) => b.textContent);
  };

  it('el plan Mensajes no incluye turnos ni recordatorios', async () => {
    conSesion();
    mockApi({ 'GET /cuenta/me': cuenta({}, PLANES[0]) });
    renderApp('/cuenta');
    expect(await titulos()).toEqual(['Bienvenida', 'Tu negocio', 'Estilo y preguntas', 'Conectar tus canales', 'Integración web', 'Mensajes fijos', 'Probá tu IA', 'Activar']);
  });

  it('el plan Completo suma turnos y recordatorios', async () => {
    conSesion();
    mockApi({ 'GET /cuenta/me': cuenta({}, PLANES[2]) });
    renderApp('/cuenta');
    const t = await titulos();
    expect(t).toContain('Turnos');
    expect(t).toContain('Recordatorios');
    expect(screen.getByText(/Modelo de IA más capaz/)).toBeInTheDocument();
  });

  it('el plan Personalizado suma el paso del equipo', async () => {
    conSesion();
    mockApi({ 'GET /cuenta/me': cuenta({}, PLANES[3]) });
    renderApp('/cuenta');
    expect((await titulos())[1]).toBe('Tu equipo de Orbita');
  });

  it('recorre los pasos guardando el perfil y el progreso', async () => {
    conSesion();
    const base = cuenta();
    const llamadas: { key: string; body: Record<string, unknown> }[] = [];
    let servidor = base;
    const registrar = (key: string, respuesta?: Cuenta) => (init: RequestInit) => {
      llamadas.push({ key, body: JSON.parse(String(init.body ?? '{}')) });
      servidor = respuesta ?? servidor;
      return { body: servidor };
    };
    const conPerfil = { ...base, negocio: { ...base.negocio, perfil: { descripcion: 'Peluquería de barrio con 10 años.', productos: '', horarios: '', ubicacion: '', pagosEnvios: '', tono: 'cercano' as const, derivar: '', preguntas: [] } } };
    mockApi({
      'GET /cuenta/me': base,
      'POST /cuenta/onboarding': registrar('onboarding'),
      'PUT /cuenta/perfil': registrar('perfil', conPerfil),
    });
    renderApp('/cuenta');
    await userEvent.click(await screen.findByRole('button', { name: 'Empezar' }));
    await userEvent.type(screen.getByLabelText('¿Qué hace tu negocio?'), 'Peluquería de barrio con 10 años.');
    await userEvent.type(screen.getByLabelText('Horarios de atención'), 'Martes a sábado');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));

    expect(await screen.findByLabelText('¿Qué servicios se reservan con turno?')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('¿Qué servicios se reservan con turno?'), 'Corte');
    await userEvent.clear(screen.getByLabelText('Duración de cada turno (minutos)'));
    await userEvent.type(screen.getByLabelText('Duración de cada turno (minutos)'), '45');
    expect(screen.getByLabelText('Duración de cada turno (minutos)')).toHaveValue(45);
    expect(screen.getByRole('button', { name: 'Guardar y seguir' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));

    expect(await screen.findByText('¿Cómo querés que hable?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /Formal/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar pregunta' }));
    await userEvent.type(screen.getByLabelText('Pregunta 1'), '¿Tienen estacionamiento?');
    await userEvent.type(screen.getByLabelText('Respuesta 1'), 'Sí, en la esquina.');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar pregunta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
    expect(await screen.findByRole('heading', { name: 'Conectar tus canales' })).toBeInTheDocument();

    const perfiles = llamadas.filter((l) => l.key === 'perfil').map((l) => l.body);
    expect(perfiles[0]).toMatchObject({ descripcion: 'Peluquería de barrio con 10 años.', horarios: 'Martes a sábado' });
    expect(perfiles[1]).toMatchObject({ turnos: { servicios: 'Corte', duracionMin: 45 } });
    expect(perfiles[2]).toMatchObject({ tono: 'formal', preguntas: [{ pregunta: '¿Tienen estacionamiento?', respuesta: 'Sí, en la esquina.' }] });
    expect(llamadas.filter((l) => l.key === 'onboarding').map((l) => l.body.paso)).toEqual([1, 2, 3, 4]);

    await userEvent.click(screen.getByRole('button', { name: '← Volver' }));
    expect(screen.getByRole('heading', { name: 'Estilo y preguntas' })).toBeInTheDocument();
  });

  it('conecta un canal con su token, muestra la guía y carga los textos', async () => {
    conSesion();
    const base = cuenta({ onboarding: { paso: 4, completado: null, requisitos: { pago: true, canal: false, prompt: true } } });
    const conectada = {
      ...base,
      canales: [{ tipo: 'instagram' as const, endpointId: '1784140', etiqueta: 'Instagram', conectado: true, tokenMask: '****argo' }],
      onboarding: { ...base.onboarding, requisitos: { ...base.onboarding.requisitos, canal: true } },
    };
    let canales: unknown = null;
    let textos: unknown = null;
    mockApi({
      'GET /cuenta/me': base,
      'POST /cuenta/onboarding': conectada,
      'PUT /cuenta/canales': (init: RequestInit) => {
        canales = JSON.parse(String(init.body));
        return { body: conectada };
      },
      'PATCH /cuenta/textos': (init: RequestInit) => {
        textos = JSON.parse(String(init.body));
        return { body: conectada };
      },
    });
    renderApp('/cuenta');
    expect(await screen.findByRole('heading', { name: 'Conectar tus canales' })).toBeInTheDocument();
    expect(screen.queryByText(/manychat/i)).not.toBeInTheDocument();
    expect(screen.getByText('Sin token')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp', { selector: 'summary' })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Tipo canal 1'), 'instagram');
    expect(screen.getByText('ID de la cuenta de Instagram')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('endpointId canal 1'), '1784140');
    await userEvent.type(screen.getByLabelText('Token canal 1'), 'token-instagram-largo');
    await userEvent.type(screen.getByLabelText('Etiqueta canal 1'), 'Instagram');
    expect(screen.getByRole('button', { name: /Agregar canal \(1\/2\)/ })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
    expect(await screen.findByRole('heading', { name: 'Integración web' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ahora no, seguir' }));
    expect(await screen.findByLabelText(/^Mensaje al pasar con una persona/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Recordatorio de turno/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
    await screen.findByRole('heading', { name: 'Probá tu IA' });

    expect(canales).toEqual({ canales: [{ tipo: 'instagram', endpointId: '1784140', etiqueta: 'Instagram', token: 'token-instagram-largo' }] });
    expect(Object.keys(textos as object)).toEqual(['espera', 'tope', 'handoff']);
  });

  it('activa la integración web y muestra el código para pegar y la API', async () => {
    conSesion();
    const base = lista(cuenta());
    const conWeb = {
      ...base,
      web: {
        activa: true,
        clave: 'web_clave123',
        origenes: ['mitienda.com'],
        bienvenida: null,
        color: '#ff0066',
        endpoint: 'https://orbita.test/api/web/web_clave123/mensajes',
        script: '<script src="https://orbita.test/api/web/widget.js" data-clave="web_clave123" async></script>',
      },
    };
    let body: unknown = null;
    mockApi({
      'GET /cuenta/me': base,
      'PUT /cuenta/web': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { body: conWeb };
      },
    });
    renderApp('/cuenta/conexion');
    expect(await screen.findByLabelText('Integración web activa')).toBeChecked();
    await userEvent.type(screen.getByLabelText(/^Dominios permitidos/), 'https://www.mitienda.com{enter}mitienda.mitiendanube.com');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar integración web' }));
    expect(await screen.findByText(conWeb.web.script)).toBeInTheDocument();
    expect(screen.getByText(`POST ${conWeb.web.endpoint}`)).toBeInTheDocument();
    expect(screen.getByText('Shopify', { selector: 'summary' })).toBeInTheDocument();
    expect(body).toMatchObject({ activa: true, origenes: ['https://www.mitienda.com', 'mitienda.mitiendanube.com'], color: '#5b4cf0' });
  });

  it('editar un canal conectado sin pegar token no lo manda', async () => {
    conSesion();
    const c = lista(cuenta({ canales: [{ tipo: 'whatsapp', endpointId: 'PN-1', etiqueta: 'WhatsApp', conectado: true, tokenMask: '****1234' }] }));
    let canales: unknown = null;
    mockApi({
      'GET /cuenta/me': c,
      'PUT /cuenta/canales': (init: RequestInit) => {
        canales = JSON.parse(String(init.body));
        return { body: c };
      },
    });
    renderApp('/cuenta/conexion');
    expect(await screen.findByText('Conectado')).toBeInTheDocument();
    expect(screen.getByLabelText('Token canal 1')).toHaveAttribute('placeholder', expect.stringContaining('****1234'));
    await userEvent.clear(screen.getByLabelText('Etiqueta canal 1'));
    await userEvent.type(screen.getByLabelText('Etiqueta canal 1'), 'WhatsApp del local');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar canales' }));
    await waitFor(() => expect(canales).toEqual({ canales: [{ tipo: 'whatsapp', endpointId: 'PN-1', etiqueta: 'WhatsApp del local' }] }));
  });

  it('el simulador muestra respuestas y acciones sin efectos', async () => {
    conSesion();
    let body: Record<string, unknown> = {};
    mockApi({
      'GET /cuenta/me': cuenta({ onboarding: { paso: 7, completado: null, requisitos: { pago: true, canal: true, prompt: true } } }),
      'POST /cuenta/probar': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { body: { texto: '¡Listo! Te agendé.', handoff: false, acciones: ['Reservaría un turno el 2026-11-15 10:00'] } };
      },
    });
    renderApp('/cuenta');
    await userEvent.click(await screen.findByRole('button', { name: 'Quiero un turno para mañana a las 10' }));
    expect(await screen.findByText('¡Listo! Te agendé.')).toBeInTheDocument();
    expect(screen.getByText('Reservaría un turno el 2026-11-15 10:00')).toBeInTheDocument();
    expect(body).toEqual({ texto: 'Quiero un turno para mañana a las 10', historial: [] });
    await userEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.queryByText('¡Listo! Te agendé.')).not.toBeInTheDocument();
  });

  it('activa la IA cuando están todos los requisitos y muestra el resumen', async () => {
    conSesion();
    const base = cuenta({ onboarding: { paso: 9, completado: null, requisitos: { pago: true, canal: false, prompt: true } } });
    mockApi({
      'GET /cuenta/me': base,
      'POST /cuenta/onboarding/completar': lista(base),
      'GET /cuenta/uso': USO,
      'GET /cuenta/turnos': [{ id: 't1', nombre: 'Ana', fecha: '2026-11-20T13:00:00.000Z', estado: 'reservado', recordatorioEnviado: false }],
      'PUT /cuenta/canales': { ...base, onboarding: { ...base.onboarding, requisitos: { ...base.onboarding.requisitos, canal: true } } },
      'POST /cuenta/onboarding': base,
    });
    renderApp('/cuenta');
    expect(await screen.findByRole('heading', { name: 'Activar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar mi IA' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Completar' }));
    expect(await screen.findByRole('heading', { name: 'Conectar tus canales' })).toBeInTheDocument();
  });

  it('activar con todo listo lleva al resumen con uso y turnos', async () => {
    conSesion();
    const base = cuenta({ onboarding: { paso: 9, completado: null, requisitos: { pago: true, canal: true, prompt: true } } });
    mockApi({
      'GET /cuenta/me': base,
      'POST /cuenta/onboarding/completar': lista(base),
      'GET /cuenta/uso': USO,
      'GET /cuenta/turnos': [{ id: 't1', nombre: 'Ana', fecha: '2026-11-20T13:00:00.000Z', estado: 'reservado', recordatorioEnviado: false }],
    });
    renderApp('/cuenta');
    await userEvent.click(await screen.findByRole('button', { name: 'Activar mi IA' }));
    expect(await screen.findByText('Respondiendo mensajes')).toBeInTheDocument();
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(await screen.findByLabelText('Este período')).toHaveAttribute('aria-valuenow', '3');
    expect(screen.getByRole('link', { name: 'Agenda' })).toBeInTheDocument();
  });
});

describe('demo', () => {
  const sinPago = () =>
    cuenta({
      suscripcion: { medio: 'mercadopago', estadoPago: 'pendiente', vencimiento: '2026-11-14T15:00:00.000Z', importe: 84000, mpInitPoint: null },
      onboarding: { paso: 0, completado: null, requisitos: { pago: false, canal: false, prompt: false } },
    });
  const DEMO = {
    negocio: 'Peluquería Luna',
    config: { negocio: '', funciones: ['horarios', 'derivar'], horarios: '', tono: 'cercano' },
    mensajes: 0,
    fuentes: [],
    limites: { fuentes: 6, megas: 5, caracteresTotal: 60000 },
    usados: 0,
  };
  const EJEMPLO = {
    ...DEMO,
    negocio: 'Tienda Andes',
    config: { negocio: 'Tienda Andes', funciones: ['stock', 'horarios', 'pedidos', 'derivar'], horarios: 'Lunes a viernes de 10 a 20', tono: 'cercano' },
    fuentes: [
      { id: 'f1', tipo: 'tabla', nombre: 'stock.tsv', caracteres: 400, filas: 12, createdAt: '2026-11-16T15:00:00.000Z', columnas: ['producto', 'stock'], muestra: [['Remera básica', '8']] },
    ],
    usados: 400,
  };

  it('una cuenta sin pagar la encuentra desde el inicio y las secciones bloqueadas', async () => {
    conSesion();
    mockApi({ 'GET /cuenta/me': sinPago(), 'GET /publico/planes': PUBLICOS });
    renderApp('/cuenta');
    expect(await screen.findByRole('link', { name: /Abrir la demo/ })).toHaveAttribute('href', '/cuenta/demo');
    await userEvent.click(screen.getByRole('link', { name: 'Probar' }));
    expect(await screen.findByRole('link', { name: 'Probar la demo' })).toHaveAttribute('href', '/cuenta/demo');
  });

  it('carga el ejemplo, prende funciones y responde con acciones', async () => {
    conSesion();
    let config: unknown = null;
    let chat: unknown = null;
    mockApi({
      'GET /cuenta/me': sinPago(),
      'GET /cuenta/demo': DEMO,
      'POST /cuenta/demo/ejemplo': EJEMPLO,
      'PUT /cuenta/demo': (init: RequestInit) => {
        config = JSON.parse(String(init.body));
        return { body: { ...EJEMPLO, config: { ...EJEMPLO.config, funciones: [...EJEMPLO.config.funciones, 'turnos'] } } };
      },
      'POST /cuenta/demo/chat': (init: RequestInit) => {
        chat = JSON.parse(String(init.body));
        return { body: { texto: 'Sí, te separo una.', handoff: false, acciones: ['Separaría 1 × Remera básica'] } };
      },
    });
    renderApp('/cuenta/demo');
    expect(await screen.findByText('Todavía no cargaste información')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Usar datos de ejemplo' }));
    expect(await screen.findByText('stock.tsv')).toBeInTheDocument();
    expect(screen.getByText('Planilla · 12 filas')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Stock y precios/ })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('switch', { name: /Turnos/ }));
    await waitFor(() => expect(config).toMatchObject({ funciones: ['stock', 'horarios', 'pedidos', 'derivar', 'turnos'], negocio: 'Tienda Andes' }));
    expect(await screen.findByRole('switch', { name: /Turnos/ })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('button', { name: '¿Tienen Remera básica?' }));
    expect(await screen.findByText('Sí, te separo una.')).toBeInTheDocument();
    expect(screen.getByText('Separaría 1 × Remera básica')).toBeInTheDocument();
    expect(chat).toEqual({ texto: '¿Tienen Remera básica?', historial: [] });
    expect(screen.getByRole('link', { name: 'Activar mi plan' })).toHaveAttribute('href', '/cuenta/plan');
  });
});

describe('panel del cliente', () => {
  it('pausa y vuelve a activar su IA', async () => {
    conSesion();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const activa = lista(cuenta());
    mockApi({
      'GET /cuenta/me': activa,
      'GET /cuenta/uso': USO,
      'GET /cuenta/turnos': [],
      'POST /cuenta/pausar': { ...activa, negocio: { ...activa.negocio, estado: 'pausado', pausaMotivo: 'manual' } },
      'POST /cuenta/activar': activa,
    });
    renderApp('/cuenta');
    await userEvent.click(await screen.findByRole('button', { name: 'Pausar' }));
    expect(await screen.findByText('Pausada')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Activar' }));
    expect(await screen.findByText('Respondiendo mensajes')).toBeInTheDocument();
  });

  it('edita su IA y las instrucciones avanzadas', async () => {
    conSesion();
    let prompt: unknown = null;
    const completo = cuenta({}, PLANES[2]);
    const c = lista({ ...completo, negocio: { ...completo.negocio, prompt: '### Qué hacemos' } });
    mockApi({
      'GET /cuenta/me': c,
      'PUT /cuenta/prompt': (init: RequestInit) => {
        prompt = JSON.parse(String(init.body));
        return { body: c };
      },
    });
    renderApp('/cuenta/ia');
    expect(await screen.findByLabelText(/^Recordatorio de turno/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    await userEvent.type(screen.getByLabelText('Instrucciones'), ' extra');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar instrucciones' }));
    expect(await screen.findByText(/Guardado\./)).toBeInTheDocument();
    expect(prompt).toEqual({ prompt: '### Qué hacemos extra' });
  });

  it('cambia de plan y ve el historial de pagos', async () => {
    conSesion();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let body: unknown = null;
    const c = lista(cuenta());
    mockApi({
      'GET /cuenta/me': c,
      'GET /publico/planes': PUBLICOS,
      'GET /cuenta/pagos': [{ id: 'p1', medio: 'transferencia', importe: 80000, periodo: '2026-11', createdAt: '2026-11-14T15:00:00.000Z' }],
      'PATCH /cuenta/plan': (init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return { body: c };
      },
    });
    renderApp('/cuenta/plan');
    expect(await screen.findByText('2026-11')).toBeInTheDocument();
    expect(screen.getByText('Tu pago está al día. ¡Gracias!')).toBeInTheDocument();
    await screen.findByRole('option', { name: /Completo/ });
    await userEvent.selectOptions(screen.getByLabelText('Plan'), 'completo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambio' }));
    await waitFor(() => expect(body).toEqual({ planId: 'completo' }));
  });

  it('el plan Personalizado no se cambia desde el panel', async () => {
    conSesion();
    mockApi({ 'GET /cuenta/me': lista(cuenta({}, PLANES[3])), 'GET /publico/planes': PUBLICOS, 'GET /cuenta/pagos': [] });
    renderApp('/cuenta/plan');
    expect(await screen.findByText(/Tu plan es Personalizado/)).toBeInTheDocument();
    expect(await screen.findByText('Todavía no hay pagos registrados.')).toBeInTheDocument();
  });

  it('conexión, prueba y ajustes', async () => {
    conSesion();
    let password: unknown = null;
    const c = lista(cuenta({ canales: [{ tipo: 'instagram', endpointId: 'ig-luna', etiqueta: 'Instagram' }] }));
    mockApi({
      'GET /cuenta/me': c,
      'POST /cuenta/password': (init: RequestInit) => {
        password = JSON.parse(String(init.body));
        return { body: { ok: true } };
      },
      'GET /cuenta/turnos': [],
    });
    renderApp('/cuenta/conexion');
    expect(await screen.findByLabelText('endpointId canal 1')).toHaveValue('ig-luna');
    await userEvent.click(screen.getByRole('link', { name: 'Probar' }));
    expect(await screen.findByLabelText('Mensaje de prueba')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Agenda' }));
    expect(await screen.findByText('Todavía no hay turnos.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Ajustes' }));
    await userEvent.type(await screen.findByLabelText('Contraseña actual'), 'vieja');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'nueva-clave-2');
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument();
    expect(password).toEqual({ actual: 'vieja', nueva: 'nueva-clave-2' });
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(sesionCliente.get()).toBeNull();
  });
});
