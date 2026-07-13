import { IRecordatorioRepositorio } from "@/modulos/recordatorios/aplicacion/i-recordatorio-repositorio";
import { Recordatorio } from "@/modulos/recordatorios/dominio/recordatorio";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";
import { TipoRecordatorio } from "@/config/constantes";

export interface CrearRecordatorioDTO {
  profesorId: string;
  fecha: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoRecordatorio;
}

export async function crearRecordatorio(
  datos: CrearRecordatorioDTO,
  repositorio: IRecordatorioRepositorio
): Promise<Result<Recordatorio>> {
  try {
    const ahora = new Date().toISOString();

    const recordatorio = new Recordatorio({
      id: generarId("REC"),
      profesorId: datos.profesorId,
      fecha: datos.fecha,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      tipo: datos.tipo,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(recordatorio);
    return ok(recordatorio);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
