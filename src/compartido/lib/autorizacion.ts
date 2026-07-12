import { auth } from "@/auth";
import { Rol } from "@/config/constantes";

/**
 * Verifica que exista una sesión activa con uno de los roles permitidos.
 * Devuelve el id del usuario autenticado o null si no está autorizado.
 */
export async function requerirRol(...rolesPermitidos: Rol[]): Promise<string | null> {
  const session = await auth();
  const rol = session?.user?.rol;
  const userId = session?.user?.id;
  if (!userId || !rol || !rolesPermitidos.includes(rol)) return null;
  return userId;
}
