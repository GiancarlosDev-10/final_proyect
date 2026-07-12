import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { UnidadDidactica, UnidadDidacticaNoEncontradaError } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { Result, ok, err } from "@/compartido/lib/result";
import { ESTADOS_UNIDAD_DIDACTICA } from "@/config/constantes";

export async function cerrarUnidadDidactica(
  id: string,
  repositorio: IUnidadDidacticaRepositorio
): Promise<Result<UnidadDidactica>> {
  const unidadDidactica = await repositorio.buscarPorId(id);
  if (!unidadDidactica) return err(new UnidadDidacticaNoEncontradaError(id));

  const ahora = new Date().toISOString();

  const unidadDidacticaCerrada = new UnidadDidactica({
    id: unidadDidactica.id,
    nombre: unidadDidactica.nombre,
    periodoId: unidadDidactica.periodoId,
    estado: ESTADOS_UNIDAD_DIDACTICA.CERRADO,
    creadoEn: unidadDidactica.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(unidadDidacticaCerrada);
  return ok(unidadDidacticaCerrada);
}
