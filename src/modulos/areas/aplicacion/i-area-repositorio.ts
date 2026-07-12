import { Area } from "@/modulos/areas/dominio/area";

export interface IAreaRepositorio {
  buscarPorId(id: string): Promise<Area | null>;
  listar(): Promise<Area[]>;
  crear(area: Area): Promise<void>;
  actualizar(area: Area): Promise<void>;
  eliminar(id: string): Promise<void>;
}
