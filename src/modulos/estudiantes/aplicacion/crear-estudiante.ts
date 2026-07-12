import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { Estudiante, ApoderadoProps } from "@/modulos/estudiantes/dominio/estudiante";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface CrearEstudianteDTO {
  documento: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  apoderado: ApoderadoProps;
}

export async function crearEstudiante(
  datos: CrearEstudianteDTO,
  repositorio: IEstudianteRepositorio
): Promise<Result<Estudiante>> {
  try {
    const ahora = new Date().toISOString();

    const estudiante = new Estudiante({
      id: generarId("EST"),
      documento: datos.documento,
      nombreCompleto: datos.nombreCompleto,
      fechaNacimiento: datos.fechaNacimiento,
      apoderado: datos.apoderado,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(estudiante);
    return ok(estudiante);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}