"use client";

import { SessionProvider } from "next-auth/react";

// refetchInterval revisa la sesión periódicamente en el cliente (además del
// refetch automático al volver a enfocar la pestaña), para que la sesión
// vencida por inactividad (ver auth.config.ts) saque al usuario del dashboard
// sin que tenga que navegar o hacer clic en algo primero.
export function ProveedorSesion({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchInterval={60}>{children}</SessionProvider>;
}
