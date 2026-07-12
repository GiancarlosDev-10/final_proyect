import { accionListarEstudiantes } from "@/modulos/estudiantes/presentacion/acciones";
import { TablaEstudiantes } from "@/modulos/estudiantes/presentacion/tabla-estudiantes";

export default async function EstudiantesPage() {
  const estudiantes = await accionListarEstudiantes();
  return <TablaEstudiantes estudiantes={estudiantes} />;
}