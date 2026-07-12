import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  accionListarMisAsignaciones,
  accionListarEstudiantesProfesor,
  accionListarPeriodosProfesor,
  accionListarCursosProfesor,
  accionListarSeccionesProfesor,
} from "@/app/profesores/dashboard/notas/acciones";
import { TablaNotasProfesor } from "@/app/profesores/dashboard/notas/tabla-notas-profesor";

export default async function NotasProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const [asignaciones, estudiantes, periodos, cursos, secciones] = await Promise.all([
    accionListarMisAsignaciones(),
    accionListarEstudiantesProfesor(),
    accionListarPeriodosProfesor(),
    accionListarCursosProfesor(),
    accionListarSeccionesProfesor(),
  ]);

  return (
    <TablaNotasProfesor
      asignaciones={asignaciones}
      estudiantes={estudiantes}
      periodos={periodos}
      cursos={cursos}
      secciones={secciones}
    />
  );
}