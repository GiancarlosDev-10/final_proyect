import { IRecordatorioRepositorio } from "@/modulos/recordatorios/aplicacion/i-recordatorio-repositorio";
import { Recordatorio } from "@/modulos/recordatorios/dominio/recordatorio";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarRecordatoriosPorProfesor(
  profesorId: string,
  repositorio: IRecordatorioRepositorio
): Promise<Result<Recordatorio[]>> {
  try {
    const recordatorios = await repositorio.listarPorProfesor(profesorId);
    return ok(recordatorios);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
