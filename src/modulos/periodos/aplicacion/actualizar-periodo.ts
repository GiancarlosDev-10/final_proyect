import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { Periodo, PeriodoNoEncontradoError } from "@/modulos/periodos/dominio/periodo";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface ActualizarPeriodoDTO {
  id: string;
  nombre: string;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
}

export async function actualizarPeriodo(
  datos: ActualizarPeriodoDTO,
  repositorio: IPeriodoRepositorio
): Promise<Result<Periodo>> {
  const periodo = await repositorio.buscarPorId(datos.id);
  if (!periodo) return err(new PeriodoNoEncontradoError(datos.id));

  try {
    const ahora = new Date().toISOString();

    const periodoActualizado = new Periodo({
      id: periodo.id,
      nombre: datos.nombre,
      anio: datos.anio,
      estado: periodo.estado,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      creadoEn: periodo.creadoEn,
      actualizadoEn: ahora,
    });

    await repositorio.actualizar(periodoActualizado);
    return ok(periodoActualizado);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
