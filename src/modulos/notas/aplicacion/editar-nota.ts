import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { Nota, NotaNoEncontradaError, NotaNoPerteneceAAsignacionError } from "@/modulos/notas/dominio/nota";
import { AsignacionInactivaError } from "@/modulos/asignaciones/dominio/asignacion";
import { PeriodoCerradoError } from "@/modulos/periodos/dominio/periodo";
import { Result, ok, err } from "@/compartido/lib/result";
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
  periodoId: string;
}

export async function editarNota(
  datos: EditarNotaDTO,
  notaRepositorio: INotaRepositorio,
  asignacionRepositorio: IAsignacionRepositorio,
  periodoRepositorio: IPeriodoRepositorio
): Promise<Result<Nota>> {
  const nota = await notaRepositorio.buscarPorId(datos.id);
  if (!nota) return err(new NotaNoEncontradaError(datos.id));

  const asignacion = await asignacionRepositorio.buscarActiva(
    datos.profesorId,
    datos.cursoId,
    datos.seccionId,
    datos.periodoId
  );
  if (!asignacion) return err(new AsignacionInactivaError());

  if (nota.asignacionId !== asignacion.id) return err(new NotaNoPerteneceAAsignacionError());

  const periodo = await periodoRepositorio.buscarPorId(datos.periodoId);
  if (!periodo || !periodo.estaAbierto()) return err(new PeriodoCerradoError());

  const ahora = new Date().toISOString();

  const notaActualizada = new Nota({
    id: nota.id,
    estudianteId: nota.estudianteId,
    asignacionId: nota.asignacionId,
    periodoId: nota.periodoId,
    tipo: datos.tipo,
    etiqueta: datos.etiqueta,
    valor: datos.valor,
    fecha: datos.fecha,
    creadoEn: nota.creadoEn,
    actualizadoEn: ahora,
  });

  await notaRepositorio.actualizar(notaActualizada);
  return ok(notaActualizada);
}