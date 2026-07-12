import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { MatriculaNoEncontradaError } from "@/modulos/matriculas/dominio/matricula";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarMatricula(
  id: string,
  repositorio: IMatriculaRepositorio
): Promise<Result<void>> {
  const matricula = await repositorio.buscarPorId(id);
  if (!matricula) return err(new MatriculaNoEncontradaError(id));

  await repositorio.eliminar(id);
  return ok(undefined);
}