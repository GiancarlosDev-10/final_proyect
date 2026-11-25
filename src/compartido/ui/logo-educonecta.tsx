// Mascota de EduConecta (nube con birrete), la misma de la portada de la
// exposición. SVG en línea para que se vea nítida a cualquier tamaño.
export function LogoEduConecta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="EduConecta" className={className}>
      <circle cx="60" cy="60" r="60" fill="#14213D" />
      <g fill="#F4EFE6">
        <circle cx="41" cy="70" r="14" />
        <circle cx="60" cy="60" r="19" />
        <circle cx="79" cy="70" r="14" />
        <rect x="27" y="68" width="66" height="18" rx="9" />
      </g>
      <circle cx="52" cy="74" r="3" fill="#14213D" />
      <circle cx="68" cy="74" r="3" fill="#14213D" />
      <path d="M54 80q6 5 12 0" fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="47" y="40" width="26" height="11" rx="2" fill="#DFA82F" />
      <path d="M60 27 87 38 60 49 33 38Z" fill="#F2C14E" />
      <path d="M84 39v14" stroke="#F2C14E" strokeWidth="2.2" />
      <circle cx="84" cy="55" r="2.8" fill="#F2C14E" />
    </svg>
  );
}
