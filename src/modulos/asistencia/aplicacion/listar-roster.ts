import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { IRegistroAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-registro-asistencia-repositorio";
import { ISesionAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-sesion-asistencia-repositorio";
import { SesionAsistenciaNoEncontradaError } from "@/modulos/asistencia/dominio/sesion-asistencia";
import { EstadoAsistencia, ESTADOS_ASISTENCIA } from "@/config/constantes";
import { horaActualHHMM, fechaDeHoyISO } from "@/modulos/asistencia/dominio/tiempo";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface FilaRoster {
  estudianteId: string;
  nombreCompleto: string;
  estado: EstadoAsistencia | "PENDIENTE";
  bloqueado: boolean;
}

/** Perú: "Nombre ApellidoPaterno ApellidoMaterno" — el apellido es todo lo que sigue al primer nombre. */
function apellidoDe(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  return partes.length > 1 ? partes.slice(1).join(" ") : nombreCompleto;
}

export async function listarRoster(
  sesionId: string,
  seccionId: string,
  deps: {
    sesionRepo: ISesionAsistenciaRepositorio;
    matriculaRepo: IMatriculaRepositorio;
    estudianteRepo: IEstudianteRepositorio;
    registroRepo: IRegistroAsistenciaRepositorio;
  }
): Promise<Result<FilaRoster[]>> {
  try {
    const sesion = await deps.sesionRepo.buscarPorId(sesionId);
    if (!sesion) return err(new SesionAsistenciaNoEncontradaError(sesionId));

    const [matriculas, estudiantes, registros] = await Promise.all([
      deps.matriculaRepo.listarPorSeccion(seccionId),
      deps.estudianteRepo.listar(),
      deps.registroRepo.listarPorSesion(sesionId),
    ]);

    const estudiantePorId = new Map(estudiantes.map((e) => [e.id, e]));
    const registroPorEstudiante = new Map(registros.map((r) => [r.estudianteId, r]));
    const fechaHoy = fechaDeHoyISO();
    const sesionCerrada = sesion.fecha < fechaHoy || (sesion.fecha === fechaHoy && horaActualHHMM() >= sesion.horaCierre);

    const filas: FilaRoster[] = [];
    for (const matricula of matriculas) {
      if (!matricula.activo) continue;
      const estudiante = estudiantePorId.get(matricula.estudianteId);
      if (!estudiante || !estudiante.activo) continue;

      const registro = registroPorEstudiante.get(matricula.estudianteId);
      filas.push({
        estudianteId: estudiante.id,
        nombreCompleto: estudiante.nombreCompleto,
        estado: registro ? registro.estado : sesionCerrada ? ESTADOS_ASISTENCIA.AUSENTE : "PENDIENTE",
        bloqueado: registro?.bloqueado ?? false,
      });
    }
    filas.sort((a, b) => apellidoDe(a.nombreCompleto).localeCompare(apellidoDe(b.nombreCompleto)));
    return ok(filas);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
