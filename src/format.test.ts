import { describe, expect, it } from 'vitest';
import { coincideCharla, cuandoLista, fecha, gruposPorDia, horaDe, pesos, porcentaje, tieneTelefono } from './format';
import { slug } from './pages/Alta';

describe('format', () => {
  it('formatea pesos y fechas en es-AR', () => {
    expect(pesos(42000).replace(/\s/g, ' ')).toMatch(/\$ ?42\.000/);
    expect(fecha('2026-12-14T15:00:00.000Z')).toBe('14/12/2026');
    expect(fecha('2026-12-14')).toBe('14/12/2026');
    expect(fecha(null)).toBe('-');
  });
  it('agrupa chats de varios días y deja el texto largo intacto', () => {
    const ahora = new Date('2026-11-21T18:00:00.000Z');
    const largo = 'Quiero reservar para un evento de 40 personas. '.repeat(12);
    const grupos = gruposPorDia(
      [
        { texto: 'Hola', at: '2026-11-19T15:00:00.000Z' },
        { texto: largo, at: '2026-11-20T22:30:00.000Z' },
        { texto: 'Hoy a la mañana', at: '2026-11-21T13:00:00.000Z' },
        { texto: 'Sigo ahora', at: '2026-11-21T18:10:00.000Z' },
        { texto: 'Sin hora' },
        { texto: 'Fecha rota', at: 'no-es-fecha' },
      ],
      ahora,
    );
    expect(grupos.map((g) => g.dia)).toEqual(['19/11/2026', 'Ayer', 'Hoy', '']);
    expect(grupos.at(-1)?.items).toHaveLength(2);
    expect(grupos[1].items[0].texto).toBe(largo);
    expect(grupos[2].items).toHaveLength(2);
    expect(cuandoLista('2026-11-21T18:10:00.000Z', ahora)).toMatch(/^Hoy /);
    expect(cuandoLista('2026-11-20T15:00:00.000Z', ahora)).toMatch(/^Ayer /);
    expect(cuandoLista('2026-11-18T15:00:00.000Z', ahora)).toBe('18/11/2026');
    expect(horaDe('no-es-fecha')).toBe('');
  });
  it('encuentra una charla por teléfono, con símbolos, o por el identificador', () => {
    const ana = { nombre: 'Ana', ultimo: 'Dale', numero: '+5491111110001', codigo: '11111111-1111-4111-8111-111111111111', id: 'cuid-ana' };
    expect(coincideCharla(ana, '')).toBe(true);
    expect(coincideCharla(ana, 'ANA')).toBe(true);
    expect(coincideCharla({ ...ana, nombre: 'José' }, 'jose')).toBe(true);
    expect(coincideCharla(ana, '+54 9 11 1111-0001')).toBe(true);
    expect(coincideCharla(ana, '1111-0001')).toBe(true);
    expect(coincideCharla(ana, '11111111-1111')).toBe(true);
    expect(coincideCharla(ana, 'cuid-ana')).toBe(true);
    expect(coincideCharla(ana, '9999')).toBe(false);
    expect(coincideCharla(ana, '11')).toBe(true);
    expect(tieneTelefono('+5491111110001')).toBe(true);
    expect(tieneTelefono('ig-ana')).toBe(false);
    expect(tieneTelefono('')).toBe(false);
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
