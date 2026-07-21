import { NextRequest, NextResponse } from "next/server";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";
import { subirFotoEstudiante } from "@/modulos/estudiantes/aplicacion/subir-foto-estudiante";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";

/**
 * El admin sube la foto de un alumno desde el panel (para el enrolamiento
 * facial). Recibe el binario crudo, igual que /api/asistencia/captura, para
 * no toparse con el límite de tamaño de body de las server actions.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requerirRol(ROLES.ADMIN);
  if (!adminId) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const contentType = request.headers.get("content-type") ?? "";
  const bytes = await request.arrayBuffer();

  const resultado = await subirFotoEstudiante(id, { bytes, contentType }, new EstudianteRepositorioMongo());
  if (!resultado.ok) {
    return NextResponse.json(
      { ok: false, mensaje: resultado.error.message, codigo: resultado.error.codigo },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, mensaje: "Foto actualizada" });
}
