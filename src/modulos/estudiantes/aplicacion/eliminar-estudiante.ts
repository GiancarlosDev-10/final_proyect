import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { EstudianteNoEncontradoError } from "@/modulos/estudiantes/dominio/estudiante";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarEstudiante(
  id: string,
  repositorio: IEstudianteRepositorio
): Promise<Result<void>> {
  const estudiante = await repositorio.buscarPorId(id);
  if (!estudiante) return err(new EstudianteNoEncontradoError(id));

  await repositorio.eliminar(id);
  return ok(undefined);
}