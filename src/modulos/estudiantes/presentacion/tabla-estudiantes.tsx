"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { accionCrearEstudiante, accionActualizarEstudiante, accionEliminarEstudiante } from "@/modulos/estudiantes/presentacion/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  estudiantes: EstudianteProps[];
}

function TarjetaEstudiante({
  estudiante,
  onEditar,
  onEliminar,
}: {
  estudiante: EstudianteProps;
  onEditar: (estudiante: EstudianteProps) => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{estudiante.nombreCompleto}</p>
          <p className="truncate text-sm text-muted-foreground">Documento: {estudiante.documento}</p>
          <p className="truncate text-sm text-muted-foreground">Apoderado: {estudiante.apoderado.nombre}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(estudiante)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onEliminar(estudiante.id)}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {estudiante.activo ? (
          <StatusBadge variant="success">Activo</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">Inactivo</StatusBadge>
        )}
      </div>
    </Card>
  );
}

export function TablaEstudiantes({ estudiantes }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<EstudianteProps | null>(null);
  const [form, setForm] = useState({
    documento: "",
    nombreCompleto: "",
    fechaNacimiento: "",
    apoderadoNombre: "",
    apoderadoTelefono: "",
    apoderadoParentesco: "",
  });

  function abrirCrear() {
    setEditando(null);
    setForm({ documento: "", nombreCompleto: "", fechaNacimiento: "", apoderadoNombre: "", apoderadoTelefono: "", apoderadoParentesco: "" });
    setAbierto(true);
  }

  function abrirEditar(e: EstudianteProps) {
    setEditando(e);
    setForm({
      documento: e.documento,
      nombreCompleto: e.nombreCompleto,
      fechaNacimiento: e.fechaNacimiento,
      apoderadoNombre: e.apoderado.nombre,
      apoderadoTelefono: e.apoderado.telefono,
      apoderadoParentesco: e.apoderado.parentesco,
    });
    setAbierto(true);
  }

  async function onSubmit() {
    setLoading(true);
    const apoderado = { nombre: form.apoderadoNombre, telefono: form.apoderadoTelefono, parentesco: form.apoderadoParentesco };
    let resultado;

    if (editando) {
      resultado = await accionActualizarEstudiante({
        id: editando.id,
        documento: form.documento,
        nombreCompleto: form.nombreCompleto,
        fechaNacimiento: form.fechaNacimiento,
        apoderado,
        activo: editando.activo,
      });
    } else {
      resultado = await accionCrearEstudiante({
        documento: form.documento,
        nombreCompleto: form.nombreCompleto,
        fechaNacimiento: form.fechaNacimiento,
        apoderado,
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
    const resultado = await accionEliminarEstudiante(id);
    if (resultado.ok) { toast.success(resultado.mensaje); router.refresh(); }
    else toast.error(resultado.mensaje);
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">Administra la información de los estudiantes matriculados.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nuevo estudiante
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {estudiantes.map((e) => (
          <TarjetaEstudiante key={e.id} estudiante={e} onEditar={abrirEditar} onEliminar={onEliminar} />
        ))}
        {estudiantes.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No hay estudiantes registrados.</p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Apoderado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantes.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nombreCompleto}</TableCell>
                  <TableCell className="text-muted-foreground">{e.documento}</TableCell>
                  <TableCell className="text-muted-foreground">{e.apoderado.nombre}</TableCell>
                  <TableCell>
                    {e.activo ? (
                      <StatusBadge variant="success">Activo</StatusBadge>
                    ) : (
                      <StatusBadge variant="neutral">Inactivo</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(e)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onEliminar(e.id)}>
                        <Trash2 className="size-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {estudiantes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No hay estudiantes registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Estudiante" : "Nuevo Estudiante"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Documento</Label>
              <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} placeholder="DNI" />
            </div>
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} />
            </div>
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Datos del apoderado</p>
            <div className="space-y-2">
              <Label>Nombre del apoderado</Label>
              <Input value={form.apoderadoNombre} onChange={(e) => setForm({ ...form, apoderadoNombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.apoderadoTelefono} onChange={(e) => setForm({ ...form, apoderadoTelefono: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Parentesco</Label>
              <Input value={form.apoderadoParentesco} onChange={(e) => setForm({ ...form, apoderadoParentesco: e.target.value })} placeholder="Ej: Madre, Padre, Tutor" />
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
