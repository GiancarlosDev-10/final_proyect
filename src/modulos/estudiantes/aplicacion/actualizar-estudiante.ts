import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import {
  Estudiante,
  EstudianteNoEncontradoError,
  DocumentoDuplicadoError,
  ApoderadoProps,
} from "@/modulos/estudiantes/dominio/estudiante";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

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

  if (datos.documento !== estudiante.documento) {
    const existente = await repositorio.buscarPorDocumento(datos.documento);
    if (existente) return err(new DocumentoDuplicadoError());
  }

  try {
    const ahora = new Date().toISOString();

    const estudianteActualizado = new Estudiante({
      id: estudiante.id,
      documento: datos.documento,
      nombreCompleto: datos.nombreCompleto,
      fechaNacimiento: datos.fechaNacimiento,
      apoderado: datos.apoderado,
      activo: datos.activo,
      fotoBase64: estudiante.fotoBase64,
      fotoContentType: estudiante.fotoContentType,
      encodingFacial: estudiante.encodingFacial,
      encodingActualizadoEn: estudiante.encodingActualizadoEn,
      creadoEn: estudiante.creadoEn,
      actualizadoEn: ahora,
    });

    await repositorio.actualizar(estudianteActualizado);
    return ok(estudianteActualizado);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}