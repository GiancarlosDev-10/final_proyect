import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { Periodo } from "@/modulos/periodos/dominio/periodo";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarPeriodos(
  repositorio: IPeriodoRepositorio
): Promise<Result<Periodo[]>> {
  try {
    const periodos = await repositorio.listar();
    periodos.sort((a, b) => b.anio - a.anio || a.fechaInicio.localeCompare(b.fechaInicio));
    return ok(periodos);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}