import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { NotaNoEncontradaError, NotaNoPerteneceAAsignacionError } from "@/modulos/notas/dominio/nota";
import { AsignacionInactivaError } from "@/modulos/asignaciones/dominio/asignacion";
import { PeriodoCerradoError } from "@/modulos/periodos/dominio/periodo";
import { Result, ok, err } from "@/compartido/lib/result";

export interface EliminarNotaDTO {
  id: string;
  profesorId: string;
  cursoId: string;
  seccionId: string;
  periodoId: string;
}

export async function eliminarNota(
  datos: EliminarNotaDTO,
  notaRepositorio: INotaRepositorio,
  asignacionRepositorio: IAsignacionRepositorio,
  periodoRepositorio: IPeriodoRepositorio
): Promise<Result<void>> {
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

  await notaRepositorio.eliminar(datos.id);
  return ok(undefined);
}