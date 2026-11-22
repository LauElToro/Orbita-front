export type PlanId = 'mensajes' | 'turnos' | 'completo' | 'personalizado';
export type MedioPago = 'mercadopago';
export type EstadoPago = 'al_dia' | 'pendiente' | 'impago';
export type EstadoBot = 'activo' | 'pausado';
export type CanalTipo = 'whatsapp' | 'instagram' | 'tiktok';
export type TicketEstado = 'nuevo' | 'en_gestion' | 'cotizado' | 'contratado' | 'descartado';

export interface Plan {
  id: PlanId;
  nombre: string;
  precioTransferencia: number;
  precioMercadoPago: number;
  precioMensajeExtra?: number;
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
  /** Solo al enviar: el backend nunca lo devuelve. */
  token?: string;
  conectado?: boolean;
  tokenMask?: string | null;
  verificacion?: VerificacionWhatsapp | null;
  verificacionDetalle?: string | null;
  displayPhone?: string | null;
}

export interface Mensajes {
  espera: string;
  tope: string;
  handoff: string;
  recordatorio: string;
}

export type PausaMotivo = 'manual' | 'impago' | 'onboarding' | 'baja' | null;
export type VerificacionWhatsapp = 'pendiente' | 'en_revision' | 'verificado' | 'rechazado';
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
  canales: Canal[];
  subscription: {
    medio: MedioPago;
    estadoPago: EstadoPago;
    diaAbono: number;
    vencimiento: string;
    mpInitPoint: string | null;
  } | null;
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
}

export type Tono = 'cercano' | 'formal' | 'divertido';

export interface ItemCatalogo {
  nombre: string;
  detalle: string;
  categoria: string;
  imagen: string;
  precio: number;
  precioEfectivo?: number;
  stock: number | null;
  medios: string[];
}

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
  catalogo?: ItemCatalogo[];
  documentos?: { nombre: string; url: string; texto: string }[];
}

export interface IntegracionWeb {
  activa: boolean;
  clave: string | null;
  /** Dominios habilitados (sin esquema ni www). Vacío: cualquier sitio. */
  origenes: string[];
  bienvenida: string | null;
  color: string | null;
  endpoint: string | null;
  script: string | null;
}

export interface Requisitos {
  pago: boolean;
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
  /** Plan elegido que entra en vigencia cuando se acredita el pago de su importe. */
  planPendiente?: Plan | null;
  planElegido: boolean;
  canales: Canal[];
  web: IntegracionWeb;
  suscripcion: {
    medio: MedioPago;
    estadoPago: EstadoPago;
    vencimiento: string;
    importe: number;
    mpInitPoint: string | null;
    debitoActivo?: boolean;
    canceladaEn?: string | null;
  } | null;
  whatsapp?: { listo: boolean; appId: string; configId: string; version: string };
  redes?: { facebook: { listo: boolean }; instagram: { listo: boolean }; tiktok: { listo: boolean } };
  calendario?: { conectado: boolean; email: string | null };
  extras?: { cantidad: number; pendiente: number; precio: number; periodo: string } | null;
  /** Link de referido con el que quedó vinculada la cuenta. */
  referido: { codigo: string } | null;
  /** Se puede cargar uno a mano: no tiene referido y todavía no pagó. */
  referidoEditable: boolean;
  onboarding: { paso: number; completado: string | null; requisitos: Requisitos };
}

export interface Simulacion {
  texto: string;
  handoff: boolean;
  acciones: string[];
  imagen?: string;
  herramientas?: { nombre: string; imagen: string }[];
}

export type FuncionDemo = 'stock' | 'horarios' | 'turnos' | 'pedidos' | 'derivar';

export interface FuenteDemo {
  id: string;
  tipo: 'texto' | 'pdf' | 'tabla';
  nombre: string;
  caracteres: number;
  filas: number;
  createdAt: string;
  vista?: string;
  columnas?: string[];
  muestra?: string[][];
}

export interface Demo {
  /** Nombre con el que se presenta la IA: el de la demo si se cargó uno, si no el del negocio. */
  negocio: string;
  config: { negocio: string; funciones: FuncionDemo[]; horarios: string; tono: Tono };
  mensajes: number;
  fuentes: FuenteDemo[];
  limites: { fuentes: number; megas: number; caracteresTotal: number };
  usados: number;
}

export interface Pago {
  id: string;
  medio: MedioPago;
  importe: number;
  periodo: string;
  createdAt: string;
}

export type ComisionEstado = 'pendiente' | 'pagada' | 'anulada';

export interface PanelAfiliado {
  nombre: string;
  email: string;
  codigo: string;
  link: string;
  porcentaje: number;
  plazo: { desde: number; hasta: number };
  datosCobro: string | null;
  totales: { pendiente: number; pagada: number };
  referidos: { id: string; negocio: string; plan: string | null; pago: boolean; createdAt: string }[];
  comisiones: {
    id: string;
    importe: number;
    estado: ComisionEstado;
    pagableDesde: string;
    pagarAntes: string;
    pagadaEn: string | null;
    createdAt: string;
  }[];
}

export interface AfiliadoResumen {
  id: string;
  nombre: string;
  email: string;
  codigo: string;
  datosCobro: string | null;
  referidos: number;
  pendiente: number;
  pagada: number;
  createdAt: string;
}

export interface Comision {
  id: string;
  importe: number;
  estado: ComisionEstado;
  pagableDesde: string;
  pagarAntes: string;
  pagadaEn: string | null;
  createdAt: string;
  affiliate: { nombre: string; email: string; datosCobro: string | null };
  tenant: { id: string; nombre: string };
  payment: { importe: number; medio: MedioPago; createdAt: string };
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
  embudo: { registros30d: number; enOnboarding: number; onboardingSinPago: number; probaronDemo: number; activados30d: number };
  tickets: { porEstado: Record<string, number>; conversion: number; arrepentimientosAbiertos: number };
  alertas: {
    cercaDelTope: { id: string; nombre: string; usado: number; tope: number; pct: number }[];
    proximosVencimientos: { id: string; nombre: string; vencimiento: string; medio: MedioPago; importe: number }[];
  };
}
