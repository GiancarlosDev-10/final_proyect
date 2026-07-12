import { accionListarCursos } from "@/modulos/cursos/presentacion/acciones";
import { accionListarAreas } from "@/modulos/areas/presentacion/acciones";
import { TablaCursos } from "@/modulos/cursos/presentacion/tabla-cursos";

export default async function CursosPage() {
  const [cursos, areas] = await Promise.all([accionListarCursos(), accionListarAreas()]);
  return <TablaCursos cursos={cursos} areas={areas} />;
}