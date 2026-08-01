import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  accionListarBloquesDeHoy,
  accionObtenerBloqueParaAsistencia,
  accionAbrirSesion,
  accionListarRoster,
} from "@/app/profesores/dashboard/asistencia/acciones";
import { AsistenciaHoy } from "@/app/profesores/dashboard/asistencia/asistencia-hoy";
import { SesionAsistenciaProps } from "@/modulos/asistencia/dominio/sesion-asistencia";
import { FilaRoster } from "@/modulos/asistencia/aplicacion/listar-roster";
import { BloqueDeHoy } from "@/modulos/asistencia/aplicacion/listar-bloques-de-hoy";

export default async function AsistenciaProfesorPage({
  searchParams,
}: {
  searchParams: Promise<{ bloqueId?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const { bloqueId } = await searchParams;
  const bloquesDeHoy = await accionListarBloquesDeHoy();

  // Si se entra desde un bloque puntual de "Mi Horario" (para probar/tomar
  // asistencia aunque hoy no sea su día real), se antepone a la lista para
  // que quede seleccionado de una vez.
  let bloques: BloqueDeHoy[] = bloquesDeHoy;
  if (bloqueId) {
    const bloqueEspecifico = await accionObtenerBloqueParaAsistencia(bloqueId);
    if (bloqueEspecifico && !bloquesDeHoy.some((b) => b.bloqueHorarioId === bloqueEspecifico.bloqueHorarioId)) {
      bloques = [bloqueEspecifico, ...bloquesDeHoy];
    } else if (bloqueEspecifico) {
      bloques = [bloqueEspecifico, ...bloquesDeHoy.filter((b) => b.bloqueHorarioId !== bloqueEspecifico.bloqueHorarioId)];
    }
  }

  let sesionInicial: SesionAsistenciaProps | null = null;
  let rosterInicial: FilaRoster[] = [];
  if (bloques.length > 0) {
    const resultado = await accionAbrirSesion(bloques[0].bloqueHorarioId);
    if (resultado.ok) {
      sesionInicial = resultado.sesion;
      rosterInicial = await accionListarRoster(resultado.sesion.id);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Asistencia</h1>
        <p className="text-sm text-muted-foreground">
          Revisa la asistencia de tus clases de hoy en tiempo real.
        </p>
      </div>

      <AsistenciaHoy bloques={bloques} sesionInicial={sesionInicial} rosterInicial={rosterInicial} />
    </div>
  );
}
