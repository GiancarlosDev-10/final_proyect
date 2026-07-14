import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { UnidadDidactica } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { PeriodoNoEncontradoError } from "@/modulos/periodos/dominio/periodo";
import { calcularFechasUnidadesDidacticas } from "@/modulos/unidades-didacticas/dominio/calcular-fechas-unidades";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ESTADOS_UNIDAD_DIDACTICA } from "@/config/constantes";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface GenerarUnidadesDidacticasDTO {
  cursoId: string;
  periodoId: string;
}

/**
 * Un bimestre siempre tiene exactamente 2 unidades didácticas (una por mes).
 * Si el curso ya tiene sus unidades para ese periodo, las retorna tal cual
 * (idempotente); si no, las crea derivando las fechas del Periodo.
 */
export async function generarUnidadesDidacticas(
  datos: GenerarUnidadesDidacticasDTO,
  repositorio: IUnidadDidacticaRepositorio,
  periodoRepositorio: IPeriodoRepositorio
): Promise<Result<UnidadDidactica[]>> {
  try {
    const existentes = await repositorio.listarPorCursoYPeriodo(datos.cursoId, datos.periodoId);
    if (existentes.length > 0) return ok(existentes);

    const periodo = await periodoRepositorio.buscarPorId(datos.periodoId);
    if (!periodo) return err(new PeriodoNoEncontradoError(datos.periodoId));

    const [rangoUnidad1, rangoUnidad2] = calcularFechasUnidadesDidacticas(periodo.fechaInicio, periodo.fechaFin);
    const ahora = new Date().toISOString();

    const unidad1 = new UnidadDidactica({
      id: generarId("UDI"),
      nombre: "Unidad 1",
      cursoId: datos.cursoId,
      periodoId: datos.periodoId,
      orden: 1,
      fechaInicio: rangoUnidad1.fechaInicio,
      fechaFin: rangoUnidad1.fechaFin,
      estado: ESTADOS_UNIDAD_DIDACTICA.ABIERTO,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    const unidad2 = new UnidadDidactica({
      id: generarId("UDI"),
      nombre: "Unidad 2",
      cursoId: datos.cursoId,
      periodoId: datos.periodoId,
      orden: 2,
      fechaInicio: rangoUnidad2.fechaInicio,
      fechaFin: rangoUnidad2.fechaFin,
      estado: ESTADOS_UNIDAD_DIDACTICA.ABIERTO,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(unidad1);
    await repositorio.crear(unidad2);

    return ok([unidad1, unidad2]);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
