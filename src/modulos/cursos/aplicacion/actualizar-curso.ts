import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { Curso, CursoNoEncontradoError } from "@/modulos/cursos/dominio/curso";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarCursoDTO {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export async function actualizarCurso(
  datos: ActualizarCursoDTO,
  repositorio: ICursoRepositorio
): Promise<Result<Curso>> {
  const curso = await repositorio.buscarPorId(datos.id);
  if (!curso) return err(new CursoNoEncontradoError(datos.id));

  const ahora = new Date().toISOString();

  const cursoActualizado = new Curso({
    id: curso.id,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    activo: datos.activo,
    creadoEn: curso.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(cursoActualizado);
  return ok(cursoActualizado);
}