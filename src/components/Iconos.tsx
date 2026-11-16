const TRAZOS = {
  inicio: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  demo: 'M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z',
  ia: 'M12 3v3 M5 8h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M9 13h.01 M15 13h.01',
  probar: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  conexion: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7 M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  agenda: 'M8 3v3 M16 3v3 M4 9h16 M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  plan: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z M3 10h18 M7 15h3',
  ajustes: 'M4 6h9 M17 6h3 M4 12h3 M11 12h9 M4 18h11 M19 18h1 M15 4v4 M9 10v4 M17 16v4',
  salir: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 17l-5-5 5-5 M5 12h11',
  candado: 'M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3',
  sol: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  luna: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  subir: 'M12 16V4 M7 9l5-5 5 5 M4 20h16',
  archivo: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5 M9 13h6 M9 17h4',
  tabla: 'M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14',
  texto: 'M4 6h16 M4 10h16 M4 14h10 M4 18h7',
  caja: 'M21 8l-9-5-9 5 9 5z M3 8v8l9 5 9-5V8 M12 13v8',
  reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
  carrito: 'M3 4h2l2.4 11h10.2L20 8H6.2 M9 20h.01 M17 20h.01',
  persona: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  basura: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  check: 'M5 12l5 5L20 7',
  flecha: 'M5 12h14 M13 6l6 6-6 6',
  clientes: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21a7 7 0 0 1 14 0 M16 3.5a4 4 0 0 1 0 7 M22 21a7 7 0 0 0-4-6.3',
  tickets: 'M3 13h5l1.5 3h5l1.5-3h5 M5 5h14l2 8v6H3v-6z',
  grafico: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  enviar: 'M4 12l16-8-6 16-2.5-6.5z',
  rayo: 'M13 2 4 14h7l-1 8 9-12h-7z',
  web: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z',
  nuevo: 'M12 5v14 M5 12h14',
  reiniciar: 'M4 12a8 8 0 1 0 2.4-5.7L4 8.6 M4 4v4.6h4.6',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, tam = 18 }: { nombre: NombreIcono; tam?: number }) {
  return (
    <svg
      className="icono"
      viewBox="0 0 24 24"
      width={tam}
      height={tam}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
