import { ISesionAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-sesion-asistencia-repositorio";
import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { SesionAsistencia } from "@/modulos/asistencia/dominio/sesion-asistencia";
import { BloqueHorarioNoEncontradoError } from "@/modulos/horarios/dominio/bloque-horario";
import { sumarMinutos, fechaDeHoyISO } from "@/modulos/asistencia/dominio/tiempo";
import { generarId } from "@/compartido/lib/uuid";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

const TOLERANCIA_TARDANZA_MIN = 5;

export async function abrirSesionAsistencia(
  bloqueHorarioId: string,
  deps: { sesionRepo: ISesionAsistenciaRepositorio; bloqueRepo: IBloqueHorarioRepositorio }
): Promise<Result<SesionAsistencia>> {
  try {
    const fecha = fechaDeHoyISO();
    const existente = await deps.sesionRepo.buscarPorBloqueYFecha(bloqueHorarioId, fecha);
    if (existente) return ok(existente);

    const bloque = await deps.bloqueRepo.buscarPorId(bloqueHorarioId);
    if (!bloque) return err(new BloqueHorarioNoEncontradoError(bloqueHorarioId));

    const ahora = new Date().toISOString();
    const sesion = new SesionAsistencia({
      id: generarId("SES"),
      bloqueHorarioId,
      fecha,
      horaEntrada: bloque.horaInicio,
      horaLimiteTardanza: sumarMinutos(bloque.horaInicio, TOLERANCIA_TARDANZA_MIN),
      horaCierre: bloque.horaFin,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
    await deps.sesionRepo.crear(sesion);
    return ok(sesion);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
