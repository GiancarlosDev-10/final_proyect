import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";
import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";

export type EstudianteResumen = Omit<EstudianteProps, "fotoBase64" | "fotoContentType" | "encodingFacial">;

/**
 * Listado liviano (sin fotoBase64/encodingFacial) para no descargar fotos que
 * la tabla ni siquiera muestra — la foto completa solo se pide al abrir el
 * diálogo de editar un alumno puntual (ver accionObtenerEstudiante).
 */
export async function listarEstudiantesPorSeccion(
  seccionId: string,
  deps: { matriculaRepo: IMatriculaRepositorio; estudianteRepo: IEstudianteRepositorio }
): Promise<EstudianteResumen[]> {
  const matriculas = (await deps.matriculaRepo.listarPorSeccion(seccionId)).filter((m) => m.activo);
  const estudiantes = await deps.estudianteRepo.buscarPorIds(matriculas.map((m) => m.estudianteId));

  return estudiantes
    .filter((e) => e.activo)
    .map((e) => {
      const p = e.toPlainObject();
      return {
        id: p.id,
        documento: p.documento,
        nombreCompleto: p.nombreCompleto,
        fechaNacimiento: p.fechaNacimiento,
        apoderado: p.apoderado,
        activo: p.activo,
        encodingActualizadoEn: p.encodingActualizadoEn,
        creadoEn: p.creadoEn,
        actualizadoEn: p.actualizadoEn,
      };
    })
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
}
