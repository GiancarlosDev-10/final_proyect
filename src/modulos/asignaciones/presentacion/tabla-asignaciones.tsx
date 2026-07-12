"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { UsuarioPublico } from "@/modulos/usuarios/dominio/usuario";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { accionCrearAsignacion, accionActualizarAsignacion, accionEliminarAsignacion } from "@/modulos/asignaciones/presentacion/acciones";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  asignaciones: AsignacionProps[];
  profesores: UsuarioPublico[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  periodos: PeriodoProps[];
}

export function TablaAsignaciones({ asignaciones, profesores, cursos, secciones, periodos }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<AsignacionProps | null>(null);
  const [form, setForm] = useState({ profesorId: "", cursoId: "", seccionId: "", periodoId: "" });

  function abrirCrear() {
    setEditando(null);
    setForm({ profesorId: "", cursoId: "", seccionId: "", periodoId: "" });
    setAbierto(true);
  }

  function abrirEditar(asignacion: AsignacionProps) {
    setEditando(asignacion);
    setForm({
      profesorId: asignacion.profesorId,
      cursoId: asignacion.cursoId,
      seccionId: asignacion.seccionId,
      periodoId: asignacion.periodoId,
    });
    setAbierto(true);
  }

  async function onSubmit() {
    setLoading(true);
    let resultado;

    if (editando) {
      resultado = await accionActualizarAsignacion({
        id: editando.id,
        profesorId: form.profesorId,
        cursoId: form.cursoId,
        seccionId: form.seccionId,
        periodoId: form.periodoId,
        activo: editando.activo,
      });
    } else {
      resultado = await accionCrearAsignacion({
        profesorId: form.profesorId,
        cursoId: form.cursoId,
        seccionId: form.seccionId,
        periodoId: form.periodoId,
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
    const resultado = await accionEliminarAsignacion(id);
    if (resultado.ok) { toast.success(resultado.mensaje); router.refresh(); }
    else toast.error(resultado.mensaje);
  }

  function nombreProfesor(id: string) {
    return profesores.find((p) => p.id === id)?.nombreCompleto || "(profesor eliminado)";
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

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Asignaciones</h1>
          <p className="text-sm text-muted-foreground">Vincula profesores a cursos, secciones y periodos.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nueva asignación
        </Button>
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesor</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Sección</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asignaciones.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{nombreProfesor(a.profesorId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombreCurso(a.cursoId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombreSeccion(a.seccionId)}</TableCell>
                  <TableCell className="text-muted-foreground">{nombrePeriodo(a.periodoId)}</TableCell>
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
              {asignaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No hay asignaciones registradas.
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
            <DialogTitle>{editando ? "Editar Asignación" : "Nueva Asignación"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profesor</Label>
              <Select value={form.profesorId} onValueChange={(v) => setForm({ ...form, profesorId: v ?? "" })} itemToStringLabel={nombreProfesor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar profesor" />
                </SelectTrigger>
                <SelectContent>
                  {profesores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombreCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={form.cursoId} onValueChange={(v) => setForm({ ...form, cursoId: v ?? "" })} itemToStringLabel={nombreCurso}>
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
              <Label>Periodo</Label>
              <Select value={form.periodoId} onValueChange={(v) => setForm({ ...form, periodoId: v ?? "" })} itemToStringLabel={nombrePeriodo}>
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
