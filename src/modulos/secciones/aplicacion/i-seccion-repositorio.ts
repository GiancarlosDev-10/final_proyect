import { Seccion } from "@/modulos/secciones/dominio/seccion";

export interface ISeccionRepositorio {
  buscarPorId(id: string): Promise<Seccion | null>;
  listar(): Promise<Seccion[]>;
  crear(seccion: Seccion): Promise<void>;
  actualizar(seccion: Seccion): Promise<void>;
  eliminar(id: string): Promise<void>;
}