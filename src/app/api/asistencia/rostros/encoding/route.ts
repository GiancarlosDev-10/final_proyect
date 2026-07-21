import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoAsistencia } from "@/modulos/asistencia/presentacion/verificar-secreto-asistencia";
import { guardarEncodingFacial } from "@/modulos/estudiantes/aplicacion/guardar-encoding-facial";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";

/**
 * El script de enrolamiento de Python sube acá el encoding (128 floats) que
 * calculó para la foto pendiente de un alumno.
 */
export async function POST(request: NextRequest) {
  if (!verificarSecretoAsistencia(request)) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const estudianteId = body?.estudianteId;
  if (!estudianteId || typeof estudianteId !== "string") {
    return NextResponse.json({ ok: false, mensaje: "estudianteId es requerido" }, { status: 400 });
  }

  const resultado = await guardarEncodingFacial(estudianteId, body?.encoding, new EstudianteRepositorioMongo());
  if (!resultado.ok) {
    return NextResponse.json(
      { ok: false, mensaje: resultado.error.message, codigo: resultado.error.codigo },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, mensaje: "Encoding guardado" });
}
