import { accionListarAsignaciones, accionListarProfesores, accionListarCursosParaAsignacion, accionListarSeccionesParaAsignacion, accionListarPeriodosParaAsignacion } from "@/modulos/asignaciones/presentacion/acciones";
import { accionListarBloquesHorarioPorAsignaciones } from "@/modulos/horarios/presentacion/acciones";
import { TablaAsignaciones } from "@/modulos/asignaciones/presentacion/tabla-asignaciones";

export default async function AsignacionesPage() {
  const [asignaciones, profesores, cursos, secciones, periodos] = await Promise.all([
    accionListarAsignaciones(),
    accionListarProfesores(),
    accionListarCursosParaAsignacion(),
    accionListarSeccionesParaAsignacion(),
    accionListarPeriodosParaAsignacion(),
  ]);
  const bloques = await accionListarBloquesHorarioPorAsignaciones(asignaciones.map((a) => a.id));

  return (
    <TablaAsignaciones
      asignaciones={asignaciones}
      profesores={profesores}
      cursos={cursos}
      secciones={secciones}
      periodos={periodos}
      bloques={bloques}
    />
  );
}