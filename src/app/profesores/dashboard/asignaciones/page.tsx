import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { TablaAsignacionesProfesor } from "@/app/profesores/dashboard/asignaciones/tabla-asignaciones-profesor";

export default async function AsignacionesProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const profesorId = session.user.id;
  const asignacionRepo = new AsignacionRepositorioMongo();
  const cursoRepo = new CursoRepositorioMongo();
  const seccionRepo = new SeccionRepositorioMongo();
  const periodoRepo = new PeriodoRepositorioMongo();

  const [asignaciones, cursos, secciones, periodos] = await Promise.all([
    asignacionRepo.listarPorProfesor(profesorId),
    cursoRepo.listar(),
    seccionRepo.listar(),
    periodoRepo.listar(),
  ]);

  return (
    <TablaAsignacionesProfesor
      asignaciones={asignaciones.map((a) => a.toPlainObject())}
      cursos={cursos.map((c) => c.toPlainObject())}
      secciones={secciones.map((s) => s.toPlainObject())}
      periodos={periodos.map((p) => p.toPlainObject())}
    />
  );
}
