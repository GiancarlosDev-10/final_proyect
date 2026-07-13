import {
  accionListarEstudiantesParaReportes,
  accionListarAreasParaReportes,
  accionListarPeriodosParaReportes,
  accionListarCursosParaReportes,
  accionListarUnidadesDidacticasParaReportes,
} from "@/modulos/reportes/presentacion/acciones";
import { TablaReportePromedios } from "@/modulos/reportes/presentacion/tabla-reporte-promedios";

export default async function ReportesPage() {
  const [estudiantes, areas, periodos, cursos, unidadesDidacticas] = await Promise.all([
    accionListarEstudiantesParaReportes(),
    accionListarAreasParaReportes(),
    accionListarPeriodosParaReportes(),
    accionListarCursosParaReportes(),
    accionListarUnidadesDidacticasParaReportes(),
  ]);

  return (
    <TablaReportePromedios
      estudiantes={estudiantes}
      areas={areas}
      periodos={periodos}
      cursos={cursos}
      unidadesDidacticas={unidadesDidacticas}
    />
  );
}
