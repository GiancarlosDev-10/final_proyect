import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { SeccionNoEncontradaError } from "@/modulos/secciones/dominio/seccion";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarSeccion(
  id: string,
  repositorio: ISeccionRepositorio
): Promise<Result<void>> {
  const seccion = await repositorio.buscarPorId(id);
  if (!seccion) return err(new SeccionNoEncontradaError(id));

  await repositorio.eliminar(id);
  return ok(undefined);
}