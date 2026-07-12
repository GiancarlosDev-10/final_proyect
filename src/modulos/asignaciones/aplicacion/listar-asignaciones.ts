import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { Asignacion } from "@/modulos/asignaciones/dominio/asignacion";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarAsignaciones(
  repositorio: IAsignacionRepositorio
): Promise<Result<Asignacion[]>> {
  try {
    const asignaciones = await repositorio.listar();
    return ok(asignaciones);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}