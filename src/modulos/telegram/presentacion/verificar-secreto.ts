import { NextRequest } from "next/server";
import { env } from "@/config/env";
import { compararSecretoTimingSafe } from "@/compartido/lib/comparar-secreto";

/**
 * Los endpoints de /api/telegram no usan la sesión de NextAuth (quien llama
 * es el workflow de n8n, no un navegador) — se protegen con un secreto
 * compartido fijo en el header "x-api-key", configurado en n8n y en
 * TELEGRAM_API_SECRET.
 */
export function verificarSecretoTelegram(request: NextRequest): boolean {
  const header = request.headers.get("x-api-key");
  return compararSecretoTimingSafe(header, env.TELEGRAM_API_SECRET);
}
