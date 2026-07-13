import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoTelegram } from "@/modulos/telegram/presentacion/verificar-secreto";
import { UsuarioRepositorioMongo } from "@/modulos/usuarios/infraestructura/usuario-repositorio-mongo";
import { TelegramChatRepositorioMongo } from "@/modulos/telegram/infraestructura/telegram-chat-repositorio-mongo";
import { TelegramIntentoRepositorioMongo } from "@/modulos/telegram/infraestructura/telegram-intento-repositorio-mongo";
import { autenticarChatTelegram } from "@/modulos/telegram/aplicacion/autenticar-chat-telegram";

export async function POST(request: NextRequest) {
  if (!verificarSecretoTelegram(request)) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const chatId = body?.chatId;
  const pin = body?.pin;
  if (!chatId || !pin) {
    return NextResponse.json({ ok: false, mensaje: "chatId y pin son requeridos" }, { status: 400 });
  }

  const resultado = await autenticarChatTelegram(
    { chatId: String(chatId), pin: String(pin) },
    new UsuarioRepositorioMongo(),
    new TelegramChatRepositorioMongo(),
    new TelegramIntentoRepositorioMongo()
  );

  // PIN incorrecto o chat bloqueado son resultados de negocio esperados, no errores de
  // transporte: se devuelven con 200 para que n8n siempre pueda leer el cuerpo igual.
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, mensaje: resultado.error.message, codigo: resultado.error.codigo });
  }

  return NextResponse.json({ ok: true, ...resultado.value });
}
