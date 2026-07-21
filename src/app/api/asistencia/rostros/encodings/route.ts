import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoAsistencia } from "@/modulos/asistencia/presentacion/verificar-secreto-asistencia";
import { listarEncodingsActivos } from "@/modulos/estudiantes/aplicacion/listar-encodings-activos";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";

/**
 * El script de reconocimiento en tiempo real descarga acá la base completa
 * de rostros conocidos para comparar contra cada frame de la cámara.
 */
export async function GET(request: NextRequest) {
  if (!verificarSecretoAsistencia(request)) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const encodings = await listarEncodingsActivos(new EstudianteRepositorioMongo());
  return NextResponse.json({ ok: true, encodings });
}
