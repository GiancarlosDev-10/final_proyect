import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { AsignacionNoEncontradaError } from "@/modulos/asignaciones/dominio/asignacion";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarAsignacion(
  id: string,
  repositorio: IAsignacionRepositorio,
  bloqueHorarioRepositorio: IBloqueHorarioRepositorio
): Promise<Result<void>> {
  const asignacion = await repositorio.buscarPorId(id);
  if (!asignacion) return err(new AsignacionNoEncontradaError(id));

  // Sin esto, los BloqueHorario de esta asignación quedaban huérfanos: como
  // `listarPorProfesor` no filtra por asignaciones vigentes, seguían
  // "ocupando" ese día/hora para siempre en la validación de choque, sin
  // ninguna pantalla de admin donde verlos ni borrarlos.
  await bloqueHorarioRepositorio.eliminarPorAsignacion(id);
  await repositorio.eliminar(id);
  return ok(undefined);
}