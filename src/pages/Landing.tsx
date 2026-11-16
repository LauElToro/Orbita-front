import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { SitioFooter } from '../components/Sitio';
import { Isotipo, Presentacion } from '../landing/Presentacion';
import type { Plan } from '../types';

export function Landing() {
  const planes = useQuery({ queryKey: ['publico-planes'], queryFn: () => api<Plan[]>('/publico/planes') });

  return (
    <div className="landing">
      <Presentacion planes={planes.data} />
      <SitioFooter
        className="pie-orbita"
        logo={
          <span className="pie-marca">
            <Isotipo />
            <span className="wm">órbita</span>
          </span>
        }
      />
    </div>
  );
}
