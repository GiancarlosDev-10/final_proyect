import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { Curso } from "@/modulos/cursos/dominio/curso";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface CrearCursoDTO {
  nombre: string;
  descripcion?: string;
}

export async function crearCurso(
  datos: CrearCursoDTO,
  repositorio: ICursoRepositorio
): Promise<Result<Curso>> {
  try {
    const ahora = new Date().toISOString();

    const curso = new Curso({
      id: generarId("CUR"),
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(curso);
    return ok(curso);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}