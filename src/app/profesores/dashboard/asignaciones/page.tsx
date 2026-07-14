import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AsignacionesProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const profesorId = session.user.id;
  const asignacionRepo = new AsignacionRepositorioMongo();
  const cursoRepo = new CursoRepositorioMongo();
  const seccionRepo = new SeccionRepositorioMongo();
  const periodoRepo = new PeriodoRepositorioMongo();

  const [asignaciones, cursos, secciones, periodos] = await Promise.all([
    asignacionRepo.listarPorProfesor(profesorId),
    cursoRepo.listar(),
    seccionRepo.listar(),
    periodoRepo.listar(),
  ]);

  const nombreCurso = (id: string) => cursos.find((c) => c.id === id)?.nombre ?? "(curso eliminado)";
  const nombreSeccion = (id: string) => {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  };
  const nombrePeriodo = (id: string) => {
    const p = periodos.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Mis Asignaciones</h1>
        <p className="text-sm text-muted-foreground">Cursos y secciones que tienes a cargo.</p>
      </div>

      <div className="space-y-3 md:hidden">
        {asignaciones.map((a) => (
          <Card key={a.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{nombreCurso(a.cursoId)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {nombreSeccion(a.seccionId)} · {nombrePeriodo(a.periodoId)}
                </p>
              </div>
              {a.activo ? (
                <Badge className="shrink-0 border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
              ) : (
                <Badge variant="secondary" className="shrink-0">Inactivo</Badge>
              )}
            </div>
          </Card>
        ))}
        {asignaciones.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No tienes asignaciones activas.</p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Sección</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asignaciones.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{nombreCurso(a.cursoId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombreSeccion(a.seccionId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombrePeriodo(a.periodoId)}</TableCell>
                  <TableCell>
                    {a.activo ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {asignaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No tienes asignaciones activas.
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
