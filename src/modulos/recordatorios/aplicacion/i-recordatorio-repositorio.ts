import { Recordatorio } from "@/modulos/recordatorios/dominio/recordatorio";

export interface IRecordatorioRepositorio {
  buscarPorId(id: string): Promise<Recordatorio | null>;
  listarPorProfesor(profesorId: string): Promise<Recordatorio[]>;
  crear(recordatorio: Recordatorio): Promise<void>;
  actualizar(recordatorio: Recordatorio): Promise<void>;
  eliminar(id: string): Promise<void>;
}
