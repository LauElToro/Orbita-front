/**
 * Datos públicos de Orbita en Términos, Privacidad y el pie del sitio.
 * La sociedad todavía no está formada: no se publican razón social, CUIT ni domicilio.
 * El único contacto es por email.
 */
export const EMPRESA = {
  marca: 'Orbita',
  email: 'legal@orbita.com.ar',
  soporte: 'hola@orbita.com.ar',
  jurisdiccion: 'Ciudad Autónoma de Buenos Aires',
};

/** Debe coincidir con LEGAL en Backend/src/legal/legal.ts. */
export const VERSION_LEGAL = { terminos: '2026-11-22', privacidad: '2026-11-22' };
