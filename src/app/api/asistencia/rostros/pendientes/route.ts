import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoAsistencia } from "@/modulos/asistencia/presentacion/verificar-secreto-asistencia";
import { listarPendientesEncoding } from "@/modulos/estudiantes/aplicacion/listar-pendientes-encoding";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";

/**
 * El script de enrolamiento de Python llama a esto para saber qué alumnos
 * tienen foto pero todavía no tienen encoding calculado.
 */
export async function GET(request: NextRequest) {
  if (!verificarSecretoAsistencia(request)) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const pendientes = await listarPendientesEncoding(new EstudianteRepositorioMongo());
  return NextResponse.json({ ok: true, pendientes });
}
