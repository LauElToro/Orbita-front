import type { Cuenta, Ficha, Metricas, Plan, Ticket } from '../types';

export const PLANES: Plan[] = [
  { id: 'mensajes', nombre: 'Mensajes', precioTransferencia: 40000, precioMercadoPago: 42000, precioMensajeExtra: 45, topeDia: 100, topeSemana: 500, topeMes: 2000, modulos: ['faq', 'handoff'], maxCanales: 1, modeloCapaz: false },
  { id: 'turnos', nombre: 'Turnos', precioTransferencia: 80000, precioMercadoPago: 84000, precioMensajeExtra: 40, topeDia: 200, topeSemana: 1000, topeMes: 4000, modulos: ['faq', 'handoff', 'turnos'], maxCanales: 2, modeloCapaz: false },
  { id: 'completo', nombre: 'Completo', precioTransferencia: 110000, precioMercadoPago: 115000, precioMensajeExtra: 30, topeDia: 400, topeSemana: 2000, topeMes: 8000, modulos: ['faq', 'handoff', 'turnos', 'recordatorios'], maxCanales: 3, modeloCapaz: true },
  { id: 'personalizado', nombre: 'Personalizado', precioTransferencia: 0, precioMercadoPago: 0, precioMensajeExtra: 25, topeDia: 1000, topeSemana: 5000, topeMes: 20000, modulos: ['faq', 'handoff', 'turnos', 'recordatorios'], maxCanales: 5, modeloCapaz: true },
];

export const FICHA: Ficha = {
  id: 'pizzeria-norte',
  nombre: 'Pizzería Norte',
  estado: 'activo',
  pausaMotivo: null,
  planId: 'completo',
  plan: PLANES[2],
  timezone: 'America/Argentina/Buenos_Aires',
  modelo: 'barato',
  prompt: 'Vendemos pizzas.',
  mensajes: { espera: 'Ya te respondo.', tope: 'Tope', handoff: 'Te paso', recordatorio: 'Mañana {{hora}}' },
  modulos: ['faq', 'handoff', 'turnos', 'recordatorios'],
  topeDia: 400,
  topeSemana: 2000,
  topeMes: 8000,
  precioPersonalizado: null,
  emailContacto: null,
  publicToken: 'pub-1',
  canales: [{ tipo: 'whatsapp', endpointId: '54911', etiqueta: 'WhatsApp del local', conectado: true, tokenMask: '****oken' }],
  subscription: { medio: 'mercadopago', estadoPago: 'al_dia', diaAbono: 14, vencimiento: '2026-12-14T15:00:00.000Z', mpInitPoint: null },
  importe: 110000,
  linkPublico: 'https://orbita.test/p/pub-1',
};

export const TICKET: Ticket = {
  id: 't1',
  nombre: 'Laura',
  email: 'laura@ferre.com',
  telefono: null,
  empresa: 'Ferretería Sur',
  rubro: 'Ferretería',
  necesidad: 'Bot con stock',
  estado: 'cotizado',
  importeMensual: 250000,
  notas: null,
  tenantId: null,
  createdAt: '2026-11-14T15:00:00.000Z',
};

export function cuenta(overrides: Partial<Cuenta> = {}, plan: Plan = PLANES[1]): Cuenta {
  return {
    usuario: { nombre: 'Sofía Pérez', email: 'sofia@luna.com' },
    legalPendiente: [],
    negocio: {
      id: 'peluqueria-luna',
      nombre: 'Peluquería Luna',
      rubro: 'Estética',
      estado: 'pausado',
      pausaMotivo: 'onboarding',
      timezone: 'America/Argentina/Buenos_Aires',
      prompt: '',
      perfil: null,
      mensajes: { espera: 'Ya te respondo.', tope: 'Tope', handoff: 'Te paso', recordatorio: 'Mañana {{hora}}' },
      modulos: plan.modulos,
      topes: { dia: plan.topeDia, semana: plan.topeSemana, mes: plan.topeMes },
    },
    plan,
    canales: [],
    web: { activa: false, clave: null, origenes: [], bienvenida: null, color: null, endpoint: null, script: null },
    planElegido: true,
    suscripcion: { medio: 'mercadopago', estadoPago: 'al_dia', vencimiento: '2026-12-14T15:00:00.000Z', importe: plan.precioMercadoPago, mpInitPoint: null },
    referido: null,
    referidoEditable: true,
    onboarding: { paso: 0, completado: null, requisitos: { pago: true, canal: false, prompt: false } },
    ...overrides,
  };
}

export const METRICAS: Metricas = {
  clientes: { total: 4, activos: 2, pausadosManual: 0, pausadosImpago: 1, enOnboarding: 1, porPlan: { turnos: 2, mensajes: 1 } },
  ingresos: {
    mrr: 160000,
    arpu: 80000,
    mrrEnRiesgo: 42000,
    cobrado30d: 160000,
    porAcreditar: 84000,
    porMes: [
      { mes: '2026-06', total: 0 },
      { mes: '2026-07', total: 0 },
      { mes: '2026-08', total: 40000 },
      { mes: '2026-09', total: 80000 },
      { mes: '2026-10', total: 120000 },
      { mes: '2026-11', total: 160000 },
    ],
  },
  cobranza: { al_dia: 2, impago: 1 },
  mensajes: { hoy: 42, ultimos30: 900, serie: [{ dia: '2026-10-16', respuestas: 10 }, { dia: '2026-11-14', respuestas: 42 }] },
  embudo: { registros30d: 3, enOnboarding: 1, onboardingSinPago: 1, probaronDemo: 1, activados30d: 2 },
  tickets: { porEstado: { nuevo: 2, contratado: 1 }, conversion: 33, arrepentimientosAbiertos: 1 },
  alertas: {
    cercaDelTope: [{ id: 'pizzeria-norte', nombre: 'Pizzería Norte', usado: 3500, tope: 4000, pct: 88 }],
    proximosVencimientos: [{ id: 'bar-sur', nombre: 'Bar Sur', vencimiento: '2026-11-18T15:00:00.000Z', medio: 'mercadopago', importe: 42000 }],
  },
};