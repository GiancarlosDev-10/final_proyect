import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { ISesionAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-sesion-asistencia-repositorio";
import { IRegistroAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-registro-asistencia-repositorio";
import { BloqueHorario } from "@/modulos/horarios/dominio/bloque-horario";
import { SesionAsistencia } from "@/modulos/asistencia/dominio/sesion-asistencia";
import { EstudianteNoEncontradoError } from "@/modulos/estudiantes/dominio/estudiante";
import { MatriculaActivaNoEncontradaError, SinClaseEnCursoError } from "@/modulos/asistencia/dominio/reconocimiento";
import { abrirSesionAsistencia } from "@/modulos/asistencia/aplicacion/abrir-sesion-asistencia";
import { marcarAsistencia } from "@/modulos/asistencia/aplicacion/marcar-asistencia";
import { diaSemanaDeHoy, horaActualHHMM, fechaDeHoyISO } from "@/modulos/asistencia/dominio/tiempo";
import { ESTADOS_ASISTENCIA, EstadoAsistencia } from "@/config/constantes";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface RegistrarAsistenciaPorReconocimientoDeps {
  estudianteRepo: IEstudianteRepositorio;
  matriculaRepo: IMatriculaRepositorio;
  asignacionRepo: IAsignacionRepositorio;
  bloqueRepo: IBloqueHorarioRepositorio;
  sesionRepo: ISesionAsistenciaRepositorio;
  registroRepo: IRegistroAsistenciaRepositorio;
}

export interface ResultadoReconocimiento {
  estado: EstadoAsistencia;
  yaRegistrado: boolean;
}

/**
 * Punto de entrada para el script de reconocimiento facial: a diferencia de
 * las acciones del profesor (que ya saben en qué bloque están porque el
 * profesor lo seleccionó), aquí solo llega un estudianteId reconocido por la
 * cámara — hay que resolver por cuenta propia qué clase tiene en curso ahora
 * mismo (matrícula -> sección -> asignaciones activas -> bloque de hoy cuya
 * ventana horaria contiene la hora actual). Si el profesor ya abrió esa
 * sesión y editó sus umbrales manualmente, esa ventana editada tiene
 * prioridad sobre el horario original del bloque.
 */
export async function registrarAsistenciaPorReconocimiento(
  estudianteId: string,
  deps: RegistrarAsistenciaPorReconocimientoDeps
): Promise<Result<ResultadoReconocimiento>> {
  try {
    const estudiante = await deps.estudianteRepo.buscarPorId(estudianteId);
    if (!estudiante || !estudiante.activo) return err(new EstudianteNoEncontradoError(estudianteId));

    const anio = new Date().getFullYear();
    const matricula = await deps.matriculaRepo.buscarPorEstudianteYAnio(estudianteId, anio);
    if (!matricula || !matricula.activo) return err(new MatriculaActivaNoEncontradaError(estudianteId));

    const hoy = diaSemanaDeHoy();
    if (!hoy) return err(new SinClaseEnCursoError(estudianteId));

    const asignaciones = (await deps.asignacionRepo.listar()).filter(
      (a) => a.activo && a.seccionId === matricula.seccionId
    );
    if (asignaciones.length === 0) return err(new SinClaseEnCursoError(estudianteId));

    const bloques = (await deps.bloqueRepo.listarPorAsignaciones(asignaciones.map((a) => a.id))).filter(
      (b) => b.diaSemana === hoy
    );
    if (bloques.length === 0) return err(new SinClaseEnCursoError(estudianteId));

    const ahora = horaActualHHMM();
    const fecha = fechaDeHoyISO();

    // Si el profesor ya abrió la sesión de este bloque hoy y editó sus
    // umbrales manualmente (ej. para que coincidan con la hora real de una
    // demo fuera del horario normal), esa ventana editada manda sobre el
    // horario original del bloque a la hora de decidir si "hay clase ahora".
    let bloqueActivo: BloqueHorario | null = null;
    let sesionExistente: SesionAsistencia | null = null;
    for (const bloque of bloques) {
      const sesion = await deps.sesionRepo.buscarPorBloqueYFecha(bloque.id, fecha);
      if (sesion) {
        if (sesion.horaEntrada <= ahora && ahora <= sesion.horaCierre) {
          bloqueActivo = bloque;
          sesionExistente = sesion;
          break;
        }
      } else if (bloque.horaInicio <= ahora && ahora <= bloque.horaFin) {
        bloqueActivo = bloque;
        break;
      }
    }
    if (!bloqueActivo) return err(new SinClaseEnCursoError(estudianteId));

    const sesionResultado = sesionExistente
      ? ok(sesionExistente)
      : await abrirSesionAsistencia(bloqueActivo.id, { sesionRepo: deps.sesionRepo, bloqueRepo: deps.bloqueRepo });
    if (!sesionResultado.ok) return err(sesionResultado.error);
    const sesion = sesionResultado.value;

    // Presente/Tardanza quedan bloqueados apenas la cámara los escribe una vez,
    // para que frames posteriores del mismo alumno no lo pisen (el profesor sí
    // puede seguir sobreescribiendo manualmente desde el roster).
    const existente = await deps.registroRepo.buscarPorSesionYEstudiante(sesion.id, estudianteId);
    if (existente?.bloqueado) {
      return ok({ estado: existente.estado, yaRegistrado: true });
    }

    const estado: EstadoAsistencia =
      ahora <= sesion.horaLimiteTardanza ? ESTADOS_ASISTENCIA.PRESENTE : ESTADOS_ASISTENCIA.TARDANZA;

    const resultado = await marcarAsistencia(sesion.id, estudianteId, estado, deps.registroRepo);
    if (!resultado.ok) return err(resultado.error);

    return ok({ estado, yaRegistrado: false });
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
