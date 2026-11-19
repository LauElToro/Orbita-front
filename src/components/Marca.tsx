/** Burbuja de la marca. El trazo sigue el logo entregado (burbuja + punto azul). */
export function Marca({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="320 350 380 340" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round">
        <path className="s" d="M567 386 H400 Q345 386 345 450 V545 Q345 600 411 600 V660" />
        <path className="s" d="M645 470 V548 Q645 604 590 604 H490 L411 660" />
      </g>
      <circle className="d" cx="645" cy="389" r="37" fill="#4577fe" />
    </svg>
  );
}
