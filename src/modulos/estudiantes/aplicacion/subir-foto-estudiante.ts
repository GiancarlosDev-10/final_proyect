import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { Estudiante, EstudianteNoEncontradoError } from "@/modulos/estudiantes/dominio/estudiante";
import { FotoInvalidaError } from "@/modulos/estudiantes/dominio/rostro";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export interface FotoEstudiante {
  bytes: ArrayBuffer;
  contentType: string;
}

/**
 * Punto de entrada del enrolamiento: el admin sube la foto de un alumno desde
 * el panel. Guardamos la imagen (no calculamos el encoding aquí — eso solo lo
 * puede hacer el script de Python con face_recognition/dlib) y invalidamos
 * cualquier encoding anterior, porque ya no corresponde a esta foto.
 */
export async function subirFotoEstudiante(
  estudianteId: string,
  foto: FotoEstudiante,
  repositorio: IEstudianteRepositorio
): Promise<Result<Estudiante>> {
  try {
    if (!TIPOS_PERMITIDOS.includes(foto.contentType)) {
      return err(new FotoInvalidaError("Solo se aceptan imágenes JPEG o PNG."));
    }
    if (foto.bytes.byteLength === 0 || foto.bytes.byteLength > TAMANO_MAXIMO_BYTES) {
      return err(new FotoInvalidaError("La foto debe pesar más de 0 y como máximo 5 MB."));
    }

    const estudiante = await repositorio.buscarPorId(estudianteId);
    if (!estudiante) return err(new EstudianteNoEncontradoError(estudianteId));

    const ahora = new Date().toISOString();
    const actualizado = new Estudiante({
      ...estudiante.toPlainObject(),
      fotoBase64: Buffer.from(foto.bytes).toString("base64"),
      fotoContentType: foto.contentType,
      encodingFacial: null,
      encodingActualizadoEn: null,
      actualizadoEn: ahora,
    });

    await repositorio.actualizar(actualizado);
    return ok(actualizado);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
