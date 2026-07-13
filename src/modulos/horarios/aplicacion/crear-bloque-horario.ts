import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { BloqueHorario, BloqueHorarioSuperpuestoError } from "@/modulos/horarios/dominio/bloque-horario";
import { AsignacionNoEncontradaError } from "@/modulos/asignaciones/dominio/asignacion";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";
import { DiaSemana } from "@/config/constantes";

export interface CrearBloqueHorarioDTO {
  asignacionId: string;
  profesorId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export async function crearBloqueHorario(
  datos: CrearBloqueHorarioDTO,
  repositorio: IBloqueHorarioRepositorio,
  asignacionRepositorio: IAsignacionRepositorio
): Promise<Result<BloqueHorario>> {
  const asignacion = await asignacionRepositorio.buscarPorId(datos.asignacionId);
  if (!asignacion || asignacion.profesorId !== datos.profesorId) {
    return err(new AsignacionNoEncontradaError(datos.asignacionId));
  }

  const bloquesExistentes = await repositorio.listarPorProfesor(datos.profesorId);
  const seSuperpone = bloquesExistentes.some((b) => b.seSuperponeCon(datos.diaSemana, datos.horaInicio, datos.horaFin));
  if (seSuperpone) return err(new BloqueHorarioSuperpuestoError());

  try {
    const ahora = new Date().toISOString();

    const bloque = new BloqueHorario({
      id: generarId("BLH"),
      asignacionId: datos.asignacionId,
      profesorId: datos.profesorId,
      diaSemana: datos.diaSemana,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(bloque);
    return ok(bloque);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
