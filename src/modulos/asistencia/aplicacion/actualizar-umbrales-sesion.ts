import { ISesionAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-sesion-asistencia-repositorio";
import { SesionAsistencia, SesionAsistenciaNoEncontradaError } from "@/modulos/asistencia/dominio/sesion-asistencia";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface ActualizarUmbralesDTO {
  sesionId: string;
  horaEntrada: string;
  horaLimiteTardanza: string;
  horaCierre: string;
}

export async function actualizarUmbralesSesion(
  datos: ActualizarUmbralesDTO,
  repositorio: ISesionAsistenciaRepositorio
): Promise<Result<SesionAsistencia>> {
  try {
    const existente = await repositorio.buscarPorId(datos.sesionId);
    if (!existente) return err(new SesionAsistenciaNoEncontradaError(datos.sesionId));

    const actualizada = new SesionAsistencia({
      ...existente.toPlainObject(),
      horaEntrada: datos.horaEntrada,
      horaLimiteTardanza: datos.horaLimiteTardanza,
      horaCierre: datos.horaCierre,
      actualizadoEn: new Date().toISOString(),
    });
    await repositorio.actualizar(actualizada);
    return ok(actualizada);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
