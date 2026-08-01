import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { Asignacion, AsignacionNoEncontradaError, AsignacionYaExisteError } from "@/modulos/asignaciones/dominio/asignacion";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarAsignacionDTO {
  id: string;
  profesorId: string;
  cursoId: string;
  seccionId: string;
  periodoId: string;
  activo: boolean;
}

export async function actualizarAsignacion(
  datos: ActualizarAsignacionDTO,
  repositorio: IAsignacionRepositorio
): Promise<Result<Asignacion>> {
  const asignacion = await repositorio.buscarPorId(datos.id);
  if (!asignacion) return err(new AsignacionNoEncontradaError(datos.id));

  // Mismo pre-check que crearAsignacion: si el cambio apunta a una
  // combinación profesor+curso+sección+periodo que ya usa OTRA asignación
  // activa, se rechaza con un mensaje claro en vez de chocar contra el
  // índice único de Mongo. Hoy esta función no tiene ningún punto de entrada
  // en la UI (tabla-asignaciones.tsx gestiona ediciones agregando/quitando
  // asignaciones completas), pero replica el mismo hueco que ya se corrigió
  // al crear si alguna vez se conecta.
  const cambiaCombinacion =
    datos.profesorId !== asignacion.profesorId ||
    datos.cursoId !== asignacion.cursoId ||
    datos.seccionId !== asignacion.seccionId ||
    datos.periodoId !== asignacion.periodoId;
  if (cambiaCombinacion) {
    const existente = await repositorio.buscarActiva(datos.profesorId, datos.cursoId, datos.seccionId, datos.periodoId);
    if (existente && existente.id !== asignacion.id) return err(new AsignacionYaExisteError());
  }

  const ahora = new Date().toISOString();

  const asignacionActualizada = new Asignacion({
    id: asignacion.id,
    profesorId: datos.profesorId,
    cursoId: datos.cursoId,
    seccionId: datos.seccionId,
    periodoId: datos.periodoId,
    activo: datos.activo,
    creadoEn: asignacion.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(asignacionActualizada);
  return ok(asignacionActualizada);
}
