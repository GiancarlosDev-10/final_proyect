"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { NotaProps } from "@/modulos/notas/dominio/nota";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import {
  accionListarNotasPorAsignacionProfesor,
  accionRegistrarNota,
  accionEditarNota,
  accionEliminarNotaProfesor,
} from "@/app/profesores/dashboard/notas/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_NOTA, TipoNota } from "@/config/constantes";

interface Props {
  asignaciones: AsignacionProps[];
  estudiantes: EstudianteProps[];
  periodos: PeriodoProps[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
}

export function TablaNotasProfesor({ asignaciones, estudiantes, periodos, cursos, secciones }: Props) {
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<AsignacionProps | null>(null);
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

  async function onSeleccionarAsignacion(id: string) {
    const asignacion = asignaciones.find((a) => a.id === id) || null;
    setAsignacionSeleccionada(asignacion);
    if (!id) { setNotas([]); return; }
    setLoadingNotas(true);
    const resultado = await accionListarNotasPorAsignacionProfesor(id);
    setNotas(resultado);
    setLoadingNotas(false);
  }

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
    setLoading(true);
    let resultado;

    if (editando) {
      resultado = await accionEditarNota({
        id: editando.id,
        tipo: form.tipo,
        etiqueta: form.etiqueta,
        valor: parseFloat(form.valor),
        fecha: form.fecha,
        cursoId: asignacionSeleccionada.cursoId,
        seccionId: asignacionSeleccionada.seccionId,
        periodoId: asignacionSeleccionada.periodoId,
        profesorId: "",
      });
    } else {
      resultado = await accionRegistrarNota({
        estudianteId: form.estudianteId,
        asignacionId: asignacionSeleccionada.id,
        periodoId: asignacionSeleccionada.periodoId,
        tipo: form.tipo,
        etiqueta: form.etiqueta,
        valor: parseFloat(form.valor),
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
    setLoading(false);
  }

  async function onEliminar(nota: NotaProps) {
    if (!asignacionSeleccionada) return;
    const resultado = await accionEliminarNotaProfesor({
      id: nota.id,
      cursoId: asignacionSeleccionada.cursoId,
      seccionId: asignacionSeleccionada.seccionId,
      periodoId: asignacionSeleccionada.periodoId,
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

  function nombreAsignacionPorId(id: string) {
    const a = asignaciones.find((a) => a.id === id);
    if (!a) return "(asignación eliminada)";
    return `${nombrePeriodo(a.periodoId)} — ${nombreCurso(a.cursoId)} — ${nombreSeccion(a.seccionId)}`;
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Mis Notas</h1>
          <p className="text-sm text-muted-foreground">Registra y consulta las notas de tus asignaciones.</p>
        </div>
        {asignacionSeleccionada && (
          <Button onClick={abrirCrear}>
            <Plus className="size-4" />
            Registrar nota
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <div className="space-y-2">
            <Label>Asignación</Label>
            <Select value={asignacionSeleccionada?.id ?? ""} onValueChange={(v) => onSeleccionarAsignacion(v ?? "")} itemToStringLabel={nombreAsignacionPorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar asignación" />
              </SelectTrigger>
              <SelectContent>
                {asignaciones.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {nombrePeriodo(a.periodoId)} — {nombreCurso(a.cursoId)} — {nombreSeccion(a.seccionId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loadingNotas && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando notas...
        </div>
      )}

      {!loadingNotas && asignacionSeleccionada && (
        <Card className="p-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Etiqueta</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notas.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{nombreEstudiante(n.estudianteId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{n.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{n.etiqueta}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${n.valor >= 11 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                        {n.valor}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{n.fecha}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
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
                {notas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No hay notas para esta asignación.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
