import {
  accionListarAsignacionesParaNotas,
  accionListarEstudiantesParaNotas,
  accionListarCursosParaNotas,
  accionListarSeccionesParaNotas,
  accionListarPeriodosParaNotas,
  accionListarProfesoresParaNotas,
} from "@/modulos/notas/presentacion/acciones";
import { TablaNotasAdmin } from "@/modulos/notas/presentacion/tabla-notas-admin";

export default async function NotasAdminPage() {
  const [asignaciones, estudiantes, cursos, secciones, periodos, profesores] = await Promise.all([
    accionListarAsignacionesParaNotas(),
    accionListarEstudiantesParaNotas(),
    accionListarCursosParaNotas(),
    accionListarSeccionesParaNotas(),
    accionListarPeriodosParaNotas(),
    accionListarProfesoresParaNotas(),
  ]);

  return (
    <TablaNotasAdmin
      asignaciones={asignaciones}
      estudiantes={estudiantes}
      cursos={cursos}
      secciones={secciones}
      periodos={periodos}
      profesores={profesores}
    />
  );
}
