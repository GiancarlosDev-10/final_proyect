import { RegistroAsistencia } from "@/modulos/asistencia/dominio/registro-asistencia";

export interface IRegistroAsistenciaRepositorio {
  buscarPorSesionYEstudiante(sesionId: string, estudianteId: string): Promise<RegistroAsistencia | null>;
  listarPorSesion(sesionId: string): Promise<RegistroAsistencia[]>;
  crear(registro: RegistroAsistencia): Promise<void>;
  actualizar(registro: RegistroAsistencia): Promise<void>;
}
