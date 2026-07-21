import { IRegistroAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-registro-asistencia-repositorio";
import { RegistroAsistencia, JustificacionInvalidaError } from "@/modulos/asistencia/dominio/registro-asistencia";
import { ESTADOS_ASISTENCIA, EstadoAsistencia } from "@/config/constantes";
import { generarId } from "@/compartido/lib/uuid";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function marcarAsistencia(
  sesionId: string,
  estudianteId: string,
  estado: EstadoAsistencia,
  repositorio: IRegistroAsistenciaRepositorio
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

    if (existente) {
      const actualizado = new RegistroAsistencia({ ...existente.toPlainObject(), estado, bloqueado, actualizadoEn: ahora });
      await repositorio.actualizar(actualizado);
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
    return ok(nuevo);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
