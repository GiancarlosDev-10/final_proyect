import { NextRequest } from "next/server";
import { env } from "@/config/env";

/**
 * El script de Python de reconocimiento facial no tiene sesión de NextAuth —
 * se protege con un secreto compartido fijo en el header "x-api-key", mismo
 * patrón que /api/telegram (ver verificarSecretoTelegram).
 */
export function verificarSecretoAsistencia(request: NextRequest): boolean {
  const header = request.headers.get("x-api-key");
  return header === env.ASISTENCIA_API_SECRET;
}
