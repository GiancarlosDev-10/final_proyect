"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical, Search, ChevronLeft, ChevronRight, ChevronDown, CalendarClock } from "lucide-react";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { UsuarioPublico } from "@/modulos/usuarios/dominio/usuario";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { compararSecciones } from "@/modulos/secciones/dominio/orden-secciones";
import { accionCrearAsignacion, accionEliminarAsignacion } from "@/modulos/asignaciones/presentacion/acciones";
import {
  accionCrearBloqueHorarioAdmin,
  accionEliminarBloqueHorarioAdmin,
} from "@/modulos/horarios/presentacion/acciones";
import { BloqueHorarioProps } from "@/modulos/horarios/dominio/bloque-horario";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";
import { ETIQUETAS_NIVEL_EDUCATIVO, ORDEN_DIAS_SEMANA, ETIQUETAS_DIA_SEMANA, PERIODOS_HORARIO, DiaSemana } from "@/config/constantes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  asignaciones: AsignacionProps[];
  profesores: UsuarioPublico[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  periodos: PeriodoProps[];
  bloques: BloqueHorarioProps[];
}

interface GrupoAsignacion {
  clave: string;
  profesorId: string;
  cursoId: string;
  periodoId: string;
  miembros: AsignacionProps[];
}

const TAMANO_PAGINA = 10;
const TODOS_LOS_PERIODOS = "TODOS";
const TODOS_LOS_PROFESORES = "TODOS";

function TarjetaGrupo({
  grupo,
  nombreProfesor,
  nombreCurso,
  nombrePeriodo,
  mostrarPeriodo,
  textoSecciones,
  onEditar,
  onHorarios,
  onEliminar,
}: {
  grupo: GrupoAsignacion;
  nombreProfesor: (id: string) => string;
  nombreCurso: (id: string) => string;
  nombrePeriodo: (id: string) => string;
  mostrarPeriodo: boolean;
  textoSecciones: (grupo: GrupoAsignacion) => string;
  onEditar: (grupo: GrupoAsignacion) => void;
  onHorarios: (grupo: GrupoAsignacion) => void;
  onEliminar: (grupo: GrupoAsignacion) => void;
}) {
  const todasActivas = grupo.miembros.every((m) => m.activo);
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{nombreProfesor(grupo.profesorId)}</p>
          <p className="truncate text-sm text-muted-foreground">
            {nombreCurso(grupo.cursoId)}
            {mostrarPeriodo ? ` · ${nombrePeriodo(grupo.periodoId)}` : ""}
          </p>
          <p className="truncate text-sm text-muted-foreground">{textoSecciones(grupo)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(grupo)}>
              <Pencil className="size-4" />
              Editar secciones
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHorarios(grupo)}>
              <CalendarClock className="size-4" />
              Horarios
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onEliminar(grupo)}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {todasActivas ? (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaAsignaciones({ asignaciones, profesores, cursos, secciones, periodos, bloques }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtroPeriodoId, setFiltroPeriodoId] = useState(
    () => periodos.find((p) => p.estado === "ABIERTO")?.id ?? TODOS_LOS_PERIODOS
  );
  const [filtroProfesorId, setFiltroProfesorId] = useState(TODOS_LOS_PROFESORES);

  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState<GrupoAsignacion | null>(null);
  const [form, setForm] = useState({ profesorId: "", cursoId: "", periodoId: "", seccionIds: [] as string[] });

  // Solo las secciones que ya estaban en el grupo (antes de este envío) se
  // quitan de "a agregar" — el resto (recién marcadas) hay que crearlas.
  const idsOriginales = useMemo(
    () => (grupoEditando ? grupoEditando.miembros.map((m) => m.seccionId) : []),
    [grupoEditando]
  );

  // Solo aplica en "Nueva Asignación" (grupoEditando null): si el profesor ya
  // dicta este curso en esta sección y periodo, marcarla de nuevo solo iba a
  // fallar contra el índice único con el error crudo de Mongo — mejor
  // deshabilitarla acá y mandar al admin a "Editar secciones"/"Horarios".
  const seccionIdsYaAsignadas = useMemo(() => {
    if (grupoEditando || !form.profesorId || !form.cursoId || !form.periodoId) return new Set<string>();
    return new Set(
      asignaciones
        .filter(
          (a) =>
            a.profesorId === form.profesorId &&
            a.cursoId === form.cursoId &&
            a.periodoId === form.periodoId &&
            a.activo
        )
        .map((a) => a.seccionId)
    );
  }, [asignaciones, grupoEditando, form.profesorId, form.cursoId, form.periodoId]);

  // "Horarios" es un modal aparte (no parte de "Editar secciones") porque un
  // profesor puede dictar el mismo curso a 10 secciones a la vez, y meter el
  // horario de las 10 en el mismo diálogo lo volvía interminable. Acá cada
  // sección es una fila colapsable (acordeón), una a la vez.
  const [horarioAbierto, setHorarioAbierto] = useState(false);
  const [grupoHorarios, setGrupoHorarios] = useState<GrupoAsignacion | null>(null);
  const [seccionExpandida, setSeccionExpandida] = useState<string | null>(null);
  const [borradorPorSeccion, setBorradorPorSeccion] = useState<Record<string, string>>({});

  // El horario es del profesor, no del curso — dos clases (aunque sean de
  // cursos distintos) no pueden compartir día y hora. Por eso se compara
  // contra TODOS los bloques del profesor, no solo los de esta asignación.
  const bloquesDelProfesor = useMemo(
    () => bloques.filter((b) => b.profesorId === grupoHorarios?.profesorId),
    [bloques, grupoHorarios]
  );

  // Por sección (no un solo listado compartido): un horario puede estar
  // libre para el profesor pero ya ocupado en ESA sección por otra clase (de
  // otro profesor) — antes solo se miraba el choque de profesor acá, así que
  // el admin podía ver un horario como "libre" y recién enterarse del choque
  // de sección al confirmar "Agregar" (el backend sí lo bloqueaba bien, esto
  // es para que la propia lista ya no lo ofrezca como opción).
  function opcionesLibresParaSeccion(miembro: AsignacionProps): { dia: DiaSemana; periodo: (typeof PERIODOS_HORARIO)[number] }[] {
    const asignacionesDeLaSeccion = asignaciones.filter(
      (a) => a.seccionId === miembro.seccionId && a.periodoId === miembro.periodoId && a.activo && a.id !== miembro.id
    );
    const idsAsignacionesDeLaSeccion = new Set(asignacionesDeLaSeccion.map((a) => a.id));
    const bloquesDeLaSeccion = bloques.filter((b) => idsAsignacionesDeLaSeccion.has(b.asignacionId));

    const libres: { dia: DiaSemana; periodo: (typeof PERIODOS_HORARIO)[number] }[] = [];
    for (const dia of ORDEN_DIAS_SEMANA) {
      for (const periodo of PERIODOS_HORARIO) {
        const ocupadoPorProfesor = bloquesDelProfesor.some(
          (b) => b.diaSemana === dia && b.horaInicio < periodo.horaFin && periodo.horaInicio < b.horaFin
        );
        const ocupadoPorSeccion = bloquesDeLaSeccion.some(
          (b) => b.diaSemana === dia && b.horaInicio < periodo.horaFin && periodo.horaInicio < b.horaFin
        );
        if (!ocupadoPorProfesor && !ocupadoPorSeccion) libres.push({ dia, periodo });
      }
    }
    return libres;
  }

  function abrirHorarios(grupo: GrupoAsignacion) {
    setGrupoHorarios(grupo);
    setSeccionExpandida(null);
    setBorradorPorSeccion({});
    setHorarioAbierto(true);
  }

  async function onAgregarBloque(asignacionId: string, seccionId: string) {
    if (!grupoHorarios) return;
    const valor = borradorPorSeccion[seccionId];
    if (!valor) {
      toast.error("Elige un horario disponible.");
      return;
    }
    const [dia, horaInicio] = valor.split("|");
    const periodo = PERIODOS_HORARIO.find((p) => p.horaInicio === horaInicio);
    if (!periodo) return;

    const resultado = await accionCrearBloqueHorarioAdmin({
      profesorId: grupoHorarios.profesorId,
      asignacionId,
      diaSemana: dia as DiaSemana,
      horaInicio: periodo.horaInicio,
      horaFin: periodo.horaFin,
    });
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setBorradorPorSeccion((prev) => ({ ...prev, [seccionId]: "" }));
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
  }

  async function onEliminarBloque(bloqueId: string) {
    if (!grupoHorarios) return;
    const resultado = await accionEliminarBloqueHorarioAdmin({ id: bloqueId, profesorId: grupoHorarios.profesorId });
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
  }

  function nombreProfesor(id: string) {
    const p = profesores.find((p) => p.id === id);
    return p ? apellidoNombre(p.nombreCompleto) : "(profesor eliminado)";
  }

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre || "(curso eliminado)";
  }

  function nombreSeccion(id: string) {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  }

  function etiquetaFiltroPeriodo(id: string) {
    return id === TODOS_LOS_PERIODOS ? "Todos los periodos" : nombrePeriodo(id);
  }

  function etiquetaFiltroProfesor(id: string) {
    return id === TODOS_LOS_PROFESORES ? "Todos los profesores" : nombreProfesor(id);
  }

  function textoSecciones(grupo: GrupoAsignacion) {
    return [...grupo.miembros]
      .map((m) => secciones.find((s) => s.id === m.seccionId))
      .filter((s): s is SeccionProps => !!s)
      .sort(compararSecciones)
      .map((s) => `${s.grado} ${s.nombre}`)
      .join(", ");
  }

  // Un profesor puede dictar el mismo curso a varias secciones a la vez; se
  // agrupan por profesor+curso+periodo para no repetir esa fila una vez por
  // cada sección (llegaba a ocupar toda la primera página con un solo nombre).
  const grupos = useMemo(() => {
    const porClave = new Map<string, AsignacionProps[]>();
    for (const a of asignaciones) {
      if (filtroPeriodoId !== TODOS_LOS_PERIODOS && a.periodoId !== filtroPeriodoId) continue;
      if (filtroProfesorId !== TODOS_LOS_PROFESORES && a.profesorId !== filtroProfesorId) continue;
      const clave = `${a.profesorId}|${a.cursoId}|${a.periodoId}`;
      const miembros = porClave.get(clave) ?? [];
      miembros.push(a);
      porClave.set(clave, miembros);
    }
    return Array.from(porClave.entries()).map(([clave, miembros]) => ({
      clave,
      profesorId: miembros[0].profesorId,
      cursoId: miembros[0].cursoId,
      periodoId: miembros[0].periodoId,
      miembros,
    }));
  }, [asignaciones, filtroPeriodoId, filtroProfesorId]);

  const gruposFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    const base = !termino
      ? grupos
      : grupos.filter(
          (g) =>
            normalizarTexto(nombreProfesor(g.profesorId)).includes(termino) ||
            normalizarTexto(nombreCurso(g.cursoId)).includes(termino) ||
            normalizarTexto(nombrePeriodo(g.periodoId)).includes(termino) ||
            g.miembros.some((m) => normalizarTexto(nombreSeccion(m.seccionId)).includes(termino))
        );
    return [...base].sort((a, b) => nombreProfesor(a.profesorId).localeCompare(nombreProfesor(b.profesorId), "es"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupos, busqueda, profesores, cursos, secciones, periodos]);

  const totalPaginas = Math.max(1, Math.ceil(gruposFiltrados.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const gruposPagina = useMemo(
    () => gruposFiltrados.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [gruposFiltrados, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  function onCambiarFiltroPeriodo(valor: string) {
    setFiltroPeriodoId(valor);
    setPagina(1);
  }

  function onCambiarFiltroProfesor(valor: string) {
    setFiltroProfesorId(valor);
    setPagina(1);
  }

  function abrirCrear() {
    setGrupoEditando(null);
    setForm({
      profesorId: "",
      cursoId: "",
      periodoId: filtroPeriodoId !== TODOS_LOS_PERIODOS ? filtroPeriodoId : "",
      seccionIds: [],
    });
    setAbierto(true);
  }

  function abrirEditar(grupo: GrupoAsignacion) {
    setGrupoEditando(grupo);
    setForm({
      profesorId: grupo.profesorId,
      cursoId: grupo.cursoId,
      periodoId: grupo.periodoId,
      seccionIds: grupo.miembros.map((m) => m.seccionId),
    });
    setAbierto(true);
  }

  function toggleSeccion(seccionId: string) {
    setForm((f) => ({
      ...f,
      seccionIds: f.seccionIds.includes(seccionId)
        ? f.seccionIds.filter((id) => id !== seccionId)
        : [...f.seccionIds, seccionId],
    }));
  }

  async function onGuardar() {
    setGuardando(true);
    const aAgregar = form.seccionIds.filter((id) => !idsOriginales.includes(id));
    const aQuitar = grupoEditando ? grupoEditando.miembros.filter((m) => !form.seccionIds.includes(m.seccionId)) : [];

    const resultados = await Promise.all([
      ...aAgregar.map((seccionId) =>
        accionCrearAsignacion({ profesorId: form.profesorId, cursoId: form.cursoId, seccionId, periodoId: form.periodoId })
      ),
      ...aQuitar.map((m) => accionEliminarAsignacion(m.id)),
    ]);

    const fallo = resultados.find((r) => !r.ok);
    if (fallo) {
      toast.error(fallo.mensaje);
    } else {
      toast.success(grupoEditando ? "Secciones actualizadas correctamente" : "Asignación creada correctamente");
      setAbierto(false);
      router.refresh();
    }
    setGuardando(false);
  }

  async function onEliminarGrupo(grupo: GrupoAsignacion) {
    const resultados = await Promise.all(grupo.miembros.map((m) => accionEliminarAsignacion(m.id)));
    const fallo = resultados.find((r) => !r.ok);
    if (fallo) toast.error(fallo.mensaje);
    else {
      toast.success("Asignación eliminada correctamente");
      router.refresh();
    }
  }

  const seccionesOrdenadas = useMemo(() => [...secciones].sort(compararSecciones), [secciones]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Asignaciones</h1>
        <p className="text-sm text-muted-foreground">Vincula profesores a cursos, secciones y periodos.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            placeholder="Buscar por profesor, curso o sección..."
            className="pl-8"
          />
        </div>
        <Select value={filtroProfesorId} onValueChange={(v) => onCambiarFiltroProfesor(v ?? TODOS_LOS_PROFESORES)} itemToStringLabel={etiquetaFiltroProfesor}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Profesor" />
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
        <Select value={filtroPeriodoId} onValueChange={(v) => onCambiarFiltroPeriodo(v ?? TODOS_LOS_PERIODOS)} itemToStringLabel={etiquetaFiltroPeriodo}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_LOS_PERIODOS}>Todos los periodos</SelectItem>
            {periodos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nombre} {p.anio}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nueva asignación
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {gruposPagina.map((g) => (
          <TarjetaGrupo
            key={g.clave}
            grupo={g}
            nombreProfesor={nombreProfesor}
            nombreCurso={nombreCurso}
            nombrePeriodo={nombrePeriodo}
            mostrarPeriodo={filtroPeriodoId === TODOS_LOS_PERIODOS}
            textoSecciones={textoSecciones}
            onEditar={abrirEditar}
            onHorarios={abrirHorarios}
            onEliminar={onEliminarGrupo}
          />
        ))}
        {gruposFiltrados.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {grupos.length === 0 ? "No hay asignaciones registradas." : "Ninguna asignación coincide con el filtro."}
          </p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Profesor</TableHead>
                <TableHead className="w-40">Curso</TableHead>
                <TableHead className="w-64">Secciones</TableHead>
                {filtroPeriodoId === TODOS_LOS_PERIODOS && <TableHead className="w-28">Periodo</TableHead>}
                <TableHead className="w-24 text-center">Estado</TableHead>
                <TableHead className="w-72 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gruposPagina.map((g) => {
                const todasActivas = g.miembros.every((m) => m.activo);
                return (
                  <TableRow key={g.clave}>
                    <TableCell className="truncate font-medium">{nombreProfesor(g.profesorId)}</TableCell>
                    <TableCell className="truncate text-muted-foreground">{nombreCurso(g.cursoId)}</TableCell>
                    <TableCell className="truncate text-muted-foreground">{textoSecciones(g)}</TableCell>
                    {filtroPeriodoId === TODOS_LOS_PERIODOS && (
                      <TableCell className="truncate text-muted-foreground">{nombrePeriodo(g.periodoId)}</TableCell>
                    )}
                    <TableCell className="text-center">
                      {todasActivas ? (
                        <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => abrirEditar(g)}>
                          <Pencil className="size-3.5" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => abrirHorarios(g)}>
                          <CalendarClock className="size-3.5" />
                          Horarios
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onEliminarGrupo(g)}>
                          <Trash2 className="size-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {gruposFiltrados.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={filtroPeriodoId === TODOS_LOS_PERIODOS ? 6 : 5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {grupos.length === 0 ? "No hay asignaciones registradas." : "Ninguna asignación coincide con el filtro."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {gruposFiltrados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
            {Math.min(paginaActual * TAMANO_PAGINA, gruposFiltrados.length)} de {gruposFiltrados.length} asignaciones
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

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{grupoEditando ? "Editar secciones" : "Nueva Asignación"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profesor</Label>
              <Select
                value={form.profesorId}
                onValueChange={(v) => setForm({ ...form, profesorId: v ?? "" })}
                disabled={!!grupoEditando}
                itemToStringLabel={nombreProfesor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar profesor" />
                </SelectTrigger>
                <SelectContent>
                  {[...profesores]
                    .sort((a, b) => apellidoNombre(a.nombreCompleto).localeCompare(apellidoNombre(b.nombreCompleto), "es"))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{apellidoNombre(p.nombreCompleto)}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select
                value={form.cursoId}
                onValueChange={(v) => setForm({ ...form, cursoId: v ?? "" })}
                disabled={!!grupoEditando}
                itemToStringLabel={nombreCurso}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select
                value={form.periodoId}
                onValueChange={(v) => setForm({ ...form, periodoId: v ?? "" })}
                disabled={!!grupoEditando}
                itemToStringLabel={nombrePeriodo}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre} {p.anio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Secciones ({form.seccionIds.length} seleccionadas)</Label>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                {seccionesOrdenadas.map((s) => {
                  const yaAsignada = seccionIdsYaAsignadas.has(s.id);
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        "flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/60",
                        yaAsignada && "cursor-not-allowed opacity-50 hover:bg-transparent"
                      )}
                    >
                      <Checkbox
                        checked={form.seccionIds.includes(s.id)}
                        onCheckedChange={() => toggleSeccion(s.id)}
                        disabled={yaAsignada}
                      />
                      <span>
                        {ETIQUETAS_NIVEL_EDUCATIVO[s.nivel]} · {s.grado} {s.nombre}
                        {yaAsignada && " (ya asignada — usa \"Editar secciones\"/\"Horarios\")"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={onGuardar}
              disabled={guardando || !form.profesorId || !form.cursoId || !form.periodoId || form.seccionIds.length === 0}
            >
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={horarioAbierto} onOpenChange={setHorarioAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Horarios de {grupoHorarios ? nombreProfesor(grupoHorarios.profesorId) : ""} — {grupoHorarios ? nombreCurso(grupoHorarios.cursoId) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[28rem] space-y-2 overflow-y-auto">
            {grupoHorarios?.miembros
              .slice()
              .sort((a, b) => nombreSeccion(a.seccionId).localeCompare(nombreSeccion(b.seccionId), "es"))
              .map((miembro) => {
                const bloquesSeccion = bloquesDelProfesor
                  .filter((b) => b.asignacionId === miembro.id)
                  .sort(
                    (a, b) =>
                      ORDEN_DIAS_SEMANA.indexOf(a.diaSemana) - ORDEN_DIAS_SEMANA.indexOf(b.diaSemana) ||
                      a.horaInicio.localeCompare(b.horaInicio)
                  );
                const expandida = seccionExpandida === miembro.seccionId;
                const opcionesLibresSeccion = expandida ? opcionesLibresParaSeccion(miembro) : [];
                return (
                  <div key={miembro.id} className="rounded-md border">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 p-2 text-left hover:bg-muted/60"
                      onClick={() => setSeccionExpandida(expandida ? null : miembro.seccionId)}
                    >
                      <span className="text-sm font-medium">{nombreSeccion(miembro.seccionId)}</span>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {bloquesSeccion.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Sin horario</span>
                        ) : (
                          bloquesSeccion.map((b) => (
                            <Badge key={b.id} variant="outline" className="text-[10px]">
                              {ETIQUETAS_DIA_SEMANA[b.diaSemana].slice(0, 3)} {b.horaInicio}
                            </Badge>
                          ))
                        )}
                        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expandida && "rotate-180")} />
                      </div>
                    </button>
                    {expandida && (
                      <div className="space-y-2 border-t p-2">
                        {bloquesSeccion.length === 0 && (
                          <p className="text-xs text-muted-foreground">Sin horario asignado todavía.</p>
                        )}
                        {bloquesSeccion.map((b) => (
                          <div key={b.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs">
                            <span>{ETIQUETAS_DIA_SEMANA[b.diaSemana]} {b.horaInicio} - {b.horaFin}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Quitar horario"
                              onClick={() => onEliminarBloque(b.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Select
                            value={borradorPorSeccion[miembro.seccionId] ?? ""}
                            onValueChange={(v) =>
                              setBorradorPorSeccion((prev) => ({ ...prev, [miembro.seccionId]: v ?? "" }))
                            }
                            disabled={opcionesLibresSeccion.length === 0}
                            itemToStringLabel={(v) => {
                              if (!v) return "";
                              const [dia, horaInicio] = v.split("|");
                              const periodo = PERIODOS_HORARIO.find((p) => p.horaInicio === horaInicio);
                              return periodo ? `${ETIQUETAS_DIA_SEMANA[dia as DiaSemana]} ${periodo.horaInicio} - ${periodo.horaFin}` : "";
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={opcionesLibresSeccion.length === 0 ? "Sin horarios libres" : "Elegir horario disponible"} />
                            </SelectTrigger>
                            <SelectContent>
                              {opcionesLibresSeccion.map(({ dia, periodo }) => (
                                <SelectItem key={`${dia}|${periodo.horaInicio}`} value={`${dia}|${periodo.horaInicio}`}>
                                  {ETIQUETAS_DIA_SEMANA[dia]} {periodo.horaInicio} - {periodo.horaFin}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onAgregarBloque(miembro.id, miembro.seccionId)}
                            disabled={!borradorPorSeccion[miembro.seccionId]}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHorarioAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
