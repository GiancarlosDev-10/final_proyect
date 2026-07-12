import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { CursoNoEncontradoError } from "@/modulos/cursos/dominio/curso";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarCurso(
  id: string,
  repositorio: ICursoRepositorio
): Promise<Result<void>> {
  const curso = await repositorio.buscarPorId(id);
  if (!curso) return err(new CursoNoEncontradoError(id));

  await repositorio.eliminar(id);
  return ok(undefined);
}