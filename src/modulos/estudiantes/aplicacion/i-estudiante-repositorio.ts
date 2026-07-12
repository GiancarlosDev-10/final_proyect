import { Estudiante } from "@/modulos/estudiantes/dominio/estudiante";

export interface IEstudianteRepositorio {
  buscarPorId(id: string): Promise<Estudiante | null>;
  listar(): Promise<Estudiante[]>;
  crear(estudiante: Estudiante): Promise<void>;
  actualizar(estudiante: Estudiante): Promise<void>;
  eliminar(id: string): Promise<void>;
}