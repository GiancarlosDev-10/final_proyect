import { Asignacion } from "@/modulos/asignaciones/dominio/asignacion";

export interface IAsignacionRepositorio {
  buscarPorId(id: string): Promise<Asignacion | null>;
  buscarActiva(profesorId: string, cursoId: string, seccionId: string, periodoId: string): Promise<Asignacion | null>;
  listar(): Promise<Asignacion[]>;
  listarPorProfesor(profesorId: string): Promise<Asignacion[]>;
  crear(asignacion: Asignacion): Promise<void>;
  actualizar(asignacion: Asignacion): Promise<void>;
  eliminar(id: string): Promise<void>;
}