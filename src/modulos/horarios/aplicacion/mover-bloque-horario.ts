import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import {
  BloqueHorario,
  BloqueHorarioNoEncontradoError,
  BloqueHorarioSuperpuestoError,
} from "@/modulos/horarios/dominio/bloque-horario";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";
import { DiaSemana } from "@/config/constantes";

export interface MoverBloqueHorarioDTO {
  id: string;
  profesorId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export async function moverBloqueHorario(
  datos: MoverBloqueHorarioDTO,
  repositorio: IBloqueHorarioRepositorio
): Promise<Result<BloqueHorario>> {
  const bloque = await repositorio.buscarPorId(datos.id);
  // Un bloque de otro profesor se trata igual que uno inexistente: no se revela su existencia.
  if (!bloque || bloque.profesorId !== datos.profesorId) {
    return err(new BloqueHorarioNoEncontradoError(datos.id));
  }

  const otrosBloques = (await repositorio.listarPorProfesor(datos.profesorId)).filter((b) => b.id !== bloque.id);
  const seSuperpone = otrosBloques.some((b) => b.seSuperponeCon(datos.diaSemana, datos.horaInicio, datos.horaFin));
  if (seSuperpone) return err(new BloqueHorarioSuperpuestoError());

  try {
    const ahora = new Date().toISOString();

    const bloqueMovido = new BloqueHorario({
      id: bloque.id,
      asignacionId: bloque.asignacionId,
      profesorId: bloque.profesorId,
      diaSemana: datos.diaSemana,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      creadoEn: bloque.creadoEn,
      actualizadoEn: ahora,
    });

    await repositorio.actualizar(bloqueMovido);
    return ok(bloqueMovido);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
