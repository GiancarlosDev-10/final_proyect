"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { NotaProps } from "@/modulos/notas/dominio/nota";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { UsuarioPublico } from "@/modulos/usuarios/dominio/usuario";
import { accionListarNotasPorAsignacion } from "@/modulos/notas/presentacion/acciones";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ETIQUETAS_TIPO_NOTA } from "@/config/constantes";

interface Props {
  asignaciones: AsignacionProps[];
  estudiantes: EstudianteProps[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  periodos: PeriodoProps[];
  profesores: UsuarioPublico[];
}

const TAMANO_PAGINA = 10;
const TODOS_LOS_PROFESORES = "TODOS";

function TarjetaNota({ nota, nombreEstudiante }: { nota: NotaProps; nombreEstudiante: (id: string) => string }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{nombreEstudiante(nota.estudianteId)}</p>
          <p className="truncate text-sm text-muted-foreground">{ETIQUETAS_TIPO_NOTA[nota.tipo]} · {nota.fecha}</p>
        </div>
        <span className={`shrink-0 text-lg font-semibold ${nota.valor >= 11 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
          {nota.valor}
        </span>
      </div>
    </Card>
  );
}

export function TablaNotasAdmin({ asignaciones, estudiantes, cursos, secciones, periodos, profesores }: Props) {
  const [filtroProfesorId, setFiltroProfesorId] = useState(TODOS_LOS_PROFESORES);
  const [asignacionId, setAsignacionId] = useState("");
  const [notas, setNotas] = useState<NotaProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  function nombreEstudiante(id: string) {
    const e = estudiantes.find((e) => e.id === id);
    return e ? apellidoNombre(e.nombreCompleto) : "(estudiante eliminado)";
  }

  function nombreProfesor(id: string) {
    const p = profesores.find((p) => p.id === id);
    return p ? apellidoNombre(p.nombreCompleto) : "(profesor eliminado)";
  }

  function etiquetaFiltroProfesor(id: string) {
    return id === TODOS_LOS_PROFESORES ? "Todos los profesores" : nombreProfesor(id);
  }

  function nombreAsignacion(a: AsignacionProps) {
    const curso = cursos.find((c) => c.id === a.cursoId)?.nombre ?? "(curso eliminado)";
    const seccion = secciones.find((s) => s.id === a.seccionId);
    const seccionNombre = seccion ? `${seccion.grado} ${seccion.nombre}` : "(sección eliminada)";
    const periodo = periodos.find((p) => p.id === a.periodoId)?.nombre ?? "(periodo eliminado)";
    return `${curso} · ${seccionNombre} · ${periodo}`;
  }

  function nombreAsignacionPorId(id: string) {
    const asignacion = asignaciones.find((a) => a.id === id);
    return asignacion ? nombreAsignacion(asignacion) : "(asignación eliminada)";
  }

  // Filtrar primero por profesor reduce el selector de Asignación (256
  // entradas en total) a solo las que dicta ese profesor, para no tener que
  // buscar a mano entre todas.
  const asignacionesFiltradas = useMemo(() => {
    const base =
      filtroProfesorId === TODOS_LOS_PROFESORES
        ? asignaciones
        : asignaciones.filter((a) => a.profesorId === filtroProfesorId);
    return [...base].sort((a, b) => nombreAsignacion(a).localeCompare(nombreAsignacion(b), "es"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asignaciones, filtroProfesorId, cursos, secciones, periodos]);

  function onCambiarFiltroProfesor(valor: string) {
    setFiltroProfesorId(valor);
    setAsignacionId("");
  }

  async function onBuscar() {
    if (!asignacionId) return;
    setLoading(true);
    const resultado = await accionListarNotasPorAsignacion(asignacionId);
    setNotas(resultado);
    setBuscado(true);
    setBusqueda("");
    setPagina(1);
    setLoading(false);
  }

  const notasFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    const base = !termino
      ? notas
      : notas.filter((n) => normalizarTexto(nombreEstudiante(n.estudianteId)).includes(termino));
    return [...base].sort((a, b) => nombreEstudiante(a.estudianteId).localeCompare(nombreEstudiante(b.estudianteId), "es"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notas, busqueda, estudiantes]);

  const totalPaginas = Math.max(1, Math.ceil(notasFiltradas.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const notasPagina = useMemo(
    () => notasFiltradas.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [notasFiltradas, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Notas</h1>
          <p className="text-sm text-muted-foreground">Consulta las notas registradas por asignación.</p>
        </div>
        <Badge variant="secondary">Solo lectura</Badge>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label>Profesor</Label>
              <Select value={filtroProfesorId} onValueChange={(v) => onCambiarFiltroProfesor(v ?? TODOS_LOS_PROFESORES)} itemToStringLabel={etiquetaFiltroProfesor}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Todos los profesores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS_LOS_PROFESORES}>Todos los profesores</SelectItem>
                  {[...profesores]
                    .sort((a, b) => apellidoNombre(a.nombreCompleto).localeCompare(apellidoNombre(b.nombreCompleto), "es"))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{apellidoNombre(p.nombreCompleto)}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Asignación</Label>
              <Select value={asignacionId} onValueChange={(v) => setAsignacionId(v ?? "")} itemToStringLabel={nombreAsignacionPorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar asignación" />
                </SelectTrigger>
                <SelectContent>
                  {asignacionesFiltradas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{nombreAsignacion(a)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onBuscar} disabled={!asignacionId || loading}>
              <Search className="size-4" />
              {loading ? "Buscando..." : "Ver notas"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {buscado && (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => onCambiarBusqueda(e.target.value)}
              placeholder="Buscar por estudiante..."
              className="pl-8"
            />
          </div>

          <div className="space-y-3 md:hidden">
            {notasPagina.map((n) => (
              <TarjetaNota key={n.id} nota={n} nombreEstudiante={nombreEstudiante} />
            ))}
            {notasFiltradas.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {notas.length === 0 ? "No hay notas para esta asignación." : "Ninguna nota coincide con la búsqueda."}
              </p>
            )}
          </div>

          <Card className="hidden p-0 md:block">
            <CardContent className="p-0">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-56">Estudiante</TableHead>
                    <TableHead className="w-40">Tipo de Prueba</TableHead>
                    <TableHead className="w-24 text-center">Valor</TableHead>
                    <TableHead className="w-32">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notasPagina.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="truncate font-medium">{nombreEstudiante(n.estudianteId)}</TableCell>
                      <TableCell className="text-muted-foreground">{ETIQUETAS_TIPO_NOTA[n.tipo]}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${n.valor >= 11 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                          {n.valor}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{n.fecha}</TableCell>
                    </TableRow>
                  ))}
                  {notasFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        {notas.length === 0 ? "No hay notas para esta asignación." : "Ninguna nota coincide con la búsqueda."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {notasFiltradas.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
                {Math.min(paginaActual * TAMANO_PAGINA, notasFiltradas.length)} de {notasFiltradas.length} notas
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => p - 1)}
                  disabled={paginaActual <= 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={paginaActual >= totalPaginas}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
