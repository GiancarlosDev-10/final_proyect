"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { MatriculaProps } from "@/modulos/matriculas/dominio/matricula";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { accionCrearMatricula, accionActualizarMatricula, accionEliminarMatricula } from "@/modulos/matriculas/presentacion/acciones";
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
  matriculas: MatriculaProps[];
  estudiantes: EstudianteProps[];
  secciones: SeccionProps[];
}

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
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<MatriculaProps | null>(null);
  const [form, setForm] = useState({
    estudianteId: "",
    seccionId: "",
    anio: new Date().getFullYear().toString(),
  });

  function abrirCrear() {
    setEditando(null);
    setForm({ estudianteId: "", seccionId: "", anio: new Date().getFullYear().toString() });
    setAbierto(true);
  }

  function abrirEditar(matricula: MatriculaProps) {
    setEditando(matricula);
    setForm({ estudianteId: matricula.estudianteId, seccionId: matricula.seccionId, anio: matricula.anio.toString() });
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

  function nombreEstudiante(id: string) {
    return estudiantes.find((e) => e.id === id)?.nombreCompleto || "(estudiante eliminado)";
  }

  function nombreSeccion(id: string) {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Matrículas</h1>
          <p className="text-sm text-muted-foreground">Asocia estudiantes a una sección por año escolar.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nueva matrícula
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {matriculas.map((m) => (
          <TarjetaMatricula
            key={m.id}
            matricula={m}
            nombreEstudiante={nombreEstudiante}
            nombreSeccion={nombreSeccion}
            onEditar={abrirEditar}
            onEliminar={onEliminar}
          />
        ))}
        {matriculas.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No hay matrículas registradas.</p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Sección</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculas.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{nombreEstudiante(m.estudianteId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombreSeccion(m.seccionId)}</TableCell>
                  <TableCell className="text-muted-foreground">{m.anio}</TableCell>
                  <TableCell>
                    {m.activo ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
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
              {matriculas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No hay matrículas registradas.
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
                  {estudiantes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nombreCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editando && (
                <p className="text-xs text-muted-foreground">No se puede cambiar el estudiante de una matrícula existente.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sección</Label>
              <Select value={form.seccionId} onValueChange={(v) => setForm({ ...form, seccionId: v ?? "" })} itemToStringLabel={nombreSeccion}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                  {secciones.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.grado} {s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
