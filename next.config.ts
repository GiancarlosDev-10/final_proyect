import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // camera=(self): la página de asistencia usa getUserMedia; micrófono y geolocalización siguen bloqueados.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// El script de Python de reconocimiento facial vive en otro origen (VPS) y el
// navegador le hace fetch directo desde /asistencia/camara — hay que
// permitirlo explícitamente en connect-src o la CSP rompe esa función.
function origenReconocimiento(): string | null {
  const url = process.env.NEXT_PUBLIC_RECONOCIMIENTO_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Solo en producción: en dev, Next usa eval() para Fast Refresh (necesitaría
// 'unsafe-eval') y el websocket de HMR, y no vale la pena la complejidad de
// diferenciar ambos entornos en detalle para una protección que en dev no
// tiene mucho sentido (no hay usuarios reales navegando localhost).
function cspHeader(): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  const conectarA = ["'self'", origenReconocimiento()].filter(Boolean).join(" ");
  const directivas = [
    "default-src 'self'",
    // 'unsafe-inline' en script-src: Next.js App Router inserta scripts
    // inline para el streaming de Server Components (self.__next_f.push);
    // sin un CSP con nonce (que exigiría reescribir el middleware) no hay
    // forma de evitarlo. Sigue bloqueando cargar scripts de otros orígenes.
    "script-src 'self' 'unsafe-inline'",
    // 'unsafe-inline' en style-src: hay al menos un componente con estilo
    // inline dinámico (barra de nota, ancho calculado en runtime).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${conectarA}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directivas.join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    const csp = cspHeader();
    return [
      {
        source: "/:path*",
        headers: csp ? [...securityHeaders, { key: "Content-Security-Policy", value: csp }] : securityHeaders,
      },
    ];
  },
};

export default nextConfig;
