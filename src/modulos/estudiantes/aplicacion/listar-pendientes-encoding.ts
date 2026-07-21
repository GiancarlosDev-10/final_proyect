import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";

export interface PendienteEncoding {
  estudianteId: string;
  fotoBase64: string;
  fotoContentType: string;
}

/**
 * Alumnos con foto subida por el admin pero todavía sin encoding calculado —
 * el script de enrolamiento de Python los descarga, calcula el encoding y lo
 * sube de vuelta con guardarEncodingFacial.
 */
export async function listarPendientesEncoding(repositorio: IEstudianteRepositorio): Promise<PendienteEncoding[]> {
  const estudiantes = await repositorio.listar();
  return estudiantes
    .filter((e) => e.activo && e.fotoBase64 && e.fotoContentType && !e.encodingFacial)
    .map((e) => ({
      estudianteId: e.id,
      fotoBase64: e.fotoBase64 as string,
      fotoContentType: e.fotoContentType as string,
    }));
}
