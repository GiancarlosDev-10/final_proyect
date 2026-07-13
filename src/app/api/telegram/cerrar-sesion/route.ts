import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoTelegram } from "@/modulos/telegram/presentacion/verificar-secreto";
import { TelegramChatRepositorioMongo } from "@/modulos/telegram/infraestructura/telegram-chat-repositorio-mongo";
import { cerrarSesionTelegram } from "@/modulos/telegram/aplicacion/cerrar-sesion-telegram";

export async function POST(request: NextRequest) {
  if (!verificarSecretoTelegram(request)) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const chatId = body?.chatId;
  if (!chatId) {
    return NextResponse.json({ ok: false, mensaje: "chatId es requerido" }, { status: 400 });
  }

  await cerrarSesionTelegram(String(chatId), new TelegramChatRepositorioMongo());
  return NextResponse.json({ ok: true, mensaje: "Sesión de Telegram cerrada" });
}
