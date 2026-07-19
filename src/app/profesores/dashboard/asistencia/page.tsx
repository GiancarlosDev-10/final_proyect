import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ConectorCamara } from "@/app/profesores/dashboard/asistencia/conector-camara";

export default async function AsistenciaProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Asistencia</h1>
        <p className="text-sm text-muted-foreground">
          Conecta la cámara del dispositivo para iniciar el registro de asistencia por reconocimiento facial.
        </p>
      </div>

      <ConectorCamara />
    </div>
  );
}
