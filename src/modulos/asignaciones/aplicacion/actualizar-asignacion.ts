import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { Asignacion, AsignacionNoEncontradaError } from "@/modulos/asignaciones/dominio/asignacion";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarAsignacionDTO {
  id: string;
  profesorId: string;
  cursoId: string;
  seccionId: string;
  periodoId: string;
  activo: boolean;
}

export async function actualizarAsignacion(
  datos: ActualizarAsignacionDTO,
  repositorio: IAsignacionRepositorio
): Promise<Result<Asignacion>> {
  const asignacion = await repositorio.buscarPorId(datos.id);
  if (!asignacion) return err(new AsignacionNoEncontradaError(datos.id));

  const ahora = new Date().toISOString();

  const asignacionActualizada = new Asignacion({
    id: asignacion.id,
    profesorId: datos.profesorId,
    cursoId: datos.cursoId,
    seccionId: datos.seccionId,
    periodoId: datos.periodoId,
    activo: datos.activo,
    creadoEn: asignacion.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(asignacionActualizada);
  return ok(asignacionActualizada);
}
