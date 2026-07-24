"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { UsuarioPublico } from "@/modulos/usuarios/dominio/usuario";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { compararSecciones } from "@/modulos/secciones/dominio/orden-secciones";
import { accionCrearAsignacion, accionEliminarAsignacion } from "@/modulos/asignaciones/presentacion/acciones";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";
import { ETIQUETAS_NIVEL_EDUCATIVO } from "@/config/constantes";
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
  textoSecciones,
  onEditar,
  onEliminar,
}: {
  grupo: GrupoAsignacion;
  nombreProfesor: (id: string) => string;
  nombreCurso: (id: string) => string;
  nombrePeriodo: (id: string) => string;
  textoSecciones: (grupo: GrupoAsignacion) => string;
  onEditar: (grupo: GrupoAsignacion) => void;
  onEliminar: (grupo: GrupoAsignacion) => void;
}) {
  const todasActivas = grupo.miembros.every((m) => m.activo);
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{nombreProfesor(grupo.profesorId)}</p>
          <p className="truncate text-sm text-muted-foreground">{nombreCurso(grupo.cursoId)} · {nombrePeriodo(grupo.periodoId)}</p>
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

export function TablaAsignaciones({ asignaciones, profesores, cursos, secciones, periodos }: Props) {
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
    const idsOriginales = grupoEditando ? grupoEditando.miembros.map((m) => m.seccionId) : [];
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
            textoSecciones={textoSecciones}
            onEditar={abrirEditar}
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
                <TableHead className="w-28">Periodo</TableHead>
                <TableHead className="w-24 text-center">Estado</TableHead>
                <TableHead className="w-56 text-center">Acciones</TableHead>
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
                    <TableCell className="truncate text-muted-foreground">{nombrePeriodo(g.periodoId)}</TableCell>
                    <TableCell className="text-center">
                      {todasActivas ? (
                        <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => abrirEditar(g)}>
                          <Pencil className="size-3.5" />
                          Editar
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
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                {seccionesOrdenadas.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/60">
                    <Checkbox
                      checked={form.seccionIds.includes(s.id)}
                      onCheckedChange={() => toggleSeccion(s.id)}
                    />
                    <span>{ETIQUETAS_NIVEL_EDUCATIVO[s.nivel]} · {s.grado} {s.nombre}</span>
                  </label>
                ))}
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
    </div>
  );
}
