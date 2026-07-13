import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { NotaNoEncontradaError, NotaNoPerteneceAAsignacionError } from "@/modulos/notas/dominio/nota";
import { AsignacionInactivaError } from "@/modulos/asignaciones/dominio/asignacion";
import {
  UnidadDidacticaCerradaError,
  UnidadDidacticaNoEncontradaError,
} from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { Result, ok, err } from "@/compartido/lib/result";

export interface EliminarNotaDTO {
  id: string;
  profesorId: string;
  cursoId: string;
  seccionId: string;
  unidadDidacticaId: string;
}

export async function eliminarNota(
  datos: EliminarNotaDTO,
  notaRepositorio: INotaRepositorio,
  asignacionRepositorio: IAsignacionRepositorio,
  unidadDidacticaRepositorio: IUnidadDidacticaRepositorio
): Promise<Result<void>> {
  const nota = await notaRepositorio.buscarPorId(datos.id);
  if (!nota) return err(new NotaNoEncontradaError(datos.id));

  const unidadDidactica = await unidadDidacticaRepositorio.buscarPorId(datos.unidadDidacticaId);
  if (!unidadDidactica) return err(new UnidadDidacticaNoEncontradaError(datos.unidadDidacticaId));

  const asignacion = await asignacionRepositorio.buscarActiva(
    datos.profesorId,
    datos.cursoId,
    datos.seccionId,
    unidadDidactica.periodoId
  );
  if (!asignacion) return err(new AsignacionInactivaError());

  if (nota.asignacionId !== asignacion.id) return err(new NotaNoPerteneceAAsignacionError());

  if (!unidadDidactica.estaAbierta()) return err(new UnidadDidacticaCerradaError());

  await notaRepositorio.eliminar(datos.id);
  return ok(undefined);
}
