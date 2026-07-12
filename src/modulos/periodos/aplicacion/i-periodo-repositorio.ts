import { Periodo } from "@/modulos/periodos/dominio/periodo";

export interface IPeriodoRepositorio {
  buscarPorId(id: string): Promise<Periodo | null>;
  listar(): Promise<Periodo[]>;
  crear(periodo: Periodo): Promise<void>;
  actualizar(periodo: Periodo): Promise<void>;
  eliminar(id: string): Promise<void>;
}