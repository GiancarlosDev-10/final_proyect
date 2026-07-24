import {
  accionListarEstudiantesParaReportes,
  accionListarAreasParaReportes,
  accionListarPeriodosParaReportes,
  accionListarCursosParaReportes,
  accionListarSeccionesParaReportes,
} from "@/modulos/reportes/presentacion/acciones";
import { ReportesShell } from "@/modulos/reportes/presentacion/reportes-shell";

export default async function ReportesPage() {
  const [estudiantes, areas, periodos, cursos, secciones] = await Promise.all([
    accionListarEstudiantesParaReportes(),
    accionListarAreasParaReportes(),
    accionListarPeriodosParaReportes(),
    accionListarCursosParaReportes(),
    accionListarSeccionesParaReportes(),
  ]);

  return (
    <ReportesShell estudiantes={estudiantes} areas={areas} periodos={periodos} cursos={cursos} secciones={secciones} />
  );
}
