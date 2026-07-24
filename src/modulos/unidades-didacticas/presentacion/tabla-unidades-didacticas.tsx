"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, LockOpen, Lock, MoreVertical, Search, ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import {
  accionGenerarUnidadesDidacticas,
  accionGenerarUnidadesDidacticasPeriodo,
  accionActualizarUnidadDidactica,
  accionAbrirUnidadDidactica,
  accionCerrarUnidadDidactica,
} from "@/modulos/unidades-didacticas/presentacion/acciones";
import { Button } from "@/components/ui/button";
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

interface Props {
  unidadesDidacticas: UnidadDidacticaProps[];
  periodos: PeriodoProps[];
  cursos: CursoProps[];
}

const TAMANO_PAGINA = 10;
const TODOS_LOS_PERIODOS = "TODOS";

function formatearFecha(fecha: string) {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

function TarjetaUnidadDidactica({
  unidad,
  nombrePeriodo,
  nombreCurso,
  onEditar,
  onAbrir,
  onCerrar,
}: {
  unidad: UnidadDidacticaProps;
  nombrePeriodo: (id: string) => string;
  nombreCurso: (id: string) => string;
  onEditar: (unidad: UnidadDidacticaProps) => void;
  onAbrir: (id: string) => void;
  onCerrar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {nombreCurso(unidad.cursoId)} · {unidad.nombre}
          </p>
          <p className="truncate text-sm text-muted-foreground">{nombrePeriodo(unidad.periodoId)}</p>
          <p className="truncate text-sm text-muted-foreground">
            {formatearFecha(unidad.fechaInicio)} — {formatearFecha(unidad.fechaFin)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(unidad)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            {unidad.estado === "CERRADO" && (
              <DropdownMenuItem onClick={() => onAbrir(unidad.id)}>
                <LockOpen className="size-4" />
                Abrir
              </DropdownMenuItem>
            )}
            {unidad.estado === "ABIERTO" && (
              <DropdownMenuItem variant="destructive" onClick={() => onCerrar(unidad.id)}>
                <Lock className="size-4" />
                Cerrar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {unidad.estado === "ABIERTO" ? (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Abierto</Badge>
        ) : (
          <Badge variant="secondary">Cerrado</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaUnidadesDidacticas({ unidadesDidacticas, periodos, cursos }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtroPeriodoId, setFiltroPeriodoId] = useState(
    () => periodos.find((p) => p.estado === "ABIERTO")?.id ?? TODOS_LOS_PERIODOS
  );

  const [abiertoGenerar, setAbiertoGenerar] = useState(false);
  const [abiertoGenerarPeriodo, setAbiertoGenerarPeriodo] = useState(false);
  const [abiertoEditar, setAbiertoEditar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGenerarPeriodo, setLoadingGenerarPeriodo] = useState(false);
  const [editando, setEditando] = useState<UnidadDidacticaProps | null>(null);
  const [formGenerar, setFormGenerar] = useState({ cursoId: "", periodoId: "" });
  const [formGenerarPeriodo, setFormGenerarPeriodo] = useState({ periodoId: "" });
  const [formEditar, setFormEditar] = useState({ nombre: "", fechaInicio: "", fechaFin: "" });

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  }

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre || "(curso eliminado)";
  }

  function etiquetaFiltroPeriodo(id: string) {
    return id === TODOS_LOS_PERIODOS ? "Todos los periodos" : nombrePeriodo(id);
  }

  const unidadesFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    return unidadesDidacticas.filter((u) => {
      if (filtroPeriodoId !== TODOS_LOS_PERIODOS && u.periodoId !== filtroPeriodoId) return false;
      if (!termino) return true;
      return (
        normalizarTexto(nombreCurso(u.cursoId)).includes(termino) ||
        normalizarTexto(nombrePeriodo(u.periodoId)).includes(termino)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadesDidacticas, busqueda, filtroPeriodoId, cursos, periodos]);

  const totalPaginas = Math.max(1, Math.ceil(unidadesFiltradas.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const unidadesPagina = useMemo(
    () => unidadesFiltradas.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [unidadesFiltradas, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  function onCambiarFiltroPeriodo(valor: string) {
    setFiltroPeriodoId(valor);
    setPagina(1);
  }

  function abrirGenerar() {
    setFormGenerar({ cursoId: "", periodoId: "" });
    setAbiertoGenerar(true);
  }

  function abrirGenerarPeriodo() {
    setFormGenerarPeriodo({ periodoId: filtroPeriodoId !== TODOS_LOS_PERIODOS ? filtroPeriodoId : "" });
    setAbiertoGenerarPeriodo(true);
  }

  function abrirEditar(unidadDidactica: UnidadDidacticaProps) {
    setEditando(unidadDidactica);
    setFormEditar({
      nombre: unidadDidactica.nombre,
      fechaInicio: unidadDidactica.fechaInicio,
      fechaFin: unidadDidactica.fechaFin,
    });
    setAbiertoEditar(true);
  }

  async function onGenerar() {
    setLoading(true);
    const resultado = await accionGenerarUnidadesDidacticas(formGenerar);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setAbiertoGenerar(false);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setLoading(false);
  }

  async function onGenerarPeriodo() {
    setLoadingGenerarPeriodo(true);
    const resultado = await accionGenerarUnidadesDidacticasPeriodo(formGenerarPeriodo);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setAbiertoGenerarPeriodo(false);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setLoadingGenerarPeriodo(false);
  }

  async function onEditar() {
    if (!editando) return;
    setLoading(true);
    const resultado = await accionActualizarUnidadDidactica({ id: editando.id, ...formEditar });
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setAbiertoEditar(false);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setLoading(false);
  }

  async function onAbrir(id: string) {
    const resultado = await accionAbrirUnidadDidactica(id);
    if (resultado.ok) { toast.success(resultado.mensaje); router.refresh(); }
    else toast.error(resultado.mensaje);
  }

  async function onCerrar(id: string) {
    const resultado = await accionCerrarUnidadDidactica(id);
    if (resultado.ok) { toast.success(resultado.mensaje); router.refresh(); }
    else toast.error(resultado.mensaje);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Unidades Didácticas</h1>
        <p className="text-sm text-muted-foreground">
          Cada curso tiene Unidad 1 y Unidad 2 por periodo. Se abre automáticamente la que incluye la fecha de hoy.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            placeholder="Buscar por curso o periodo..."
            className="pl-8"
          />
        </div>
        <Select
          value={filtroPeriodoId}
          onValueChange={(v) => onCambiarFiltroPeriodo(v ?? TODOS_LOS_PERIODOS)}
          itemToStringLabel={etiquetaFiltroPeriodo}
        >
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
        <Button variant="outline" onClick={abrirGenerarPeriodo}>
          <CalendarPlus className="size-4" />
          Generar unidades del periodo
        </Button>
        <Button onClick={abrirGenerar}>
          <Plus className="size-4" />
          Generar para un curso
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {unidadesPagina.map((u) => (
          <TarjetaUnidadDidactica
            key={u.id}
            unidad={u}
            nombrePeriodo={nombrePeriodo}
            nombreCurso={nombreCurso}
            onEditar={abrirEditar}
            onAbrir={onAbrir}
            onCerrar={onCerrar}
          />
        ))}
        {unidadesFiltradas.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {unidadesDidacticas.length === 0
              ? "No hay unidades didácticas registradas."
              : "Ninguna unidad coincide con el filtro."}
          </p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Curso</TableHead>
                <TableHead className="w-24">Unidad</TableHead>
                <TableHead className="w-36">Periodo</TableHead>
                <TableHead className="w-32">Fechas</TableHead>
                <TableHead className="w-28 text-center">Estado</TableHead>
                <TableHead className="w-64 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidadesPagina.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="truncate font-medium">{nombreCurso(u.cursoId)}</TableCell>
                  <TableCell className="text-muted-foreground">{u.nombre}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{nombrePeriodo(u.periodoId)}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{formatearFecha(u.fechaInicio)} — {formatearFecha(u.fechaFin)}</TableCell>
                  <TableCell className="text-center">
                    {u.estado === "ABIERTO" ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Abierto</Badge>
                    ) : (
                      <Badge variant="secondary">Cerrado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(u)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      {u.estado === "CERRADO" && (
                        <Button variant="outline" size="sm" onClick={() => onAbrir(u.id)}>
                          <LockOpen className="size-3.5" />
                          Abrir
                        </Button>
                      )}
                      {u.estado === "ABIERTO" && (
                        <Button variant="destructive" size="sm" onClick={() => onCerrar(u.id)}>
                          <Lock className="size-3.5" />
                          Cerrar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {unidadesFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {unidadesDidacticas.length === 0
                      ? "No hay unidades didácticas registradas."
                      : "Ninguna unidad coincide con el filtro."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {unidadesFiltradas.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
            {Math.min(paginaActual * TAMANO_PAGINA, unidadesFiltradas.length)} de {unidadesFiltradas.length} unidades
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

      <Dialog open={abiertoGenerar} onOpenChange={setAbiertoGenerar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Unidad 1 y Unidad 2</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={formGenerar.cursoId} onValueChange={(v) => setFormGenerar({ ...formGenerar, cursoId: v ?? "" })} itemToStringLabel={nombreCurso}>
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
              <Select value={formGenerar.periodoId} onValueChange={(v) => setFormGenerar({ ...formGenerar, periodoId: v ?? "" })} itemToStringLabel={nombrePeriodo}>
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
            <p className="text-sm text-muted-foreground">
              Las fechas de Unidad 1 y Unidad 2 se calculan automáticamente dividiendo el periodo en 2 meses, y se
              abre la que incluye la fecha de hoy. Si ya existen para este curso y periodo, no se duplican.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbiertoGenerar(false)}>
              Cancelar
            </Button>
            <Button onClick={onGenerar} disabled={loading || !formGenerar.cursoId || !formGenerar.periodoId}>
              {loading ? "Generando..." : "Generar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={abiertoGenerarPeriodo} onOpenChange={setAbiertoGenerarPeriodo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar unidades del periodo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crea Unidad 1 y Unidad 2 para todos los cursos activos en el periodo elegido, de una sola vez. Si algún
              curso ya las tiene, se dejan tal cual (no se duplican).
            </p>
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select
                value={formGenerarPeriodo.periodoId}
                onValueChange={(v) => setFormGenerarPeriodo({ periodoId: v ?? "" })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbiertoGenerarPeriodo(false)}>
              Cancelar
            </Button>
            <Button onClick={onGenerarPeriodo} disabled={loadingGenerarPeriodo || !formGenerarPeriodo.periodoId}>
              {loadingGenerarPeriodo ? "Generando..." : "Generar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={abiertoEditar} onOpenChange={setAbiertoEditar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidad Didáctica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formEditar.nombre} onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input type="date" value={formEditar.fechaInicio} onChange={(e) => setFormEditar({ ...formEditar, fechaInicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de fin</Label>
              <Input type="date" value={formEditar.fechaFin} onChange={(e) => setFormEditar({ ...formEditar, fechaFin: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbiertoEditar(false)}>
              Cancelar
            </Button>
            <Button onClick={onEditar} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
