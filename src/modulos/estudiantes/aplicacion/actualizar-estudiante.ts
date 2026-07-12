import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { Estudiante, EstudianteNoEncontradoError, ApoderadoProps } from "@/modulos/estudiantes/dominio/estudiante";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarEstudianteDTO {
  id: string;
  documento: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  apoderado: ApoderadoProps;
  activo: boolean;
}

export async function actualizarEstudiante(
  datos: ActualizarEstudianteDTO,
  repositorio: IEstudianteRepositorio
): Promise<Result<Estudiante>> {
  const estudiante = await repositorio.buscarPorId(datos.id);
  if (!estudiante) return err(new EstudianteNoEncontradoError(datos.id));

  const ahora = new Date().toISOString();

  const estudianteActualizado = new Estudiante({
    id: estudiante.id,
    documento: datos.documento,
    nombreCompleto: datos.nombreCompleto,
    fechaNacimiento: datos.fechaNacimiento,
    apoderado: datos.apoderado,
    activo: datos.activo,
    creadoEn: estudiante.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(estudianteActualizado);
  return ok(estudianteActualizado);
}