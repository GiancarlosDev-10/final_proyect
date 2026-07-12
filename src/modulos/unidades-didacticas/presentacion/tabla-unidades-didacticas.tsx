"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, LockOpen, Lock } from "lucide-react";
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import {
  accionCrearUnidadDidactica,
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

interface Props {
  unidadesDidacticas: UnidadDidacticaProps[];
  periodos: PeriodoProps[];
}

export function TablaUnidadesDidacticas({ unidadesDidacticas, periodos }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<UnidadDidacticaProps | null>(null);
  const [form, setForm] = useState({ nombre: "", periodoId: "" });

  function abrirCrear() {
    setEditando(null);
    setForm({ nombre: "", periodoId: "" });
    setAbierto(true);
  }

  function abrirEditar(unidadDidactica: UnidadDidacticaProps) {
    setEditando(unidadDidactica);
    setForm({ nombre: unidadDidactica.nombre, periodoId: unidadDidactica.periodoId });
    setAbierto(true);
  }

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  }

  async function onSubmit() {
    setLoading(true);
    let resultado;

    if (editando) {
      resultado = await accionActualizarUnidadDidactica({
        id: editando.id,
        nombre: form.nombre,
        periodoId: form.periodoId,
      });
    } else {
      resultado = await accionCrearUnidadDidactica({
        nombre: form.nombre,
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
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Unidades Didácticas</h1>
          <p className="text-sm text-muted-foreground">Controla los meses dentro de cada periodo y su estado.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nueva unidad didáctica
        </Button>
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidadesDidacticas.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{nombrePeriodo(u.periodoId)}</TableCell>
                  <TableCell>
                    {u.estado === "ABIERTO" ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Abierto</Badge>
                    ) : (
                      <Badge variant="secondary">Cerrado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
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
              {unidadesDidacticas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No hay unidades didácticas registradas.
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
            <DialogTitle>{editando ? "Editar Unidad Didáctica" : "Nueva Unidad Didáctica"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Mes 1" />
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
