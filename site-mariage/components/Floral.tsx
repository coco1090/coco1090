// Petit ornement floral en SVG, réutilisé comme décoration.
export function Floral({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} fill="none" aria-hidden="true">
      <path d="M10 40 C 40 10, 70 10, 100 40 C 130 70, 160 70, 190 40" stroke="currentColor" strokeWidth="1.2" />
      {[30, 60, 100, 140, 170].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i % 2 ? 50 : 30})`}>
          <ellipse rx="6" ry="3.5" transform="rotate(-30)" fill="currentColor" opacity="0.35" />
          <ellipse rx="6" ry="3.5" transform="rotate(30)" fill="currentColor" opacity="0.25" />
        </g>
      ))}
      <circle cx="100" cy="40" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="100" cy="40" r="7" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

export function FloralCorner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
      <path d="M0 200 C 20 120, 60 80, 140 50 C 170 40, 190 20, 200 0" stroke="currentColor" strokeWidth="1.2" />
      <path d="M40 150 C 60 140, 70 120, 65 100" stroke="currentColor" strokeWidth="1" />
      <path d="M90 110 C 110 100, 120 85, 118 65" stroke="currentColor" strokeWidth="1" />
      {[
        [30, 160, -20], [55, 125, 15], [80, 100, -35], [110, 80, 20], [140, 55, -15], [165, 30, 25],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse rx="10" ry="5" fill="currentColor" opacity="0.28" />
          <path d="M-10 0 L10 0" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
        </g>
      ))}
      <g transform="translate(150 25)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} rx="9" ry="4.5" transform={`rotate(${a}) translate(8 0)`} fill="currentColor" opacity="0.35" />
        ))}
        <circle r="3" fill="currentColor" opacity="0.8" />
      </g>
    </svg>
  );
}
