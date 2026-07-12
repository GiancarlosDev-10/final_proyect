import { IAreaRepositorio } from "@/modulos/areas/aplicacion/i-area-repositorio";
import { AreaNoEncontradaError } from "@/modulos/areas/dominio/area";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarArea(
  id: string,
  repositorio: IAreaRepositorio
): Promise<Result<void>> {
  const area = await repositorio.buscarPorId(id);
  if (!area) return err(new AreaNoEncontradaError(id));

  await repositorio.eliminar(id);
  return ok(undefined);
}
