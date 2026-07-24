"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical, Search } from "lucide-react";
import { AreaProps } from "@/modulos/areas/dominio/area";
import { accionCrearArea, accionActualizarArea, accionEliminarArea } from "@/modulos/areas/presentacion/acciones";
import { normalizarTexto } from "@/compartido/lib/normalizar-texto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  areas: AreaProps[];
  cursosPorArea: Record<string, string[]>;
}

function textoCursos(cursos: string[] | undefined): string {
  return cursos && cursos.length > 0 ? cursos.join(", ") : "Sin cursos asignados";
}

function TarjetaArea({
  area,
  cursos,
  onEditar,
  onEliminar,
}: {
  area: AreaProps;
  cursos: string[] | undefined;
  onEditar: (area: AreaProps) => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{area.nombre}</p>
          <p className="truncate text-sm text-muted-foreground">{textoCursos(cursos)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(area)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onEliminar(area.id)}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {area.activo ? (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaAreas({ areas, cursosPorArea }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<AreaProps | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [busqueda, setBusqueda] = useState("");

  const areasFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    if (!termino) return areas;
    return areas.filter(
      (a) =>
        normalizarTexto(a.nombre).includes(termino) ||
        normalizarTexto(textoCursos(cursosPorArea[a.id])).includes(termino)
    );
  }, [areas, cursosPorArea, busqueda]);

  function abrirCrear() {
    setEditando(null);
    setForm({ nombre: "", descripcion: "" });
    setAbierto(true);
  }

  function abrirEditar(area: AreaProps) {
    setEditando(area);
    setForm({ nombre: area.nombre, descripcion: area.descripcion || "" });
    setAbierto(true);
  }

  async function onSubmit() {
    setLoading(true);
    let resultado;

    if (editando) {
      resultado = await accionActualizarArea({
        id: editando.id,
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        activo: editando.activo,
      });
    } else {
      resultado = await accionCrearArea({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
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
    const resultado = await accionEliminarArea(id);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Áreas</h1>
        <p className="text-sm text-muted-foreground">Gestiona las áreas curriculares del colegio.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o curso..."
            className="pl-8"
          />
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nueva área
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {areasFiltradas.map((a) => (
          <TarjetaArea key={a.id} area={a} cursos={cursosPorArea[a.id]} onEditar={abrirEditar} onEliminar={onEliminar} />
        ))}
        {areasFiltradas.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {areas.length === 0 ? "No hay áreas registradas." : "Ningún área coincide con la búsqueda."}
          </p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Nombre</TableHead>
                <TableHead className="w-[28rem]">Cursos</TableHead>
                <TableHead className="w-24 text-center">Estado</TableHead>
                <TableHead className="w-64 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areasFiltradas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="truncate font-medium">{a.nombre}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{textoCursos(cursosPorArea[a.id])}</TableCell>
                  <TableCell className="text-center">
                    {a.activo ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(a)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onEliminar(a.id)}>
                        <Trash2 className="size-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {areasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {areas.length === 0 ? "No hay áreas registradas." : "Ningún área coincide con la búsqueda."}
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
            <DialogTitle>{editando ? "Editar Área" : "Nueva Área"}</DialogTitle>
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
