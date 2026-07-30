import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IRegistroAsistenciaRepositorio } from "@/modulos/asistencia/aplicacion/i-registro-asistencia-repositorio";
import { IApoderadoVinculadoRepositorio } from "@/modulos/telegram/aplicacion/i-apoderado-vinculado-repositorio";
import { EstudianteNoEncontradoError } from "@/modulos/estudiantes/dominio/estudiante";
import { Result, ok, err } from "@/compartido/lib/result";

export interface EliminarEstudianteRepos {
  estudianteRepo: IEstudianteRepositorio;
  matriculaRepo: IMatriculaRepositorio;
  notaRepo: INotaRepositorio;
  registroAsistenciaRepo: IRegistroAsistenciaRepositorio;
  apoderadoVinculadoRepo: IApoderadoVinculadoRepositorio;
}

/**
 * Borra al estudiante y TODO lo que depende de su id (matrículas, notas,
 * registros de asistencia, vínculo de Telegram del apoderado) — si no, quedan
 * referencias huérfanas ("(estudiante eliminado)") en cada uno de esos
 * módulos.
 */
export async function eliminarEstudiante(id: string, repos: EliminarEstudianteRepos): Promise<Result<void>> {
  const estudiante = await repos.estudianteRepo.buscarPorId(id);
  if (!estudiante) return err(new EstudianteNoEncontradoError(id));

  await Promise.all([
    repos.matriculaRepo.eliminarPorEstudiante(id),
    repos.notaRepo.eliminarPorEstudiante(id),
    repos.registroAsistenciaRepo.eliminarPorEstudiante(id),
    repos.apoderadoVinculadoRepo.eliminarPorEstudiante(id),
  ]);
  await repos.estudianteRepo.eliminar(id);

  return ok(undefined);
}
