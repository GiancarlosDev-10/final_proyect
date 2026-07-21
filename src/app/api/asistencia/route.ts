import { NextRequest, NextResponse } from "next/server";
import { verificarSecretoAsistencia } from "@/modulos/asistencia/presentacion/verificar-secreto-asistencia";
import { registrarAsistenciaPorReconocimiento } from "@/modulos/asistencia/aplicacion/registrar-asistencia-por-reconocimiento";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { BloqueHorarioRepositorioMongo } from "@/modulos/horarios/infraestructura/bloque-horario-repositorio-mongo";
import { SesionAsistenciaRepositorioMongo } from "@/modulos/asistencia/infraestructura/sesion-asistencia-repositorio-mongo";
import { RegistroAsistenciaRepositorioMongo } from "@/modulos/asistencia/infraestructura/registro-asistencia-repositorio-mongo";

/**
 * Llamado por el script de Python de reconocimiento facial (sin sesión de
 * NextAuth) apenas identifica a un alumno en un frame. Distinto de
 * /api/asistencia/captura, que solo recibe el frame crudo: este endpoint ya
 * recibe el estudianteId resuelto y se encarga de ubicar su clase actual y
 * marcar la asistencia.
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

  const resultado = await registrarAsistenciaPorReconocimiento(estudianteId, {
    estudianteRepo: new EstudianteRepositorioMongo(),
    matriculaRepo: new MatriculaRepositorioMongo(),
    asignacionRepo: new AsignacionRepositorioMongo(),
    bloqueRepo: new BloqueHorarioRepositorioMongo(),
    sesionRepo: new SesionAsistenciaRepositorioMongo(),
    registroRepo: new RegistroAsistenciaRepositorioMongo(),
  });

  if (!resultado.ok) {
    return NextResponse.json({ ok: false, mensaje: resultado.error.message, codigo: resultado.error.codigo });
  }

  return NextResponse.json({ ok: true, estado: resultado.value.estado, yaRegistrado: resultado.value.yaRegistrado });
}
