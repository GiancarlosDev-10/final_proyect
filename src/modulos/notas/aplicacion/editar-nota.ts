import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { Nota, NotaNoEncontradaError, NotaNoPerteneceAAsignacionError } from "@/modulos/notas/dominio/nota";
import { AsignacionInactivaError } from "@/modulos/asignaciones/dominio/asignacion";
import {
  UnidadDidacticaCerradaError,
  UnidadDidacticaNoEncontradaError,
} from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";
import { TipoNota } from "@/config/constantes";

export interface EditarNotaDTO {
  id: string;
  tipo: TipoNota;
  etiqueta: string;
  valor: number;
  fecha: string;
  profesorId: string;
  cursoId: string;
  seccionId: string;
  unidadDidacticaId: string;
}

export async function editarNota(
  datos: EditarNotaDTO,
  notaRepositorio: INotaRepositorio,
  asignacionRepositorio: IAsignacionRepositorio,
  unidadDidacticaRepositorio: IUnidadDidacticaRepositorio
): Promise<Result<Nota>> {
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

  try {
    const ahora = new Date().toISOString();

    const notaActualizada = new Nota({
      id: nota.id,
      estudianteId: nota.estudianteId,
      asignacionId: nota.asignacionId,
      periodoId: nota.periodoId,
      unidadDidacticaId: nota.unidadDidacticaId,
      tipo: datos.tipo,
      etiqueta: datos.etiqueta,
      valor: datos.valor,
      fecha: datos.fecha,
      creadoEn: nota.creadoEn,
      actualizadoEn: ahora,
    });

    await notaRepositorio.actualizar(notaActualizada);
    return ok(notaActualizada);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
