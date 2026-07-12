import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { Periodo } from "@/modulos/periodos/dominio/periodo";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ESTADOS_PERIODO } from "@/config/constantes";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface CrearPeriodoDTO {
  nombre: string;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
}

export async function crearPeriodo(
  datos: CrearPeriodoDTO,
  repositorio: IPeriodoRepositorio
): Promise<Result<Periodo>> {
  try {
    const ahora = new Date().toISOString();

    const periodo = new Periodo({
      id: generarId("PER"),
      nombre: datos.nombre,
      anio: datos.anio,
      estado: ESTADOS_PERIODO.ABIERTO,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(periodo);
    return ok(periodo);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}