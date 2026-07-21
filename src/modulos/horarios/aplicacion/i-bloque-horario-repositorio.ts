import { BloqueHorario } from "@/modulos/horarios/dominio/bloque-horario";

export interface IBloqueHorarioRepositorio {
  buscarPorId(id: string): Promise<BloqueHorario | null>;
  listarPorProfesor(profesorId: string): Promise<BloqueHorario[]>;
  listarPorAsignaciones(asignacionIds: string[]): Promise<BloqueHorario[]>;
  crear(bloque: BloqueHorario): Promise<void>;
  actualizar(bloque: BloqueHorario): Promise<void>;
  eliminar(id: string): Promise<void>;
}
