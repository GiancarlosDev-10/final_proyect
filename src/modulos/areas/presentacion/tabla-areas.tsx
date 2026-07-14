"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { AreaProps } from "@/modulos/areas/dominio/area";
import { accionCrearArea, accionActualizarArea, accionEliminarArea } from "@/modulos/areas/presentacion/acciones";
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
}

function TarjetaArea({
  area,
  onEditar,
  onEliminar,
}: {
  area: AreaProps;
  onEditar: (area: AreaProps) => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{area.nombre}</p>
          <p className="truncate text-sm text-muted-foreground">{area.descripcion || "Sin descripción"}</p>
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

export function TablaAreas({ areas }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<AreaProps | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });

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
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Áreas</h1>
          <p className="text-sm text-muted-foreground">Gestiona las áreas curriculares del colegio.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nueva área
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {areas.map((a) => (
          <TarjetaArea key={a.id} area={a} onEditar={abrirEditar} onEliminar={onEliminar} />
        ))}
        {areas.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No hay áreas registradas.</p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{a.descripcion || "—"}</TableCell>
                  <TableCell>
                    {a.activo ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
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
              {areas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No hay áreas registradas.
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
