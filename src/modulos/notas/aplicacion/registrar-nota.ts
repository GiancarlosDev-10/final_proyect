import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { Nota } from "@/modulos/notas/dominio/nota";
import { AsignacionInactivaError } from "@/modulos/asignaciones/dominio/asignacion";
import {
  UnidadDidacticaCerradaError,
  UnidadDidacticaNoEncontradaError,
} from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";
import { TipoNota } from "@/config/constantes";

export interface RegistrarNotaDTO {
  estudianteId: string;
  asignacionId: string;
  unidadDidacticaId: string;
  tipo: TipoNota;
  etiqueta: string;
  valor: number;
  fecha: string;
  profesorId: string;
  cursoId: string;
  seccionId: string;
}

export async function registrarNota(
  datos: RegistrarNotaDTO,
  notaRepositorio: INotaRepositorio,
  asignacionRepositorio: IAsignacionRepositorio,
  unidadDidacticaRepositorio: IUnidadDidacticaRepositorio
): Promise<Result<Nota>> {
  const unidadDidactica = await unidadDidacticaRepositorio.buscarPorId(datos.unidadDidacticaId);
  if (!unidadDidactica) return err(new UnidadDidacticaNoEncontradaError(datos.unidadDidacticaId));

  const asignacion = await asignacionRepositorio.buscarActiva(
    datos.profesorId,
    datos.cursoId,
    datos.seccionId,
    unidadDidactica.periodoId
  );
  if (!asignacion) return err(new AsignacionInactivaError());

  if (!unidadDidactica.estaAbierta()) return err(new UnidadDidacticaCerradaError());

  try {
    const ahora = new Date().toISOString();

    const nota = new Nota({
      id: generarId("NOT"),
      estudianteId: datos.estudianteId,
      asignacionId: datos.asignacionId,
      periodoId: unidadDidactica.periodoId,
      unidadDidacticaId: unidadDidactica.id,
      tipo: datos.tipo,
      etiqueta: datos.etiqueta,
      valor: datos.valor,
      fecha: datos.fecha,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await notaRepositorio.crear(nota);
    return ok(nota);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
