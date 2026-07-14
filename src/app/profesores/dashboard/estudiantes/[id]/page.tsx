import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, CalendarDays, ClipboardList, GraduationCap } from "lucide-react";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TipoNota } from "@/config/constantes";

const ETIQUETAS_TIPO_NOTA: Record<TipoNota, string> = {
  PRACTICA: "Práctica",
  EXAMEN: "Examen",
  TRABAJO: "Trabajo",
  PARTICIPACION: "Participación",
};

const NOTA_APROBATORIA = 11;

function iniciales(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  return partes
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function calcularEdad(fechaNacimiento: string): number | null {
  const [anio, mes, dia] = fechaNacimiento.split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) edad--;
  return edad;
}

function formatearFecha(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-");
  if (!anio || !mes || !dia) return fechaISO;
  return `${dia}/${mes}/${anio}`;
}

export default async function DetalleEstudiantePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }
  const { id } = await params;
  const profesorId = session.user.id;

  const estudianteRepo = new EstudianteRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const matriculaRepo = new MatriculaRepositorioMongo();
  const seccionRepo = new SeccionRepositorioMongo();

  const [estudiante, asignaciones] = await Promise.all([
    estudianteRepo.buscarPorId(id),
    asignacionRepo.listarPorProfesor(profesorId),
  ]);
  if (!estudiante) notFound();

  // Solo puede ver el detalle si el estudiante está matriculado en una de sus secciones.
  const seccionIds = [...new Set(asignaciones.map((a) => a.seccionId))];
  const matriculasDeSecciones = await matriculaRepo.listarPorSecciones(seccionIds);
  const matricula = matriculasDeSecciones
    .filter((m) => m.estudianteId === id)
    .sort((a, b) => b.anio - a.anio)[0];
  if (!matricula) notFound();

  const asignacionIds = new Set(asignaciones.map((a) => a.id));
  const [seccion, cursos, periodos, todasLasNotas] = await Promise.all([
    seccionRepo.buscarPorId(matricula.seccionId),
    new CursoRepositorioMongo().listar(),
    new PeriodoRepositorioMongo().listar(),
    new NotaRepositorioMongo().listarPorEstudiante(id),
  ]);
  const notas = todasLasNotas
    .filter((n) => asignacionIds.has(n.asignacionId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const nombreSeccion = seccion ? `${seccion.grado} ${seccion.nombre}` : "—";
  const edad = calcularEdad(estudiante.fechaNacimiento);
  const promedio = notas.length > 0 ? notas.reduce((s, n) => s + n.valor, 0) / notas.length : null;

  function nombreCurso(asignacionId: string) {
    const a = asignaciones.find((a) => a.id === asignacionId);
    return (a && cursos.find((c) => c.id === a.cursoId)?.nombre) || "(curso eliminado)";
  }

  function nombrePeriodo(periodoId: string) {
    return periodos.find((p) => p.id === periodoId)?.nombre || "—";
  }

  const estadisticas = [
    { etiqueta: "Sección", valor: nombreSeccion, icono: GraduationCap },
    { etiqueta: "Edad", valor: edad !== null ? `${edad} años` : "—", icono: CalendarDays },
    { etiqueta: "Promedio general", valor: promedio !== null ? promedio.toFixed(1) : "—", icono: Award },
    { etiqueta: "Evaluaciones", valor: String(notas.length), icono: ClipboardList },
  ];

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <Link href="/profesores/dashboard/estudiantes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-3.5" />
          Volver a estudiantes
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {iniciales(estudiante.nombreCompleto)}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold">{estudiante.nombreCompleto}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>DNI {estudiante.documento}</span>
            <span aria-hidden>·</span>
            <span>Matrícula {matricula.anio}</span>
            {estudiante.activo ? (
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
            <CardTitle className="text-base">Información personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nombre completo</span>
              <span className="text-right font-medium">{estudiante.nombreCompleto}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Documento</span>
              <span className="font-medium">{estudiante.documento}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Fecha de nacimiento</span>
              <span className="font-medium">{formatearFecha(estudiante.fechaNacimiento)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Sección</span>
              <span className="font-medium">{nombreSeccion}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apoderado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nombre</span>
              <span className="text-right font-medium">{estudiante.apoderado.nombre}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Parentesco</span>
              <span className="font-medium">{estudiante.apoderado.parentesco}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Teléfono</span>
              <a href={`tel:${estudiante.apoderado.telefono}`} className="font-medium text-primary hover:underline">
                {estudiante.apoderado.telefono}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-0">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base">Historial de evaluaciones</CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            Notas registradas en tus cursos. Escala de 0 a 20; aprobatoria desde {NOTA_APROBATORIA}.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-2 md:hidden">
          {notas.map((n) => (
            <Card key={n.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{nombreCurso(n.asignacionId)}</p>
                  <p className="truncate text-sm text-muted-foreground">{n.etiqueta}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {ETIQUETAS_TIPO_NOTA[n.tipo]} · {nombrePeriodo(n.periodoId)} · {formatearFecha(n.fecha)}
                  </p>
                </div>
                <StatusBadge variant={n.valor >= NOTA_APROBATORIA ? "success" : "error"} className="shrink-0">
                  {n.valor}
                </StatusBadge>
              </div>
            </Card>
          ))}
          {notas.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Aún no hay notas registradas para este estudiante en tus cursos.
            </p>
          )}
        </CardContent>
        <CardContent className="hidden p-0 pt-2 md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{nombreCurso(n.asignacionId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombrePeriodo(n.periodoId)}</TableCell>
                  <TableCell className="text-muted-foreground">{ETIQUETAS_TIPO_NOTA[n.tipo]}</TableCell>
                  <TableCell className="text-muted-foreground">{n.etiqueta}</TableCell>
                  <TableCell className="text-muted-foreground">{formatearFecha(n.fecha)}</TableCell>
                  <TableCell className="text-right">
                    <StatusBadge variant={n.valor >= NOTA_APROBATORIA ? "success" : "error"}>
                      {n.valor}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
              {notas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aún no hay notas registradas para este estudiante en tus cursos.
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
