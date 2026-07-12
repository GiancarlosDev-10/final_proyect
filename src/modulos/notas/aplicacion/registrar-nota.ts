import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { Nota } from "@/modulos/notas/dominio/nota";
import { AsignacionInactivaError } from "@/modulos/asignaciones/dominio/asignacion";
import { PeriodoCerradoError } from "@/modulos/periodos/dominio/periodo";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { TipoNota } from "@/config/constantes";

export interface RegistrarNotaDTO {
  estudianteId: string;
  asignacionId: string;
  periodoId: string;
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
  periodoRepositorio: IPeriodoRepositorio
): Promise<Result<Nota>> {
  const asignacion = await asignacionRepositorio.buscarActiva(
    datos.profesorId,
    datos.cursoId,
    datos.seccionId,
    datos.periodoId
  );
  if (!asignacion) return err(new AsignacionInactivaError());

  const periodo = await periodoRepositorio.buscarPorId(datos.periodoId);
  if (!periodo || !periodo.estaAbierto()) return err(new PeriodoCerradoError());

  const ahora = new Date().toISOString();

  const nota = new Nota({
    id: generarId("NOT"),
    estudianteId: datos.estudianteId,
    asignacionId: datos.asignacionId,
    periodoId: datos.periodoId,
    tipo: datos.tipo,
    etiqueta: datos.etiqueta,
    valor: datos.valor,
    fecha: datos.fecha,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  await notaRepositorio.crear(nota);
  return ok(nota);
}