import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { Periodo, PeriodosAnioYaExistenError } from "@/modulos/periodos/dominio/periodo";
import { calcularFechasPeriodosPredeterminadas } from "@/modulos/periodos/dominio/fechas-predeterminadas";
import { fechaDeHoyISO } from "@/modulos/asistencia/dominio/tiempo";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ESTADOS_PERIODO } from "@/config/constantes";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface GenerarPeriodosAnioDTO {
  anio: number;
}

export async function generarPeriodosAnio(
  datos: GenerarPeriodosAnioDTO,
  repositorio: IPeriodoRepositorio
): Promise<Result<Periodo[]>> {
  try {
    const existentes = await repositorio.listar();
    if (existentes.some((p) => p.anio === datos.anio)) {
      return err(new PeriodosAnioYaExistenError(datos.anio));
    }

    const ahora = new Date().toISOString();
    const hoy = fechaDeHoyISO();
    const periodos = calcularFechasPeriodosPredeterminadas(datos.anio).map(
      (plantilla) =>
        new Periodo({
          id: generarId("PER"),
          nombre: plantilla.nombre,
          anio: datos.anio,
          estado:
            hoy >= plantilla.fechaInicio && hoy <= plantilla.fechaFin
              ? ESTADOS_PERIODO.ABIERTO
              : ESTADOS_PERIODO.CERRADO,
          fechaInicio: plantilla.fechaInicio,
          fechaFin: plantilla.fechaFin,
          creadoEn: ahora,
          actualizadoEn: ahora,
        })
    );

    for (const periodo of periodos) {
      await repositorio.crear(periodo);
    }

    return ok(periodos);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
