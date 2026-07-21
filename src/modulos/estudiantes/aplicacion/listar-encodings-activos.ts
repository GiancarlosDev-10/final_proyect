import { IEstudianteRepositorio } from "@/modulos/estudiantes/aplicacion/i-estudiante-repositorio";

export interface EncodingConocido {
  estudianteId: string;
  encoding: number[];
}

/**
 * Base de rostros conocidos que descarga el script de reconocimiento en
 * tiempo real para comparar contra cada frame de la cámara.
 */
export async function listarEncodingsActivos(repositorio: IEstudianteRepositorio): Promise<EncodingConocido[]> {
  const estudiantes = await repositorio.listar();
  return estudiantes
    .filter((e) => e.activo && e.encodingFacial)
    .map((e) => ({ estudianteId: e.id, encoding: e.encodingFacial as number[] }));
}
