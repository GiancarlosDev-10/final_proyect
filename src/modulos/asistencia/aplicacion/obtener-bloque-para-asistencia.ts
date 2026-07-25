import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { BloqueDeHoy } from "@/modulos/asistencia/aplicacion/listar-bloques-de-hoy";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

/**
 * A diferencia de listarBloquesDeHoy, no filtra por día de la semana: se usa
 * cuando el profesor entra a Asistencia desde un bloque puntual de "Mi
 * Horario" (para poder probar/tomar asistencia de una clase aunque hoy no
 * sea su día real).
 */
export async function obtenerBloqueParaAsistencia(
  bloqueHorarioId: string,
  profesorId: string,
  deps: {
    bloqueRepo: IBloqueHorarioRepositorio;
    asignacionRepo: IAsignacionRepositorio;
    seccionRepo: ISeccionRepositorio;
    cursoRepo: ICursoRepositorio;
  }
): Promise<Result<BloqueDeHoy | null>> {
  try {
    const bloque = await deps.bloqueRepo.buscarPorId(bloqueHorarioId);
    if (!bloque || bloque.profesorId !== profesorId) return ok(null);

    const asignacion = await deps.asignacionRepo.buscarPorId(bloque.asignacionId);
    if (!asignacion) return ok(null);

    const [seccion, curso] = await Promise.all([
      deps.seccionRepo.buscarPorId(asignacion.seccionId),
      deps.cursoRepo.buscarPorId(asignacion.cursoId),
    ]);
    if (!seccion || !curso) return ok(null);

    return ok({
      bloqueHorarioId: bloque.id,
      seccionId: seccion.id,
      cursoNombre: curso.nombre,
      seccionNombre: `${seccion.grado} ${seccion.nombre}`,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
    });
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
