import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { BloqueHorario } from "@/modulos/horarios/dominio/bloque-horario";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export async function listarBloquesHorarioPorProfesor(
  profesorId: string,
  repositorio: IBloqueHorarioRepositorio
): Promise<Result<BloqueHorario[]>> {
  try {
    const bloques = await repositorio.listarPorProfesor(profesorId);
    return ok(bloques);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
