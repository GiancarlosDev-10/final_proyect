import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
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

  const asignaciones = await asignacionRepo.listarPorProfesor(profesorId);
  const seccionIds = [...new Set(asignaciones.map((a) => a.seccionId))];

  const matriculas = await matriculaRepo.listarPorSecciones(seccionIds);
  const estudianteIds = [...new Set(matriculas.map((m) => m.estudianteId))];

  const estudiantesFiltrados = await estudianteRepo.buscarPorIds(estudianteIds);

  return <TablaEstudiantesProfesor estudiantes={estudiantesFiltrados.map((e) => e.toPlainObject())} />;
}
