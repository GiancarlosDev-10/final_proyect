import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { AsignacionNoEncontradaError } from "@/modulos/asignaciones/dominio/asignacion";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarAsignacion(
  id: string,
  repositorio: IAsignacionRepositorio
): Promise<Result<void>> {
  const asignacion = await repositorio.buscarPorId(id);
  if (!asignacion) return err(new AsignacionNoEncontradaError(id));

  await repositorio.eliminar(id);
  return ok(undefined);
}