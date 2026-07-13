import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function EstudiantesProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const profesorId = session.user.id;
  const asignacionRepo = new AsignacionRepositorioMongo();
  const matriculaRepo = new MatriculaRepositorioMongo();
  const estudianteRepo = new EstudianteRepositorioMongo();

  const asignaciones = await asignacionRepo.listarPorProfesor(profesorId);
  const seccionIds = [...new Set(asignaciones.map((a) => a.seccionId))];

  const todasMatriculas = await Promise.all(
    seccionIds.map((id) => matriculaRepo.listarPorSeccion(id))
  );
  const matriculas = todasMatriculas.flat();
  const estudianteIds = [...new Set(matriculas.map((m) => m.estudianteId))];

  const estudiantes = await Promise.all(
    estudianteIds.map((id) => estudianteRepo.buscarPorId(id))
  );
  const estudiantesFiltrados = estudiantes.filter(Boolean);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Mis Estudiantes</h1>
        <p className="text-sm text-muted-foreground">Estudiantes matriculados en tus secciones asignadas.</p>
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Apoderado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantesFiltrados.map((e) => e && (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nombreCompleto}</TableCell>
                  <TableCell className="text-muted-foreground">{e.documento}</TableCell>
                  <TableCell className="text-muted-foreground">{e.apoderado.nombre}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Link
                        href={`/profesores/dashboard/estudiantes/${e.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <Eye className="size-3.5" />
                        Ver detalles
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {estudiantesFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No tienes estudiantes asignados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
