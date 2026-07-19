import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ScanFace } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

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
          Revisa la asistencia de tus clases de hoy en tiempo real.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ScanFace className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">La vista en vivo de asistencia está en construcción</p>
            <p className="text-sm text-muted-foreground">
              Aquí verás, por bloque de hoy, la lista de tus alumnos con su estado de asistencia
              actualizándose en tiempo real.
            </p>
          </div>
          <Link
            href="/profesores/dashboard/asistencia/camara"
            className={buttonVariants({ variant: "outline" })}
          >
            Conectar cámara
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
