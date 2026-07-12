import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { UnidadDidactica } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarUnidadesDidacticas(
  repositorio: IUnidadDidacticaRepositorio
): Promise<Result<UnidadDidactica[]>> {
  try {
    const unidadesDidacticas = await repositorio.listar();
    return ok(unidadesDidacticas);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
