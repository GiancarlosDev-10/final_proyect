import { Nota } from "@/modulos/notas/dominio/nota";

export interface INotaRepositorio {
  buscarPorId(id: string): Promise<Nota | null>;
  listarPorAsignacion(asignacionId: string): Promise<Nota[]>;
  listarPorAsignaciones(asignacionIds: string[]): Promise<Nota[]>;
  listarPorEstudiante(estudianteId: string): Promise<Nota[]>;
  listarPorPeriodo(periodoId: string): Promise<Nota[]>;
  crear(nota: Nota): Promise<void>;
  actualizar(nota: Nota): Promise<void>;
  eliminar(id: string): Promise<void>;
}