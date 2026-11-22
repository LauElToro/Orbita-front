import { useState } from 'react';
import { ApiError, api } from '../api';

interface ArchivoGuardado {
  url: string;
  nombre: string;
  texto: string | null;
}

function leerBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).replace(/^data:[^,]*,/, ''));
    lector.onerror = () => reject(new Error(`No pudimos leer ${archivo.name}`));
    lector.readAsDataURL(archivo);
  });
}

export function CargarArchivo({
  aceptar,
  etiqueta,
  ayuda,
  exigeTexto = false,
  onListo,
}: {
  aceptar: string;
  etiqueta: string;
  ayuda: string;
  exigeTexto?: boolean;
  onListo: (archivo: ArchivoGuardado) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cambiar = async (file?: File) => {
    if (!file) return;
    setError(null);
    setCargando(true);
    try {
      const archivo = await leerBase64(file);
      const guardado = await api<ArchivoGuardado>('/cuenta/archivos', { method: 'POST', body: { nombre: file.name, archivo } });
      if (exigeTexto && !guardado.texto) {
        setError('Ese archivo no tiene texto para sumar al prompt.');
        return;
      }
      onListo(guardado);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'No pudimos cargar el archivo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <label className="cargar-archivo">
      {etiqueta}
      <input
        type="file"
        accept={aceptar}
        disabled={cargando}
        onChange={(e) => {
          void cambiar(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <small className="muted">{cargando ? 'Cargando…' : ayuda}</small>
      {error && <small className="falla">{error}</small>}
    </label>
  );
}
