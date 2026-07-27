import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoTelegram } from "@/modulos/telegram/presentacion/verificar-secreto";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { CodigoApoderadoRepositorioMongo } from "@/modulos/telegram/infraestructura/codigo-apoderado-repositorio-mongo";
import { ApoderadoIntentoRepositorioMongo } from "@/modulos/telegram/infraestructura/apoderado-intento-repositorio-mongo";
import { iniciarVinculacionApoderado } from "@/modulos/telegram/aplicacion/iniciar-vinculacion-apoderado";

export async function POST(request: NextRequest) {
  if (!verificarSecretoTelegram(request)) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const chatId = body?.chatId;
  const dniEstudiante = body?.dniEstudiante;
  if (!chatId || !dniEstudiante) {
    return NextResponse.json({ ok: false, mensaje: "chatId y dniEstudiante son requeridos" }, { status: 400 });
  }

  const resultado = await iniciarVinculacionApoderado(
    { chatId: String(chatId), dniEstudiante: String(dniEstudiante) },
    {
      estudianteRepo: new EstudianteRepositorioMongo(),
      codigoRepo: new CodigoApoderadoRepositorioMongo(),
      intentoRepo: new ApoderadoIntentoRepositorioMongo(),
    }
  );

  // DNI inexistente/sin email o chat bloqueado son resultados de negocio esperados,
  // no errores de transporte: se devuelven con 200 para que n8n siempre pueda leer el cuerpo igual.
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, mensaje: resultado.error.message, codigo: resultado.error.codigo });
  }

  return NextResponse.json({ ok: true, ...resultado.value });
}
