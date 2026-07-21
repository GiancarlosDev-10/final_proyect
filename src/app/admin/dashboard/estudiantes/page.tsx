import { TablaEstudiantes } from "@/modulos/estudiantes/presentacion/tabla-estudiantes";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";

export default async function EstudiantesPage() {
  const secciones = await new SeccionRepositorioMongo().listar();
  const seccionesActivas = secciones.filter((s) => s.activo).map((s) => s.toPlainObject());

  return <TablaEstudiantes secciones={seccionesActivas} />;
}
