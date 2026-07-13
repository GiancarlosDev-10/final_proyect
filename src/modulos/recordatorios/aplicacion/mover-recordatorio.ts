import { IRecordatorioRepositorio } from "@/modulos/recordatorios/aplicacion/i-recordatorio-repositorio";
import { Recordatorio, RecordatorioNoEncontradoError } from "@/modulos/recordatorios/dominio/recordatorio";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface MoverRecordatorioDTO {
  id: string;
  profesorId: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
}

/**
 * Arrastrar un recordatorio en el horario: cambia su fecha (se reprograma de verdad)
 * y, si se suelta sobre una casilla de hora, le asigna horaInicio/horaFin; si se
 * suelta en la fila de "Recordatorios" del día, los deja sin asignar.
 * No valida superposición: un recordatorio es informativo, puede coexistir con
 * clases u otros recordatorios en el mismo horario.
 */
export async function moverRecordatorio(
  datos: MoverRecordatorioDTO,
  repositorio: IRecordatorioRepositorio
): Promise<Result<Recordatorio>> {
  const recordatorio = await repositorio.buscarPorId(datos.id);
  if (!recordatorio || recordatorio.profesorId !== datos.profesorId) {
    return err(new RecordatorioNoEncontradoError(datos.id));
  }

  try {
    const ahora = new Date().toISOString();

    const recordatorioMovido = new Recordatorio({
      id: recordatorio.id,
      profesorId: recordatorio.profesorId,
      fecha: datos.fecha,
      titulo: recordatorio.titulo,
      descripcion: recordatorio.descripcion,
      tipo: recordatorio.tipo,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      creadoEn: recordatorio.creadoEn,
      actualizadoEn: ahora,
    });

    await repositorio.actualizar(recordatorioMovido);
    return ok(recordatorioMovido);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
