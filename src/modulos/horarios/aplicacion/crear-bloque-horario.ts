import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { BloqueHorario, BloqueHorarioSuperpuestoError, SeccionOcupadaEnHorarioError } from "@/modulos/horarios/dominio/bloque-horario";
import { AsignacionNoEncontradaError } from "@/modulos/asignaciones/dominio/asignacion";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";
import { DiaSemana } from "@/config/constantes";

export interface CrearBloqueHorarioDTO {
  asignacionId: string;
  profesorId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export async function crearBloqueHorario(
  datos: CrearBloqueHorarioDTO,
  repositorio: IBloqueHorarioRepositorio,
  asignacionRepositorio: IAsignacionRepositorio
): Promise<Result<BloqueHorario>> {
  const asignacion = await asignacionRepositorio.buscarPorId(datos.asignacionId);
  if (!asignacion || asignacion.profesorId !== datos.profesorId) {
    return err(new AsignacionNoEncontradaError(datos.asignacionId));
  }

  // El profesor no puede tener dos clases al mismo tiempo DENTRO DEL MISMO
  // PERIODO — se compara solo contra sus otras asignaciones activas de este
  // periodo, no contra bimestres distintos (que nunca coinciden en el
  // calendario real). Antes esto comparaba contra TODOS los bloques del
  // profesor sin importar el periodo, lo que reportaba un choque falso al
  // intentar replicar el mismo horario semanal de un bimestre al siguiente.
  const todasAsignaciones = await asignacionRepositorio.listar();
  const asignacionesDelProfesorEnEstePeriodo = todasAsignaciones.filter(
    (a) => a.profesorId === datos.profesorId && a.periodoId === asignacion.periodoId && a.activo
  );
  const bloquesDelProfesor = await repositorio.listarPorAsignaciones(asignacionesDelProfesorEnEstePeriodo.map((a) => a.id));
  const seSuperponeProfesor = bloquesDelProfesor.some((b) => b.seSuperponeCon(datos.diaSemana, datos.horaInicio, datos.horaFin));
  if (seSuperponeProfesor) return err(new BloqueHorarioSuperpuestoError());

  // Aunque el profesor esté libre, el aula (la sección) no puede tener dos
  // clases distintas al mismo tiempo — se compara contra los bloques de las
  // demás asignaciones activas de esa misma sección y periodo (con
  // profesores distintos, típicamente).
  const asignacionesDeLaSeccion = todasAsignaciones.filter(
    (a) => a.seccionId === asignacion.seccionId && a.periodoId === asignacion.periodoId && a.activo && a.id !== asignacion.id
  );
  const bloquesDeLaSeccion = await repositorio.listarPorAsignaciones(asignacionesDeLaSeccion.map((a) => a.id));
  const seSuperponeSeccion = bloquesDeLaSeccion.some((b) => b.seSuperponeCon(datos.diaSemana, datos.horaInicio, datos.horaFin));
  if (seSuperponeSeccion) return err(new SeccionOcupadaEnHorarioError());

  try {
    const ahora = new Date().toISOString();

    const bloque = new BloqueHorario({
      id: generarId("BLH"),
      asignacionId: datos.asignacionId,
      profesorId: datos.profesorId,
      diaSemana: datos.diaSemana,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(bloque);
    return ok(bloque);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
