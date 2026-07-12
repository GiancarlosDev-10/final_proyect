import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { Nota } from "@/modulos/notas/dominio/nota";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarNotasPorAsignacion(
  asignacionId: string,
  repositorio: INotaRepositorio
): Promise<Result<Nota[]>> {
  try {
    const notas = await repositorio.listarPorAsignacion(asignacionId);
    return ok(notas);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}