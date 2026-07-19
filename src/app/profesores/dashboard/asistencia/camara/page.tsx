import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ConectorCamara } from "@/app/profesores/dashboard/asistencia/camara/conector-camara";

export default async function CamaraAsistenciaPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Conectar cámara</h1>
        <p className="text-sm text-muted-foreground">
          Abre esta página desde el celular que dejarás en la entrada del salón e inicia la cámara para
          comenzar el registro de asistencia.
        </p>
      </div>

      <ConectorCamara />
    </div>
  );
}
