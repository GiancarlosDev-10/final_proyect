import { accionListarSecciones } from "@/modulos/secciones/presentacion/acciones";
import { TablaSecciones } from "@/modulos/secciones/presentacion/tabla-secciones";

export default async function SeccionesPage() {
  const secciones = await accionListarSecciones();
  return <TablaSecciones secciones={secciones} />;
}