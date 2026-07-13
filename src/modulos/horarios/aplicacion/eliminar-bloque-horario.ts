import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { BloqueHorarioNoEncontradoError } from "@/modulos/horarios/dominio/bloque-horario";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarBloqueHorario(
  id: string,
  profesorId: string,
  repositorio: IBloqueHorarioRepositorio
): Promise<Result<void>> {
  const bloque = await repositorio.buscarPorId(id);
  if (!bloque || bloque.profesorId !== profesorId) {
    return err(new BloqueHorarioNoEncontradoError(id));
  }

  await repositorio.eliminar(id);
  return ok(undefined);
}
