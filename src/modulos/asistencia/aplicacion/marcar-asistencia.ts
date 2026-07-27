import { IRegistroAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-registro-asistencia-repositorio";
import { INotificadorAsistenciaApoderado } from "@/modulos/asistencia/aplicacion/i-notificador-asistencia-apoderado";
import { RegistroAsistencia, JustificacionInvalidaError } from "@/modulos/asistencia/dominio/registro-asistencia";
import { ESTADOS_ASISTENCIA, EstadoAsistencia } from "@/config/constantes";
import { generarId } from "@/compartido/lib/uuid";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

/**
 * Try/catch propio, separado del que gobierna el Result principal: aunque el
 * notificador no debería lanzar nunca (ver INotificadorAsistenciaApoderado),
 * esto es un segundo cinturón de seguridad para que un notificador futuro que
 * se olvide de atrapar sus propios errores no pueda hacer que
 * marcarAsistencia devuelva err(...) sobre un registro que sí se guardó bien.
 */
async function notificarSinRomperNada(
  notificador: INotificadorAsistenciaApoderado | undefined,
  estudianteId: string,
  sesionId: string
): Promise<void> {
  if (!notificador) return;
  try {
    await notificador.notificarPresente(estudianteId, sesionId);
  } catch (e) {
    console.error("Notificador de asistencia falló (no afecta el marcado):", e);
  }
}

export async function marcarAsistencia(
  sesionId: string,
  estudianteId: string,
  estado: EstadoAsistencia,
  repositorio: IRegistroAsistenciaRepositorio,
  notificador?: INotificadorAsistenciaApoderado
): Promise<Result<RegistroAsistencia>> {
  try {
    const existente = await repositorio.buscarPorSesionYEstudiante(sesionId, estudianteId);

    if (estado === ESTADOS_ASISTENCIA.JUSTIFICADO) {
      const estadoActual = existente?.estado ?? ESTADOS_ASISTENCIA.AUSENTE;
      if (estadoActual !== ESTADOS_ASISTENCIA.AUSENTE) {
        return err(new JustificacionInvalidaError());
      }
    }

    const bloqueado = estado === ESTADOS_ASISTENCIA.PRESENTE || estado === ESTADOS_ASISTENCIA.TARDANZA;
    const ahora = new Date().toISOString();
    // Solo se notifica en la transición real hacia PRESENTE — no en cada
    // re-guardado del mismo estado (ej. el profesor reabre el roster).
    const esTransicionAPresente = estado === ESTADOS_ASISTENCIA.PRESENTE && existente?.estado !== ESTADOS_ASISTENCIA.PRESENTE;

    if (existente) {
      const actualizado = new RegistroAsistencia({ ...existente.toPlainObject(), estado, bloqueado, actualizadoEn: ahora });
      await repositorio.actualizar(actualizado);
      if (esTransicionAPresente) await notificarSinRomperNada(notificador, estudianteId, sesionId);
      return ok(actualizado);
    }

    const nuevo = new RegistroAsistencia({
      id: generarId("REG"),
      sesionId,
      estudianteId,
      estado,
      bloqueado,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
    await repositorio.crear(nuevo);
    if (esTransicionAPresente) await notificarSinRomperNada(notificador, estudianteId, sesionId);
    return ok(nuevo);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
