import { describe, expect, it } from 'vitest';
import { fecha, pesos, porcentaje } from './format';
import { slug } from './pages/Alta';

describe('format', () => {
  it('formatea pesos y fechas en es-AR', () => {
    expect(pesos(42000).replace(/\s/g, ' ')).toMatch(/\$ ?42\.000/);
    expect(fecha('2026-12-14T15:00:00.000Z')).toBe('14/12/2026');
    expect(fecha('2026-12-14')).toBe('14/12/2026');
    expect(fecha(null)).toBe('-');
  });
  it('calcula porcentajes con tope', () => {
    expect(porcentaje(50, 100)).toBe(50);
    expect(porcentaje(150, 100)).toBe(100);
    expect(porcentaje(1, 0)).toBe(100);
  });
  it('genera clientId desde el nombre', () => {
    expect(slug('Pizzería Norte!')).toBe('pizzeria-norte');
  });
});
