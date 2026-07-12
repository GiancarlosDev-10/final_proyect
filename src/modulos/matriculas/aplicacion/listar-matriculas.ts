import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { Matricula } from "@/modulos/matriculas/dominio/matricula";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarMatriculas(
  repositorio: IMatriculaRepositorio
): Promise<Result<Matricula[]>> {
  try {
    const matriculas = await repositorio.listar();
    return ok(matriculas);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}