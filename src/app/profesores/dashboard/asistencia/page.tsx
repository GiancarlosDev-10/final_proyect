import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { accionListarBloquesDeHoy, accionAbrirSesion, accionListarRoster } from "@/app/profesores/dashboard/asistencia/acciones";
import { AsistenciaHoy } from "@/app/profesores/dashboard/asistencia/asistencia-hoy";
import { SesionAsistenciaProps } from "@/modulos/asistencia/dominio/sesion-asistencia";
import { FilaRoster } from "@/modulos/asistencia/aplicacion/listar-roster";

export default async function AsistenciaProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const bloques = await accionListarBloquesDeHoy();

  // Al entrar, se abre directo la primera clase del día en vez de una pantalla vacía.
  let sesionInicial: SesionAsistenciaProps | null = null;
  let rosterInicial: FilaRoster[] = [];
  if (bloques.length > 0) {
    const resultado = await accionAbrirSesion(bloques[0].bloqueHorarioId);
    if (resultado.ok) {
      sesionInicial = resultado.sesion;
      rosterInicial = await accionListarRoster(resultado.sesion.id, bloques[0].seccionId);
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
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
