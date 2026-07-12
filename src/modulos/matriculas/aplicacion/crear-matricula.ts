import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { Matricula, MatriculaDuplicadaError } from "@/modulos/matriculas/dominio/matricula";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";

export interface CrearMatriculaDTO {
  estudianteId: string;
  seccionId: string;
  anio: number;
}

export async function crearMatricula(
  datos: CrearMatriculaDTO,
  repositorio: IMatriculaRepositorio
): Promise<Result<Matricula>> {
  const existe = await repositorio.buscarPorEstudianteYAnio(
    datos.estudianteId,
    datos.anio
  );
  if (existe) return err(new MatriculaDuplicadaError());

  const ahora = new Date().toISOString();

  const matricula = new Matricula({
    id: generarId("MAT"),
    estudianteId: datos.estudianteId,
    seccionId: datos.seccionId,
    anio: datos.anio,
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  await repositorio.crear(matricula);
  return ok(matricula);
}