import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { Estudiante } from "@/modulos/estudiantes/dominio/estudiante";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarEstudiantes(
  repositorio: IEstudianteRepositorio
): Promise<Result<Estudiante[]>> {
  try {
    const estudiantes = await repositorio.listar();
    return ok(estudiantes);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}