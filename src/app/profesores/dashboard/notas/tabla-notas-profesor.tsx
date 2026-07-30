"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, MoreVertical, FileDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { NotaProps } from "@/modulos/notas/dominio/nota";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import {
  accionListarNotasPorAsignacionProfesor,
  accionRegistrarNota,
  accionEditarNota,
  accionEliminarNotaProfesor,
} from "@/app/profesores/dashboard/notas/acciones";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TIPOS_NOTA, TipoNota, ETIQUETAS_NIVEL_EDUCATIVO, ORDEN_NIVELES_EDUCATIVOS, NivelEducativo } from "@/config/constantes";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";

const TAMANO_PAGINA = 10;

function numeroDeGrado(grado: string): number {
  const match = grado.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

interface Props {
  asignaciones: AsignacionProps[];
  estudiantes: EstudianteProps[];
  periodos: PeriodoProps[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  unidadesDidacticas: UnidadDidacticaProps[];
}

function TarjetaNotaProfesor({
  nota,
  nombreEstudiante,
  onEditar,
  onEliminar,
}: {
  nota: NotaProps;
  nombreEstudiante: (id: string) => string;
  onEditar: (nota: NotaProps) => void;
  onEliminar: (nota: NotaProps) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{nombreEstudiante(nota.estudianteId)}</p>
          <p className="truncate text-sm text-muted-foreground">{nota.etiqueta}</p>
          <p className="truncate text-sm text-muted-foreground">{nota.tipo} · {nota.fecha}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={`text-lg font-semibold ${nota.valor >= 11 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {nota.valor}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditar(nota)}>
                <Pencil className="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onEliminar(nota)}>
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

export function TablaNotasProfesor({ asignaciones, estudiantes, periodos, cursos, secciones, unidadesDidacticas }: Props) {
  const [notas, setNotas] = useState<NotaProps[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<NotaProps | null>(null);
  const [form, setForm] = useState({
    estudianteId: "",
    tipo: "PRACTICA" as TipoNota,
    etiqueta: "",
    valor: "",
    fecha: "",
  });

  const [cursoFiltroId, setCursoFiltroId] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState<NivelEducativo | "">("");
  const [gradoFiltro, setGradoFiltro] = useState("");
  const [seccionFiltroId, setSeccionFiltroId] = useState("");
  const [periodoFiltroId, setPeriodoFiltroId] = useState("");
  const [ordenUnidad, setOrdenUnidad] = useState<"1" | "2">("1");

  // Solo lo que el profesor realmente dicta, para no ofrecerle combinaciones ajenas.
  const misCursos = useMemo(() => {
    const ids = [...new Set(asignaciones.map((a) => a.cursoId))];
    return cursos.filter((c) => ids.includes(c.id));
  }, [asignaciones, cursos]);

  const misSecciones = useMemo(() => {
    const ids = [...new Set(asignaciones.map((a) => a.seccionId))];
    return secciones.filter((s) => ids.includes(s.id));
  }, [asignaciones, secciones]);

  const misPeriodos = useMemo(() => {
    const ids = [...new Set(asignaciones.map((a) => a.periodoId))];
    return periodos.filter((p) => ids.includes(p.id));
  }, [asignaciones, periodos]);

  // Nivel → Grado → Sección: "1°" existe tanto en Primaria como en Secundaria,
  // así que sin el nivel de por medio elegir la sección correcta es ambiguo.
  const nivelesDisponibles = useMemo(() => {
    const niveles = new Set(misSecciones.map((s) => s.nivel));
    return ORDEN_NIVELES_EDUCATIVOS.filter((n) => niveles.has(n));
  }, [misSecciones]);

  const gradosDisponibles = useMemo(() => {
    const base = nivelFiltro ? misSecciones.filter((s) => s.nivel === nivelFiltro) : misSecciones;
    return [...new Set(base.map((s) => s.grado))].sort((a, b) => numeroDeGrado(a) - numeroDeGrado(b));
  }, [misSecciones, nivelFiltro]);

  const seccionesFiltradas = useMemo(() => {
    return misSecciones.filter(
      (s) => (!nivelFiltro || s.nivel === nivelFiltro) && (!gradoFiltro || s.grado === gradoFiltro)
    );
  }, [misSecciones, nivelFiltro, gradoFiltro]);

  const asignacionSeleccionada = useMemo(() => {
    if (!cursoFiltroId || !seccionFiltroId || !periodoFiltroId) return null;
    return (
      asignaciones.find(
        (a) => a.cursoId === cursoFiltroId && a.seccionId === seccionFiltroId && a.periodoId === periodoFiltroId && a.activo
      ) ?? null
    );
  }, [asignaciones, cursoFiltroId, seccionFiltroId, periodoFiltroId]);

  const unidadSeleccionada = useMemo(() => {
    if (!asignacionSeleccionada) return null;
    return (
      unidadesDidacticas.find(
        (u) =>
          u.cursoId === asignacionSeleccionada.cursoId &&
          u.periodoId === asignacionSeleccionada.periodoId &&
          u.orden === Number(ordenUnidad)
      ) ?? null
    );
  }, [unidadesDidacticas, asignacionSeleccionada, ordenUnidad]);

  // Se dispara desde los onChange de Curso/Sección/Periodo (no con un
  // useEffect) para no violar react-hooks/set-state-in-effect, y porque de
  // todos modos es una reacción directa a la interacción del usuario.
  async function cargarNotasSegunFiltros(nuevoCursoId: string, nuevoSeccionId: string, nuevoPeriodoId: string) {
    const asignacion = asignaciones.find(
      (a) => a.cursoId === nuevoCursoId && a.seccionId === nuevoSeccionId && a.periodoId === nuevoPeriodoId && a.activo
    );
    if (!asignacion) {
      setNotas([]);
      return;
    }
    setLoadingNotas(true);
    const resultado = await accionListarNotasPorAsignacionProfesor(asignacion.id);
    setNotas(resultado);
    setLoadingNotas(false);
  }

  function onCambiarCurso(id: string) {
    setCursoFiltroId(id);
    cargarNotasSegunFiltros(id, seccionFiltroId, periodoFiltroId);
  }

  function onCambiarNivel(valor: string) {
    setNivelFiltro(valor as NivelEducativo | "");
    setGradoFiltro("");
    setSeccionFiltroId("");
    cargarNotasSegunFiltros(cursoFiltroId, "", periodoFiltroId);
  }

  function onCambiarGrado(valor: string) {
    setGradoFiltro(valor);
    setSeccionFiltroId("");
    cargarNotasSegunFiltros(cursoFiltroId, "", periodoFiltroId);
  }

  function onCambiarSeccion(id: string) {
    setSeccionFiltroId(id);
    cargarNotasSegunFiltros(cursoFiltroId, id, periodoFiltroId);
  }

  function onCambiarPeriodo(id: string) {
    setPeriodoFiltroId(id);
    cargarNotasSegunFiltros(cursoFiltroId, seccionFiltroId, id);
  }

  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const notasFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    if (!termino) return notas;
    return notas.filter(
      (n) => normalizarTexto(nombreEstudiante(n.estudianteId)).includes(termino) || normalizarTexto(n.etiqueta).includes(termino)
    );
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

  // Solo el curso puntual que el profesor tiene seleccionado — no el
  // consolidado de toda la sección, eso es exclusivo del admin.
  const urlExcel = asignacionSeleccionada
    ? `/api/reportes/notas-curso/excel?asignacionId=${asignacionSeleccionada.id}&ordenUnidad=${ordenUnidad}`
    : null;

  function abrirCrear() {
    setEditando(null);
    setForm({ estudianteId: "", tipo: "PRACTICA", etiqueta: "", valor: "", fecha: "" });
    setAbierto(true);
  }

  function abrirEditar(nota: NotaProps) {
    setEditando(nota);
    setForm({
      estudianteId: nota.estudianteId,
      tipo: nota.tipo,
      etiqueta: nota.etiqueta,
      valor: nota.valor.toString(),
      fecha: nota.fecha,
    });
    setAbierto(true);
  }

  async function onSubmit() {
    if (!asignacionSeleccionada) return;
    if (!unidadSeleccionada) {
      toast.error("Selecciona una unidad didáctica antes de guardar la nota.");
      return;
    }
    if (!editando && !form.estudianteId) {
      toast.error("Selecciona un estudiante.");
      return;
    }
    if (!form.etiqueta.trim()) {
      toast.error("Ingresa una etiqueta para la nota.");
      return;
    }
    const valor = parseFloat(form.valor);
    if (!Number.isFinite(valor) || valor < 0 || valor > 20) {
      toast.error("Ingresa un valor numérico entre 0 y 20.");
      return;
    }
    if (!form.fecha) {
      toast.error("Selecciona la fecha de la nota.");
      return;
    }
    setLoading(true);
    try {
      let resultado;

      if (editando) {
        resultado = await accionEditarNota({
          id: editando.id,
          tipo: form.tipo,
          etiqueta: form.etiqueta,
          valor,
          fecha: form.fecha,
          cursoId: asignacionSeleccionada.cursoId,
          seccionId: asignacionSeleccionada.seccionId,
          unidadDidacticaId: unidadSeleccionada.id,
          profesorId: "",
        });
      } else {
        resultado = await accionRegistrarNota({
          estudianteId: form.estudianteId,
          asignacionId: asignacionSeleccionada.id,
          unidadDidacticaId: unidadSeleccionada.id,
          tipo: form.tipo,
          etiqueta: form.etiqueta,
          valor,
          fecha: form.fecha,
          profesorId: "",
          cursoId: asignacionSeleccionada.cursoId,
          seccionId: asignacionSeleccionada.seccionId,
        });
      }

      if (resultado.ok) {
        toast.success(resultado.mensaje);
        setAbierto(false);
        const notasActualizadas = await accionListarNotasPorAsignacionProfesor(asignacionSeleccionada.id);
        setNotas(notasActualizadas);
      } else {
        toast.error(resultado.mensaje);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onEliminar(nota: NotaProps) {
    if (!asignacionSeleccionada) return;
    if (!unidadSeleccionada) {
      toast.error("Selecciona una unidad didáctica antes de eliminar la nota.");
      return;
    }
    const resultado = await accionEliminarNotaProfesor({
      id: nota.id,
      cursoId: asignacionSeleccionada.cursoId,
      seccionId: asignacionSeleccionada.seccionId,
      unidadDidacticaId: unidadSeleccionada.id,
    });
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      const notasActualizadas = await accionListarNotasPorAsignacionProfesor(asignacionSeleccionada.id);
      setNotas(notasActualizadas);
    } else {
      toast.error(resultado.mensaje);
    }
  }

  function nombreEstudiante(id: string) {
    return estudiantes.find((e) => e.id === id)?.nombreCompleto || "(estudiante eliminado)";
  }

  function nombrePeriodo(id: string) {
    return periodos.find((p) => p.id === id)?.nombre || "(periodo eliminado)";
  }

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre || "(curso eliminado)";
  }

  function nombreSeccion(id: string) {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Mis Notas</h1>
          <p className="text-sm text-muted-foreground">Registra y consulta las notas de tus asignaciones.</p>
        </div>
        {asignacionSeleccionada && unidadSeleccionada && (
          <Button onClick={abrirCrear}>
            <Plus className="size-4" />
            Registrar nota
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label>Curso</Label>
              <Select value={cursoFiltroId} onValueChange={(v) => onCambiarCurso(v ?? "")} itemToStringLabel={nombreCurso}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {misCursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36 space-y-2">
              <Label>Nivel</Label>
              <Select
                value={nivelFiltro}
                onValueChange={(v) => onCambiarNivel(v ?? "")}
                itemToStringLabel={(n) => (n ? ETIQUETAS_NIVEL_EDUCATIVO[n as NivelEducativo] : "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  {nivelesDisponibles.map((n) => (
                    <SelectItem key={n} value={n}>{ETIQUETAS_NIVEL_EDUCATIVO[n]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28 space-y-2">
              <Label>Grado</Label>
              <Select value={gradoFiltro} onValueChange={(v) => onCambiarGrado(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Grado" />
                </SelectTrigger>
                <SelectContent>
                  {gradosDisponibles.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label>Sección</Label>
              <Select value={seccionFiltroId} onValueChange={(v) => onCambiarSeccion(v ?? "")} itemToStringLabel={nombreSeccion}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesFiltradas.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.grado} {s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label>Periodo</Label>
              <Select value={periodoFiltroId} onValueChange={(v) => onCambiarPeriodo(v ?? "")} itemToStringLabel={nombrePeriodo}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {misPeriodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28 space-y-2">
              <Label>Unidad</Label>
              <Select value={ordenUnidad} onValueChange={(v) => setOrdenUnidad((v ?? "1") as "1" | "2")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Unidad 1</SelectItem>
                  <SelectItem value="2">Unidad 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {cursoFiltroId && seccionFiltroId && periodoFiltroId && !asignacionSeleccionada && (
            <p className="mt-3 text-xs text-muted-foreground">
              No tienes una asignación activa con esa combinación de curso, sección y periodo.
            </p>
          )}
          {asignacionSeleccionada && !unidadSeleccionada && (
            <p className="mt-3 text-xs text-muted-foreground">
              No hay una Unidad {ordenUnidad} generada para este curso y periodo. Pide al administrador que la cree.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            placeholder="Buscar por estudiante o etiqueta..."
            className="pl-8"
            disabled={!asignacionSeleccionada}
          />
        </div>
        {urlExcel ? (
          <a href={urlExcel} className={buttonVariants({ variant: "outline" })}>
            <FileDown className="size-4" />
            Descargar Excel
          </a>
        ) : (
          <Button variant="outline" disabled>
            <FileDown className="size-4" />
            Descargar Excel
          </Button>
        )}
      </div>

      {loadingNotas && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando notas...
        </div>
      )}

      {!loadingNotas && asignacionSeleccionada && (
        <>
          <div className="space-y-3 md:hidden">
            {notasPagina.map((n) => (
              <TarjetaNotaProfesor key={n.id} nota={n} nombreEstudiante={nombreEstudiante} onEditar={abrirEditar} onEliminar={onEliminar} />
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
                  <TableHead className="w-28">Tipo</TableHead>
                  <TableHead className="w-40">Etiqueta</TableHead>
                  <TableHead className="w-20 text-center">Valor</TableHead>
                  <TableHead className="w-28">Fecha</TableHead>
                  <TableHead className="w-56 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notasPagina.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="truncate font-medium">{nombreEstudiante(n.estudianteId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{n.tipo}</Badge>
                    </TableCell>
                    <TableCell className="truncate text-muted-foreground">{n.etiqueta}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${n.valor >= 11 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                        {n.valor}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{n.fecha}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => abrirEditar(n)}>
                          <Pencil className="size-3.5" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onEliminar(n)}>
                          <Trash2 className="size-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {notasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Nota" : "Registrar Nota"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editando && (
              <div className="space-y-2">
                <Label>Estudiante</Label>
                <Select value={form.estudianteId} onValueChange={(v) => setForm({ ...form, estudianteId: v ?? "" })} itemToStringLabel={nombreEstudiante}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {estudiantes.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nombreCompleto}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: (v ?? "PRACTICA") as TipoNota })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TIPOS_NOTA).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etiqueta</Label>
              <Input
                value={form.etiqueta}
                onChange={(e) => setForm({ ...form, etiqueta: e.target.value })}
                placeholder="Ej: Práctica 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor (0-20)</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
