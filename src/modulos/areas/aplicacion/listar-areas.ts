import { IAreaRepositorio } from "@/modulos/areas/aplicacion/i-area-repositorio";
import { Area } from "@/modulos/areas/dominio/area";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarAreas(
  repositorio: IAreaRepositorio
): Promise<Result<Area[]>> {
  try {
    const areas = await repositorio.listar();
    return ok(areas);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
