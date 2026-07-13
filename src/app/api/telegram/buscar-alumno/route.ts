import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoTelegram } from "@/modulos/telegram/presentacion/verificar-secreto";
import { TelegramChatRepositorioMongo } from "@/modulos/telegram/infraestructura/telegram-chat-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { buscarAlumnoTelegram } from "@/modulos/telegram/aplicacion/buscar-alumno-telegram";

export async function POST(request: NextRequest) {
  if (!verificarSecretoTelegram(request)) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const chatId = body?.chatId;
  const nombre = body?.nombre;
  if (!chatId || !nombre) {
    return NextResponse.json({ ok: false, mensaje: "chatId y nombre son requeridos" }, { status: 400 });
  }

  const resultado = await buscarAlumnoTelegram(String(chatId), String(nombre), {
    chatRepo: new TelegramChatRepositorioMongo(),
    asignacionRepo: new AsignacionRepositorioMongo(),
    matriculaRepo: new MatriculaRepositorioMongo(),
    estudianteRepo: new EstudianteRepositorioMongo(),
    seccionRepo: new SeccionRepositorioMongo(),
  });

  // "Chat no vinculado" es un resultado de negocio esperado (dispara el flujo de
  // pedir el PIN en n8n), no un error de transporte: se devuelve con 200.
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, mensaje: resultado.error.message, codigo: resultado.error.codigo });
  }

  return NextResponse.json({ ok: true, candidatos: resultado.value });
}
