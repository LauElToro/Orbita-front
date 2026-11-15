export type PlanId = 'mensajes' | 'turnos' | 'completo' | 'personalizado';
export type MedioPago = 'mercadopago' | 'transferencia';
export type EstadoPago = 'al_dia' | 'pendiente' | 'impago';
export type EstadoBot = 'activo' | 'pausado';
export type CanalTipo = 'whatsapp' | 'instagram' | 'tiktok';
export type TicketEstado = 'nuevo' | 'en_gestion' | 'cotizado' | 'contratado' | 'descartado';

export interface Plan {
  id: PlanId;
  nombre: string;
  precioTransferencia: number;
  precioMercadoPago: number;
  topeDia: number;
  topeSemana: number;
  topeMes: number;
  modulos: string[];
  maxCanales: number;
  modeloCapaz: boolean;
}

export interface Canal {
  tipo: CanalTipo;
  endpointId: string;
  etiqueta: string;
}

export interface Mensajes {
  espera: string;
  tope: string;
  handoff: string;
  recordatorio: string;
}

export type PausaMotivo = 'manual' | 'impago' | 'onboarding' | null;
export type DocumentoLegal = 'terminos' | 'privacidad';
export type TicketTipo = 'ia_personalizada' | 'arrepentimiento';

export interface ClienteResumen {
  id: string;
  nombre: string;
  plan: { id: PlanId; nombre: string };
  canales: { tipo: CanalTipo; etiqueta: string }[];
  estado: EstadoBot;
  pausaMotivo: PausaMotivo;
  estadoPago: EstadoPago;
  vencimiento: string | null;
}

export interface Ficha {
  id: string;
  nombre: string;
  estado: EstadoBot;
  pausaMotivo: PausaMotivo;
  planId: PlanId;
  plan: Plan;
  timezone: string;
  pageId: string | null;
  apiKey: string;
  modelo: string;
  prompt: string;
  mensajes: Mensajes;
  modulos: string[];
  topeDia: number;
  topeSemana: number;
  topeMes: number;
  precioPersonalizado: number | null;
  emailContacto: string | null;
  publicToken: string;
  canales: (Canal & { id: string })[];
  subscription: {
    medio: MedioPago;
    estadoPago: EstadoPago;
    diaAbono: number;
    vencimiento: string;
    mpInitPoint: string | null;
  } | null;
  appTokenMask: string | null;
  importe: number;
  linkPublico: string;
  usuario?: { id: string; email: string; nombre: string; ultimoLogin: string | null; createdAt: string } | null;
}

export interface UsoPeriodo {
  usado: number;
  tope: number;
  reinicia: string;
}

export interface Uso {
  dia: UsoPeriodo;
  semana: UsoPeriodo;
  mes: UsoPeriodo;
}

export interface Turno {
  id: string;
  nombre: string;
  fecha: string;
  estado: 'reservado' | 'confirmado' | 'cancelado';
  recordatorioEnviado: boolean;
}

export interface Ticket {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string;
  rubro: string;
  necesidad: string;
  estado: TicketEstado;
  tipo?: TicketTipo;
  importeMensual: number | null;
  notas: string | null;
  tenantId: string | null;
  createdAt: string;
}

export interface PaginaPublica {
  nombre: string;
  plan: { id: PlanId; nombre: string };
  medio: MedioPago;
  importe: number;
  vencimiento: string;
  estadoPago: EstadoPago;
  estado: EstadoBot;
  uso: { mes: number; tope: number; reinicia: string };
  diasGracia: number;
  mercadopago: { initPoint: string | null; requiereEmail: boolean; habilitado: boolean } | null;
  transferencia: { alias: string; importe: number; concepto: string } | null;
}

export type Tono = 'cercano' | 'formal' | 'divertido';

export interface Perfil {
  descripcion: string;
  productos: string;
  horarios: string;
  ubicacion: string;
  pagosEnvios: string;
  tono: Tono;
  derivar: string;
  preguntas: { pregunta: string; respuesta: string }[];
  turnos?: { servicios: string; horarios: string; duracionMin: number; anticipacionHoras: number };
}

export interface Requisitos {
  pago: boolean;
  manychat: boolean;
  canal: boolean;
  prompt: boolean;
}

export interface Cuenta {
  usuario: { nombre: string; email: string } | null;
  legalPendiente: DocumentoLegal[];
  negocio: {
    id: string;
    nombre: string;
    rubro: string | null;
    estado: EstadoBot;
    pausaMotivo: PausaMotivo;
    timezone: string;
    prompt: string;
    perfil: Perfil | null;
    mensajes: Mensajes;
    modulos: string[];
    topes: { dia: number; semana: number; mes: number };
  };
  plan: Plan;
  canales: Canal[];
  manychat: { pageId: string | null; appTokenMask: string | null; apiKey: string; entrada: string; salida: string };
  suscripcion: {
    medio: MedioPago;
    estadoPago: EstadoPago;
    vencimiento: string;
    importe: number;
    mpInitPoint: string | null;
  } | null;
  transferencia: { alias: string; importe: number; concepto: string } | null;
  onboarding: { paso: number; completado: string | null; requisitos: Requisitos };
}

export interface Simulacion {
  texto: string;
  handoff: boolean;
  acciones: string[];
}

export interface Pago {
  id: string;
  medio: MedioPago;
  importe: number;
  periodo: string;
  createdAt: string;
}

export interface Metricas {
  clientes: {
    total: number;
    activos: number;
    pausadosManual: number;
    pausadosImpago: number;
    enOnboarding: number;
    porPlan: Record<string, number>;
  };
  ingresos: {
    mrr: number;
    arpu: number;
    mrrEnRiesgo: number;
    cobrado30d: number;
    porAcreditar: number;
    porMes: { mes: string; total: number }[];
  };
  cobranza: Record<string, number>;
  mensajes: { hoy: number; ultimos30: number; serie: { dia: string; respuestas: number }[] };
  embudo: { registros30d: number; enOnboarding: number; onboardingSinPago: number; activados30d: number };
  tickets: { porEstado: Record<string, number>; conversion: number; arrepentimientosAbiertos: number };
  alertas: {
    cercaDelTope: { id: string; nombre: string; usado: number; tope: number; pct: number }[];
    proximosVencimientos: { id: string; nombre: string; vencimiento: string; medio: MedioPago; importe: number }[];
  };
}
