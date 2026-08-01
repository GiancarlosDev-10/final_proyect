import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { Estudiante, ApoderadoProps, DocumentoDuplicadoError } from "@/modulos/estudiantes/dominio/estudiante";
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
  // Sin este chequeo, dos estudiantes con el mismo DNI chocaban contra el
  // índice único de Mongo y el error crudo (E11000 duplicate key) llegaba
  // tal cual al toast del admin.
  const existente = await repositorio.buscarPorDocumento(datos.documento);
  if (existente) return err(new DocumentoDuplicadoError());

  try {
    const ahora = new Date().toISOString();

    const estudiante = new Estudiante({
      id: generarId("EST"),
      documento: datos.documento,
      nombreCompleto: datos.nombreCompleto,
      fechaNacimiento: datos.fechaNacimiento,
      apoderado: datos.apoderado,
      activo: true,
      fotoBase64: null,
      fotoContentType: null,
      encodingFacial: null,
      encodingActualizadoEn: null,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(estudiante);
    return ok(estudiante);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}