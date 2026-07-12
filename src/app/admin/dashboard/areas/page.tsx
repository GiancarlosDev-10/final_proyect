import { accionListarAreas } from "@/modulos/areas/presentacion/acciones";
import { TablaAreas } from "@/modulos/areas/presentacion/tabla-areas";

export default async function AreasPage() {
  const areas = await accionListarAreas();
  return <TablaAreas areas={areas} />;
}
