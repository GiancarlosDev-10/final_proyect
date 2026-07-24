import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { Curso } from "@/modulos/cursos/dominio/curso";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarCursos(
  repositorio: ICursoRepositorio
): Promise<Result<Curso[]>> {
  try {
    const cursos = await repositorio.listar();
    cursos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return ok(cursos);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}