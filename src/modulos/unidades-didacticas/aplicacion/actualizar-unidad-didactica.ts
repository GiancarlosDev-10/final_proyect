import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { UnidadDidactica, UnidadDidacticaNoEncontradaError } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarUnidadDidacticaDTO {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export async function actualizarUnidadDidactica(
  datos: ActualizarUnidadDidacticaDTO,
  repositorio: IUnidadDidacticaRepositorio
): Promise<Result<UnidadDidactica>> {
  const unidadDidactica = await repositorio.buscarPorId(datos.id);
  if (!unidadDidactica) return err(new UnidadDidacticaNoEncontradaError(datos.id));

  const ahora = new Date().toISOString();

  const unidadDidacticaActualizada = new UnidadDidactica({
    ...unidadDidactica.toPlainObject(),
    nombre: datos.nombre,
    fechaInicio: datos.fechaInicio,
    fechaFin: datos.fechaFin,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(unidadDidacticaActualizada);
  return ok(unidadDidacticaActualizada);
}
