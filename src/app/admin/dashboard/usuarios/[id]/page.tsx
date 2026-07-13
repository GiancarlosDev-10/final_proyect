import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ClipboardList, Users } from "lucide-react";
import { UsuarioRepositorioMongo } from "@/modulos/usuarios/infraestructura/usuario-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function iniciales(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  return partes
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatearFecha(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return fechaISO;
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function DetalleProfesorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.rol !== "ADMIN") {
    redirect("/auth/login");
  }
  const { id } = await params;

  const usuarioRepo = new UsuarioRepositorioMongo();
  const profesor = await usuarioRepo.buscarPorId(id);
  if (!profesor || profesor.rol !== "PROFESOR") notFound();

  const asignacionRepo = new AsignacionRepositorioMongo();
  const [asignaciones, cursos, secciones, periodos] = await Promise.all([
    asignacionRepo.listarPorProfesor(id),
    new CursoRepositorioMongo().listar(),
    new SeccionRepositorioMongo().listar(),
    new PeriodoRepositorioMongo().listar(),
  ]);

  const seccionIds = [...new Set(asignaciones.map((a) => a.seccionId))];
  const cursoIds = new Set(asignaciones.map((a) => a.cursoId));
  const periodoIds = new Set(asignaciones.map((a) => a.periodoId));

  const matriculaRepo = new MatriculaRepositorioMongo();
  const notaRepo = new NotaRepositorioMongo();
  const [matriculas, notas] = await Promise.all([
    matriculaRepo.listarPorSecciones(seccionIds),
    notaRepo.listarPorAsignaciones(asignaciones.map((a) => a.id)),
  ]);
  const alumnosUnicos = new Set(matriculas.filter((m) => m.activo).map((m) => m.estudianteId));
  const promedio = notas.length > 0 ? notas.reduce((s, n) => s + n.valor, 0) / notas.length : null;

  function nombreCurso(cursoId: string) {
    return cursos.find((c) => c.id === cursoId)?.nombre ?? "(curso eliminado)";
  }
  function nombreSeccion(seccionId: string) {
    const s = secciones.find((s) => s.id === seccionId);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }
  function nombrePeriodo(periodoId: string) {
    const p = periodos.find((p) => p.id === periodoId);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  }

  const alumnosPorSeccion = seccionIds.map((sid) => ({
    seccionId: sid,
    total: matriculas.filter((m) => m.activo && m.seccionId === sid).length,
  }));

  const estadisticas = [
    { etiqueta: "Cursos asignados", valor: String(cursoIds.size), icono: BookOpen },
    { etiqueta: "Secciones a cargo", valor: String(seccionIds.length), icono: Users },
    { etiqueta: "Alumnos a cargo", valor: String(alumnosUnicos.size), icono: Users },
    {
      etiqueta: "Evaluaciones registradas",
      valor: promedio !== null ? `${notas.length} · prom. ${promedio.toFixed(1)}` : String(notas.length),
      icono: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <Link href="/admin/dashboard/usuarios" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-3.5" />
          Volver a usuarios
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {iniciales(profesor.nombreCompleto)}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold">{profesor.nombreCompleto}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{profesor.email}</span>
            <span aria-hidden>·</span>
            <Badge variant="outline">PROFESOR</Badge>
            {profesor.activo ? (
              <StatusBadge variant="success">Activo</StatusBadge>
            ) : (
              <StatusBadge variant="neutral">Inactivo</StatusBadge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {estadisticas.map(({ etiqueta, valor, icono: Icono }) => (
          <Card key={etiqueta} className="p-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icono className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{etiqueta}</p>
                <p className="truncate text-lg font-semibold">{valor}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de la cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nombre completo</span>
              <span className="text-right font-medium">{profesor.nombreCompleto}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profesor.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Periodos con dictado</span>
              <span className="font-medium">{periodoIds.size}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Usuario desde</span>
              <span className="font-medium">{formatearFecha(profesor.creadoEn)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alumnos por sección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {alumnosPorSeccion.length === 0 && (
              <p className="text-muted-foreground">No tiene secciones asignadas.</p>
            )}
            {alumnosPorSeccion.map(({ seccionId, total }) => (
              <div key={seccionId} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{nombreSeccion(seccionId)}</span>
                <span className="font-medium">{total} alumnos</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="p-0">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base">Detalle de asignaciones</CardTitle>
          <p className="text-sm font-normal text-muted-foreground">Cursos y secciones que tiene a cargo.</p>
        </CardHeader>
        <CardContent className="p-0 pt-2">
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
                      <StatusBadge variant="success">Activo</StatusBadge>
                    ) : (
                      <StatusBadge variant="neutral">Inactivo</StatusBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {asignaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No tiene asignaciones registradas.
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
