import {
  accionListarAsignacionesParaNotas,
  accionListarEstudiantesParaNotas,
  accionListarCursosParaNotas,
  accionListarSeccionesParaNotas,
  accionListarPeriodosParaNotas,
} from "@/modulos/notas/presentacion/acciones";
import { TablaNotasAdmin } from "@/modulos/notas/presentacion/tabla-notas-admin";

export default async function NotasAdminPage() {
  const [asignaciones, estudiantes, cursos, secciones, periodos] = await Promise.all([
    accionListarAsignacionesParaNotas(),
    accionListarEstudiantesParaNotas(),
    accionListarCursosParaNotas(),
    accionListarSeccionesParaNotas(),
    accionListarPeriodosParaNotas(),
  ]);

  return (
    <TablaNotasAdmin
      asignaciones={asignaciones}
      estudiantes={estudiantes}
      cursos={cursos}
      secciones={secciones}
      periodos={periodos}
    />
  );
}
