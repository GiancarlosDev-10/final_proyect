import { IRecordatorioRepositorio } from "@/modulos/recordatorios/aplicacion/i-recordatorio-repositorio";
import { RecordatorioNoEncontradoError } from "@/modulos/recordatorios/dominio/recordatorio";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarRecordatorio(
  id: string,
  profesorId: string,
  repositorio: IRecordatorioRepositorio
): Promise<Result<void>> {
  const recordatorio = await repositorio.buscarPorId(id);
  if (!recordatorio || recordatorio.profesorId !== profesorId) {
    return err(new RecordatorioNoEncontradoError(id));
  }

  await repositorio.eliminar(id);
  return ok(undefined);
}
