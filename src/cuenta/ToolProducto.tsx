/** Ficha del producto cuando el catálogo tiene una foto cargada por el comercio. */
export function ToolProducto({ nombre, imagen }: { nombre?: string; imagen: string }) {
  if (!imagen.startsWith('https://')) return null;
  return (
    <figure className="tool-producto">
      <img src={imagen} alt={nombre || 'Producto'} />
      {nombre ? <figcaption>{nombre}</figcaption> : null}
    </figure>
  );
}

export function ToolsProducto({ herramientas, imagen }: { herramientas?: { nombre: string; imagen: string }[]; imagen?: string }) {
  const fotos = herramientas?.length ? herramientas : imagen ? [{ nombre: '', imagen }] : [];
  if (!fotos.length) return null;
  return (
    <div className="tools-producto">
      {fotos.map((f) => (
        <ToolProducto key={`${f.nombre}-${f.imagen}`} nombre={f.nombre} imagen={f.imagen} />
      ))}
    </div>
  );
}
