import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { Seccion } from "@/modulos/secciones/dominio/seccion";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarSecciones(
  repositorio: ISeccionRepositorio
): Promise<Result<Seccion[]>> {
  try {
    const secciones = await repositorio.listar();
    return ok(secciones);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}