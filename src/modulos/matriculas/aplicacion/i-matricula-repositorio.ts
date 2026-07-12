import { Matricula } from "@/modulos/matriculas/dominio/matricula";

export interface IMatriculaRepositorio {
  buscarPorId(id: string): Promise<Matricula | null>;
  buscarPorEstudianteYAnio(estudianteId: string, anio: number): Promise<Matricula | null>;
  listar(): Promise<Matricula[]>;
  listarPorSeccion(seccionId: string): Promise<Matricula[]>;
  crear(matricula: Matricula): Promise<void>;
  actualizar(matricula: Matricula): Promise<void>;
  eliminar(id: string): Promise<void>;
}