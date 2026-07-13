import { IRecordatorioRepositorio } from "@/modulos/recordatorios/aplicacion/i-recordatorio-repositorio";
import { Recordatorio, RecordatorioNoEncontradoError } from "@/modulos/recordatorios/dominio/recordatorio";
import { Result, ok, err } from "@/compartido/lib/result";
import { TipoRecordatorio } from "@/config/constantes";

export interface ActualizarRecordatorioDTO {
  id: string;
  profesorId: string;
  fecha: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoRecordatorio;
}

export async function actualizarRecordatorio(
  datos: ActualizarRecordatorioDTO,
  repositorio: IRecordatorioRepositorio
): Promise<Result<Recordatorio>> {
  const recordatorio = await repositorio.buscarPorId(datos.id);
  // Un recordatorio de otro profesor se trata igual que uno inexistente: no se revela su existencia.
  if (!recordatorio || recordatorio.profesorId !== datos.profesorId) {
    return err(new RecordatorioNoEncontradoError(datos.id));
  }

  const ahora = new Date().toISOString();

  const recordatorioActualizado = new Recordatorio({
    id: recordatorio.id,
    profesorId: recordatorio.profesorId,
    fecha: datos.fecha,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    tipo: datos.tipo,
    // horaInicio/horaFin no se editan desde este formulario — se preservan tal cual
    // (arrastrar el recordatorio en el horario es lo único que los cambia, ver moverRecordatorio).
    horaInicio: recordatorio.horaInicio,
    horaFin: recordatorio.horaFin,
    creadoEn: recordatorio.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(recordatorioActualizado);
  return ok(recordatorioActualizado);
}
