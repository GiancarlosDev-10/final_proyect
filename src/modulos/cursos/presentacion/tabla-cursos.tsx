"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { AreaProps } from "@/modulos/areas/dominio/area";
import { accionCrearCurso, accionActualizarCurso, accionEliminarCurso } from "@/modulos/cursos/presentacion/acciones";
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

const SIN_AREA = "SIN_AREA";

interface Props {
  cursos: CursoProps[];
  areas: AreaProps[];
}

function TarjetaCurso({
  curso,
  nombreArea,
  onEditar,
  onEliminar,
}: {
  curso: CursoProps;
  nombreArea: (id: string) => string;
  onEditar: (curso: CursoProps) => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{curso.nombre}</p>
          <p className="truncate text-sm text-muted-foreground">{curso.descripcion || "Sin descripción"}</p>
          <p className="truncate text-sm text-muted-foreground">
            Área: {curso.areaId ? nombreArea(curso.areaId) : "Sin asignar"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(curso)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onEliminar(curso.id)}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {curso.activo ? (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaCursos({ cursos, areas }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<CursoProps | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", areaId: SIN_AREA });

  function abrirCrear() {
    setEditando(null);
    setForm({ nombre: "", descripcion: "", areaId: SIN_AREA });
    setAbierto(true);
  }

  function abrirEditar(curso: CursoProps) {
    setEditando(curso);
    setForm({ nombre: curso.nombre, descripcion: curso.descripcion || "", areaId: curso.areaId || SIN_AREA });
    setAbierto(true);
  }

  function nombreArea(id: string) {
    return areas.find((a) => a.id === id)?.nombre || "(área eliminada)";
  }

  async function onSubmit() {
    setLoading(true);
    let resultado;
    const areaId = form.areaId === SIN_AREA ? undefined : form.areaId;

    if (editando) {
      resultado = await accionActualizarCurso({
        id: editando.id,
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        areaId,
        activo: editando.activo,
      });
    } else {
      resultado = await accionCrearCurso({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        areaId,
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
    const resultado = await accionEliminarCurso(id);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Cursos</h1>
          <p className="text-sm text-muted-foreground">Gestiona el catálogo de cursos del colegio.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nuevo curso
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {cursos.map((c) => (
          <TarjetaCurso key={c.id} curso={c} nombreArea={nombreArea} onEditar={abrirEditar} onEliminar={onEliminar} />
        ))}
        {cursos.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No hay cursos registrados.</p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cursos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{c.descripcion || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.areaId ? nombreArea(c.areaId) : "Sin asignar"}</TableCell>
                  <TableCell>
                    {c.activo ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(c)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onEliminar(c.id)}>
                        <Trash2 className="size-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {cursos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No hay cursos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Área (opcional)</Label>
              <Select value={form.areaId} onValueChange={(v) => setForm({ ...form, areaId: v ?? SIN_AREA })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_AREA}>Sin asignar</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
