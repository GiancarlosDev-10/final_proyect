import { accionListarCursos } from "@/modulos/cursos/presentacion/acciones";
import { TablaCursos } from "@/modulos/cursos/presentacion/tabla-cursos";

export default async function CursosPage() {
  const cursos = await accionListarCursos();
  return <TablaCursos cursos={cursos} />;
}