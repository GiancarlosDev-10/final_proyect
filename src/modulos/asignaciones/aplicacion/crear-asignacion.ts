import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { Asignacion, AsignacionYaExisteError } from "@/modulos/asignaciones/dominio/asignacion";
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
  // Antes de intentar el insert, se comprueba explícitamente para devolver un
  // mensaje amigable — sin esto, chocar contra el índice único de Mongo
  // (profesorId+cursoId+seccionId+periodoId) hacía que el error crudo de
  // MongoDB (E11000 duplicate key...) se filtrara tal cual hasta el toast.
  const existente = await repositorio.buscarActiva(datos.profesorId, datos.cursoId, datos.seccionId, datos.periodoId);
  if (existente) return err(new AsignacionYaExisteError());

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