import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { crearEstudiante, CrearEstudianteDTO } from "@/modulos/estudiantes/aplicacion/crear-estudiante";
import { crearMatricula } from "@/modulos/matriculas/aplicacion/crear-matricula";
import { Estudiante } from "@/modulos/estudiantes/dominio/estudiante";
import { Result, ok, err } from "@/compartido/lib/result";

export interface CrearEstudianteEnSeccionDTO extends CrearEstudianteDTO {
  seccionId: string;
  anio: number;
}

/**
 * La UI de admin ahora administra estudiantes dentro de una sección
 * seleccionada, así que un alumno nuevo se matricula ahí mismo en el momento
 * de crearlo (en vez de quedar sin sección hasta un paso aparte).
 */
export async function crearEstudianteEnSeccion(
  datos: CrearEstudianteEnSeccionDTO,
  deps: { estudianteRepo: IEstudianteRepositorio; matriculaRepo: IMatriculaRepositorio }
): Promise<Result<Estudiante>> {
  const resultado = await crearEstudiante(datos, deps.estudianteRepo);
  if (!resultado.ok) return resultado;

  const resultadoMatricula = await crearMatricula(
    { estudianteId: resultado.value.id, seccionId: datos.seccionId, anio: datos.anio },
    deps.matriculaRepo
  );
  if (!resultadoMatricula.ok) return err(resultadoMatricula.error);

  return ok(resultado.value);
}
