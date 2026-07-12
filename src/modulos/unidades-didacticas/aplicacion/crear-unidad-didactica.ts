import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { UnidadDidactica } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ESTADOS_UNIDAD_DIDACTICA } from "@/config/constantes";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface CrearUnidadDidacticaDTO {
  nombre: string;
  periodoId: string;
}

export async function crearUnidadDidactica(
  datos: CrearUnidadDidacticaDTO,
  repositorio: IUnidadDidacticaRepositorio
): Promise<Result<UnidadDidactica>> {
  try {
    const ahora = new Date().toISOString();

    const unidadDidactica = new UnidadDidactica({
      id: generarId("UDI"),
      nombre: datos.nombre,
      periodoId: datos.periodoId,
      estado: ESTADOS_UNIDAD_DIDACTICA.ABIERTO,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(unidadDidactica);
    return ok(unidadDidactica);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
