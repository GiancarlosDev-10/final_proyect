import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { Asignacion } from "@/modulos/asignaciones/dominio/asignacion";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface CrearAsignacionDTO {
  profesorId: string;
  cursoId: string;
  seccionId: string;
  periodoId: string;
}

export async function crearAsignacion(
  datos: CrearAsignacionDTO,
  repositorio: IAsignacionRepositorio
): Promise<Result<Asignacion>> {
  try {
    const ahora = new Date().toISOString();

    const asignacion = new Asignacion({
      id: generarId("ASI"),
      profesorId: datos.profesorId,
      cursoId: datos.cursoId,
      seccionId: datos.seccionId,
      periodoId: datos.periodoId,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(asignacion);
    return ok(asignacion);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}