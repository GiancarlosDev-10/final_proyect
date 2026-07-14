import { UnidadDidactica } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";

export interface IUnidadDidacticaRepositorio {
  buscarPorId(id: string): Promise<UnidadDidactica | null>;
  listar(): Promise<UnidadDidactica[]>;
  listarPorPeriodo(periodoId: string): Promise<UnidadDidactica[]>;
  listarPorCursoYPeriodo(cursoId: string, periodoId: string): Promise<UnidadDidactica[]>;
  crear(unidadDidactica: UnidadDidactica): Promise<void>;
  actualizar(unidadDidactica: UnidadDidactica): Promise<void>;
  eliminar(id: string): Promise<void>;
}
