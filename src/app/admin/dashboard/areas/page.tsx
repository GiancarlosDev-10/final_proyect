import { accionListarAreas } from "@/modulos/areas/presentacion/acciones";
import { accionListarCursos } from "@/modulos/cursos/presentacion/acciones";
import { TablaAreas } from "@/modulos/areas/presentacion/tabla-areas";

export default async function AreasPage() {
  const [areas, cursos] = await Promise.all([accionListarAreas(), accionListarCursos()]);

  const cursosPorArea: Record<string, string[]> = {};
  for (const curso of cursos) {
    if (!curso.areaId) continue;
    (cursosPorArea[curso.areaId] ??= []).push(curso.nombre);
  }

  return <TablaAreas areas={areas} cursosPorArea={cursosPorArea} />;
}
