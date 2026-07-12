import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { Matricula, MatriculaNoEncontradaError, MatriculaDuplicadaError } from "@/modulos/matriculas/dominio/matricula";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarMatriculaDTO {
  id: string;
  seccionId: string;
  anio: number;
  activo: boolean;
}

export async function actualizarMatricula(
  datos: ActualizarMatriculaDTO,
  repositorio: IMatriculaRepositorio
): Promise<Result<Matricula>> {
  const matricula = await repositorio.buscarPorId(datos.id);
  if (!matricula) return err(new MatriculaNoEncontradaError(datos.id));

  if (datos.anio !== matricula.anio) {
    const existe = await repositorio.buscarPorEstudianteYAnio(matricula.estudianteId, datos.anio);
    if (existe && existe.id !== matricula.id) return err(new MatriculaDuplicadaError());
  }

  const ahora = new Date().toISOString();

  const matriculaActualizada = new Matricula({
    id: matricula.id,
    estudianteId: matricula.estudianteId,
    seccionId: datos.seccionId,
    anio: datos.anio,
    activo: datos.activo,
    creadoEn: matricula.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(matriculaActualizada);
  return ok(matriculaActualizada);
}
