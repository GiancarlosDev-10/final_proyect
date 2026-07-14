import {
  accionListarUnidadesDidacticas,
  accionListarCursosParaUnidadesDidacticas,
} from "@/modulos/unidades-didacticas/presentacion/acciones";
import { accionListarPeriodos } from "@/modulos/periodos/presentacion/acciones";
import { TablaUnidadesDidacticas } from "@/modulos/unidades-didacticas/presentacion/tabla-unidades-didacticas";

export default async function UnidadesDidacticasPage() {
  const [unidadesDidacticas, periodos, cursos] = await Promise.all([
    accionListarUnidadesDidacticas(),
    accionListarPeriodos(),
    accionListarCursosParaUnidadesDidacticas(),
  ]);
  return <TablaUnidadesDidacticas unidadesDidacticas={unidadesDidacticas} periodos={periodos} cursos={cursos} />;
}
