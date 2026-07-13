import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { Periodo, PeriodoNoEncontradoError } from "@/modulos/periodos/dominio/periodo";
import { UnidadDidacticaAbiertaError } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { Result, ok, err } from "@/compartido/lib/result";
import { ESTADOS_PERIODO } from "@/config/constantes";

export async function cerrarPeriodo(
  id: string,
  repositorio: IPeriodoRepositorio,
  unidadDidacticaRepositorio: IUnidadDidacticaRepositorio
): Promise<Result<Periodo>> {
  const periodo = await repositorio.buscarPorId(id);
  if (!periodo) return err(new PeriodoNoEncontradoError(id));

  const unidades = await unidadDidacticaRepositorio.listarPorPeriodo(id);
  if (unidades.some((u) => u.estaAbierta())) return err(new UnidadDidacticaAbiertaError());

  const ahora = new Date().toISOString();

  const periodoCerrado = new Periodo({
    id: periodo.id,
    nombre: periodo.nombre,
    anio: periodo.anio,
    estado: ESTADOS_PERIODO.CERRADO,
    fechaInicio: periodo.fechaInicio,
    fechaFin: periodo.fechaFin,
    creadoEn: periodo.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(periodoCerrado);
  return ok(periodoCerrado);
}
