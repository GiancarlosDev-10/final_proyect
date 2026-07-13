import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoTelegram } from "@/modulos/telegram/presentacion/verificar-secreto";
import { TelegramChatRepositorioMongo } from "@/modulos/telegram/infraestructura/telegram-chat-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { consultarNotasTelegram } from "@/modulos/telegram/aplicacion/consultar-notas-telegram";

export async function POST(request: NextRequest) {
  if (!verificarSecretoTelegram(request)) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const chatId = body?.chatId;
  const estudianteId = body?.estudianteId;
  if (!chatId || !estudianteId) {
    return NextResponse.json({ ok: false, mensaje: "chatId y estudianteId son requeridos" }, { status: 400 });
  }

  const resultado = await consultarNotasTelegram(
    {
      chatId: String(chatId),
      estudianteId: String(estudianteId),
      cursoNombre: body?.cursoNombre ? String(body.cursoNombre) : undefined,
      periodoNombre: body?.periodoNombre ? String(body.periodoNombre) : undefined,
    },
    {
      chatRepo: new TelegramChatRepositorioMongo(),
      asignacionRepo: new AsignacionRepositorioMongo(),
      matriculaRepo: new MatriculaRepositorioMongo(),
      estudianteRepo: new EstudianteRepositorioMongo(),
      notaRepo: new NotaRepositorioMongo(),
      cursoRepo: new CursoRepositorioMongo(),
      periodoRepo: new PeriodoRepositorioMongo(),
    }
  );

  // "Alumno no asignado"/"chat no vinculado" son resultados de negocio esperados,
  // no errores de transporte: se devuelven con 200.
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, mensaje: resultado.error.message, codigo: resultado.error.codigo });
  }

  return NextResponse.json({ ok: true, ...resultado.value });
}
