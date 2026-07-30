"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { MatriculaProps } from "@/modulos/matriculas/dominio/matricula";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { accionCrearMatricula, accionActualizarMatricula, accionEliminarMatricula } from "@/modulos/matriculas/presentacion/acciones";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";
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
import { ETIQUETAS_NIVEL_EDUCATIVO, ORDEN_NIVELES_EDUCATIVOS, NivelEducativo } from "@/config/constantes";

interface Props {
  matriculas: MatriculaProps[];
  estudiantes: EstudianteProps[];
  secciones: SeccionProps[];
}

const TAMANO_PAGINA = 10;

function TarjetaMatricula({
  matricula,
  nombreEstudiante,
  nombreSeccion,
  onEditar,
  onEliminar,
}: {
  matricula: MatriculaProps;
  nombreEstudiante: (id: string) => string;
  nombreSeccion: (id: string) => string;
  onEditar: (matricula: MatriculaProps) => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{nombreEstudiante(matricula.estudianteId)}</p>
          <p className="truncate text-sm text-muted-foreground">{nombreSeccion(matricula.seccionId)}</p>
          <p className="truncate text-sm text-muted-foreground">Año {matricula.anio}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(matricula)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onEliminar(matricula.id)}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {matricula.activo ? (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaMatriculas({ matriculas, estudiantes, secciones }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<MatriculaProps | null>(null);
  const [form, setForm] = useState({
    estudianteId: "",
    seccionId: "",
    anio: new Date().getFullYear().toString(),
  });
  // Solo para el diálogo: filtra qué secciones se ofrecen, para no mezclar
  // Inicial/Primaria/Secundaria en una sola lista larga.
  const [nivelDialogo, setNivelDialogo] = useState<NivelEducativo | "">("");

  function nombreEstudiante(id: string) {
    const e = estudiantes.find((e) => e.id === id);
    return e ? apellidoNombre(e.nombreCompleto) : "(estudiante eliminado)";
  }

  function nombreSeccion(id: string) {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  // Alfabético por apellido para que sea fácil ubicar un alumno entre ~250+.
  const estudiantesOrdenados = useMemo(
    () => [...estudiantes].sort((a, b) => apellidoNombre(a.nombreCompleto).localeCompare(apellidoNombre(b.nombreCompleto), "es")),
    [estudiantes]
  );

  const seccionesDelNivelDialogo = useMemo(
    () => secciones.filter((s) => s.nivel === nivelDialogo),
    [secciones, nivelDialogo]
  );

  function onCambiarNivelDialogo(nuevoNivel: NivelEducativo) {
    setNivelDialogo(nuevoNivel);
    setForm((f) => ({ ...f, seccionId: "" }));
  }

  const matriculasFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    const base = !termino
      ? matriculas
      : matriculas.filter(
          (m) =>
            normalizarTexto(nombreEstudiante(m.estudianteId)).includes(termino) ||
            normalizarTexto(nombreSeccion(m.seccionId)).includes(termino)
        );
    return [...base].sort((a, b) =>
      nombreEstudiante(a.estudianteId).localeCompare(nombreEstudiante(b.estudianteId), "es")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matriculas, busqueda, estudiantes, secciones]);

  const totalPaginas = Math.max(1, Math.ceil(matriculasFiltradas.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const matriculasPagina = useMemo(
    () => matriculasFiltradas.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [matriculasFiltradas, paginaActual]
  );

  function onCambiarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ estudianteId: "", seccionId: "", anio: new Date().getFullYear().toString() });
    setNivelDialogo("");
    setAbierto(true);
  }

  function abrirEditar(matricula: MatriculaProps) {
    setEditando(matricula);
    setForm({ estudianteId: matricula.estudianteId, seccionId: matricula.seccionId, anio: matricula.anio.toString() });
    setNivelDialogo(secciones.find((s) => s.id === matricula.seccionId)?.nivel ?? "");
    setAbierto(true);
  }

  async function onSubmit() {
    setLoading(true);
    let resultado;

    if (editando) {
      resultado = await accionActualizarMatricula({
        id: editando.id,
        seccionId: form.seccionId,
        anio: parseInt(form.anio),
        activo: editando.activo,
      });
    } else {
      resultado = await accionCrearMatricula({
        estudianteId: form.estudianteId,
        seccionId: form.seccionId,
        anio: parseInt(form.anio),
      });
    }

    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setAbierto(false);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setLoading(false);
  }

  async function onEliminar(id: string) {
    const resultado = await accionEliminarMatricula(id);
    if (resultado.ok) { toast.success(resultado.mensaje); router.refresh(); }
    else toast.error(resultado.mensaje);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Matrículas</h1>
        <p className="text-sm text-muted-foreground">Asocia estudiantes a una sección por año escolar.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            placeholder="Buscar por estudiante o sección..."
            className="pl-8"
          />
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nueva matrícula
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {matriculasPagina.map((m) => (
          <TarjetaMatricula
            key={m.id}
            matricula={m}
            nombreEstudiante={nombreEstudiante}
            nombreSeccion={nombreSeccion}
            onEditar={abrirEditar}
            onEliminar={onEliminar}
          />
        ))}
        {matriculasFiltradas.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {matriculas.length === 0 ? "No hay matrículas registradas." : "Ninguna matrícula coincide con la búsqueda."}
          </p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Estudiante</TableHead>
                <TableHead className="w-32">Sección</TableHead>
                <TableHead className="w-20">Año</TableHead>
                <TableHead className="w-28 text-center">Estado</TableHead>
                <TableHead className="w-56 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculasPagina.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="truncate font-medium">{nombreEstudiante(m.estudianteId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombreSeccion(m.seccionId)}</TableCell>
                  <TableCell className="text-muted-foreground">{m.anio}</TableCell>
                  <TableCell className="text-center">
                    {m.activo ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(m)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onEliminar(m.id)}>
                        <Trash2 className="size-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {matriculasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {matriculas.length === 0 ? "No hay matrículas registradas." : "Ninguna matrícula coincide con la búsqueda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {matriculasFiltradas.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
            {Math.min(paginaActual * TAMANO_PAGINA, matriculasFiltradas.length)} de {matriculasFiltradas.length} matrículas
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
            <DialogTitle>{editando ? "Editar Matrícula" : "Nueva Matrícula"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estudiante</Label>
              <Select
                value={form.estudianteId}
                onValueChange={(v) => setForm({ ...form, estudianteId: v ?? "" })}
                disabled={!!editando}
                itemToStringLabel={nombreEstudiante}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {estudiantesOrdenados.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{apellidoNombre(e.nombreCompleto)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editando && (
                <p className="text-xs text-muted-foreground">No se puede cambiar el estudiante de una matrícula existente.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select
                  value={nivelDialogo}
                  onValueChange={(v) => v && onCambiarNivelDialogo(v as NivelEducativo)}
                  itemToStringLabel={(v) => (v ? ETIQUETAS_NIVEL_EDUCATIVO[v as NivelEducativo] : "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDEN_NIVELES_EDUCATIVOS.map((n) => (
                      <SelectItem key={n} value={n}>{ETIQUETAS_NIVEL_EDUCATIVO[n]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sección</Label>
                <Select
                  value={form.seccionId}
                  onValueChange={(v) => setForm({ ...form, seccionId: v ?? "" })}
                  itemToStringLabel={nombreSeccion}
                  disabled={!nivelDialogo}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {seccionesDelNivelDialogo.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.grado} {s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input
                type="number"
                value={form.anio}
                onChange={(e) => setForm({ ...form, anio: e.target.value })}
              />
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
