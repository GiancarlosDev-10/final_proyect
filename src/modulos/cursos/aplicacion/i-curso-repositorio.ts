import { Curso } from "@/modulos/cursos/dominio/curso";

export interface ICursoRepositorio {
  buscarPorId(id: string): Promise<Curso | null>;
  listar(): Promise<Curso[]>;
  crear(curso: Curso): Promise<void>;
  actualizar(curso: Curso): Promise<void>;
  eliminar(id: string): Promise<void>;
}