import { auth } from "@/auth";
import { Rol } from "@/config/constantes";

/**
 * Lee la sesión actual. Devuelve null si no hay sesión válida — el redirect
 * al login para este caso lo hace el vigilante de sesión en el cliente
 * (useSession + DashboardShell), no el propio Server Action: llamar
 * redirect() dentro de una Server Action invocada desde un onClick (no un
 * <form action>) no navega de forma confiable en esta versión de Next.js.
 */
export async function requerirSesion(): Promise<{ id: string; rol: Rol } | null> {
  const session = await auth();
  const id = session?.user?.id;
  const rol = session?.user?.rol as Rol | undefined;
  if (!id || !rol) return null;
  return { id, rol };
}

/**
 * Verifica que exista una sesión activa con uno de los roles permitidos.
 * Devuelve el id del usuario autenticado o null si no está autorizado
 * (sin sesión, o rol insuficiente).
 */
export async function requerirRol(...rolesPermitidos: Rol[]): Promise<string | null> {
  const sesion = await requerirSesion();
  if (!sesion || !rolesPermitidos.includes(sesion.rol)) return null;
  return sesion.id;
}
