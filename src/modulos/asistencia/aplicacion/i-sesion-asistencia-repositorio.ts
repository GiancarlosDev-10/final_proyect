import { SesionAsistencia } from "@/modulos/asistencia/dominio/sesion-asistencia";

export interface ISesionAsistenciaRepositorio {
  buscarPorId(id: string): Promise<SesionAsistencia | null>;
  buscarPorBloqueYFecha(bloqueHorarioId: string, fecha: string): Promise<SesionAsistencia | null>;
  crear(sesion: SesionAsistencia): Promise<void>;
  actualizar(sesion: SesionAsistencia): Promise<void>;
}
