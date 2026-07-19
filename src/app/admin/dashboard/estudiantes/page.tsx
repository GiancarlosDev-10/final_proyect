import { accionListarEstudiantes } from "@/modulos/estudiantes/presentacion/acciones";
import { TablaEstudiantes } from "@/modulos/estudiantes/presentacion/tabla-estudiantes";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";

export default async function EstudiantesPage() {
  const [estudiantes, matriculas, secciones] = await Promise.all([
    accionListarEstudiantes(),
    new MatriculaRepositorioMongo().listar(),
    new SeccionRepositorioMongo().listar(),
  ]);

  const seccionPorId = new Map(secciones.map((s) => [s.id, `${s.grado} ${s.nombre}`]));
  const seccionPorEstudiante: Record<string, string> = {};
  for (const m of matriculas) {
    const seccionLabel = seccionPorId.get(m.seccionId);
    if (seccionLabel) seccionPorEstudiante[m.estudianteId] = seccionLabel;
  }

  return <TablaEstudiantes estudiantes={estudiantes} seccionPorEstudiante={seccionPorEstudiante} />;
}
