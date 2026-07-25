import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { TablaEstudiantesProfesor } from "@/app/profesores/dashboard/estudiantes/tabla-estudiantes-profesor";

export default async function EstudiantesProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const profesorId = session.user.id;
  const asignacionRepo = new AsignacionRepositorioMongo();
  const matriculaRepo = new MatriculaRepositorioMongo();
  const estudianteRepo = new EstudianteRepositorioMongo();
  const seccionRepo = new SeccionRepositorioMongo();

  const asignaciones = await asignacionRepo.listarPorProfesor(profesorId);
  const seccionIds = [...new Set(asignaciones.map((a) => a.seccionId))];

  const [matriculas, secciones] = await Promise.all([
    matriculaRepo.listarPorSecciones(seccionIds),
    seccionRepo.listar(),
  ]);

  // Un estudiante puede tener más de una matrícula histórica en tus secciones
  // (años distintos); se queda con la más reciente para mostrar su sección actual.
  const matriculaPorEstudiante = new Map<string, (typeof matriculas)[number]>();
  for (const m of matriculas) {
    const actual = matriculaPorEstudiante.get(m.estudianteId);
    if (!actual || m.anio > actual.anio) matriculaPorEstudiante.set(m.estudianteId, m);
  }

  const estudianteIds = [...matriculaPorEstudiante.keys()];
  const estudiantes = await estudianteRepo.buscarPorIds(estudianteIds);

  const filas = estudiantes.map((e) => {
    const matricula = matriculaPorEstudiante.get(e.id);
    const seccion = matricula ? secciones.find((s) => s.id === matricula.seccionId) : undefined;
    return {
      ...e.toPlainObject(),
      nivel: seccion?.nivel ?? null,
      grado: seccion?.grado ?? null,
      seccionNombre: seccion?.nombre ?? null,
    };
  });

  return <TablaEstudiantesProfesor estudiantes={filas} />;
}
