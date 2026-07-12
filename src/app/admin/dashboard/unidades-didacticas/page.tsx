import { accionListarUnidadesDidacticas } from "@/modulos/unidades-didacticas/presentacion/acciones";
import { accionListarPeriodos } from "@/modulos/periodos/presentacion/acciones";
import { TablaUnidadesDidacticas } from "@/modulos/unidades-didacticas/presentacion/tabla-unidades-didacticas";

export default async function UnidadesDidacticasPage() {
  const [unidadesDidacticas, periodos] = await Promise.all([
    accionListarUnidadesDidacticas(),
    accionListarPeriodos(),
  ]);
  return <TablaUnidadesDidacticas unidadesDidacticas={unidadesDidacticas} periodos={periodos} />;
}
