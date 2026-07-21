import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { Estudiante, EstudianteNoEncontradoError } from "@/modulos/estudiantes/dominio/estudiante";
import { EncodingInvalidoError } from "@/modulos/estudiantes/dominio/rostro";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

const LONGITUD_ENCODING = 128;

function esEncodingValido(valor: unknown): valor is number[] {
  return (
    Array.isArray(valor) &&
    valor.length === LONGITUD_ENCODING &&
    valor.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

/**
 * El script de enrolamiento de Python calcula el encoding (128 floats, vía
 * face_recognition/dlib) a partir de la foto que descargó y lo sube acá.
 */
export async function guardarEncodingFacial(
  estudianteId: string,
  encoding: unknown,
  repositorio: IEstudianteRepositorio
): Promise<Result<Estudiante>> {
  try {
    if (!esEncodingValido(encoding)) {
      return err(new EncodingInvalidoError());
    }

    const estudiante = await repositorio.buscarPorId(estudianteId);
    if (!estudiante) return err(new EstudianteNoEncontradoError(estudianteId));

    const ahora = new Date().toISOString();
    const actualizado = new Estudiante({
      ...estudiante.toPlainObject(),
      encodingFacial: encoding,
      encodingActualizadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.actualizar(actualizado);
    return ok(actualizado);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
