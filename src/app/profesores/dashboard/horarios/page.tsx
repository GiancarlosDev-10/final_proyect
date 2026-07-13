import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { accionListarMiHorario } from "@/app/profesores/dashboard/horarios/acciones";
import {
  accionListarMisAsignaciones,
  accionListarCursosProfesor,
  accionListarSeccionesProfesor,
  accionListarPeriodosProfesor,
} from "@/app/profesores/dashboard/notas/acciones";
import { accionListarMisRecordatorios } from "@/app/profesores/dashboard/recordatorios/acciones";
import { HorarioSemanal } from "@/app/profesores/dashboard/horarios/horario-semanal";

export default async function HorariosProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const [bloques, asignaciones, cursos, secciones, periodos, recordatorios] = await Promise.all([
    accionListarMiHorario(),
    accionListarMisAsignaciones(),
    accionListarCursosProfesor(),
    accionListarSeccionesProfesor(),
    accionListarPeriodosProfesor(),
    accionListarMisRecordatorios(),
  ]);

  return (
    <HorarioSemanal
      bloques={bloques}
      asignaciones={asignaciones}
      cursos={cursos}
      secciones={secciones}
      periodos={periodos}
      recordatorios={recordatorios}
    />
  );
}
