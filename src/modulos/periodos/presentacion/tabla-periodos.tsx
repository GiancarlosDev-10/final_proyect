"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, LockOpen, Lock, MoreVertical } from "lucide-react";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { accionCrearPeriodo, accionActualizarPeriodo, accionAbrirPeriodo, accionCerrarPeriodo } from "@/modulos/periodos/presentacion/acciones";
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
  periodos: PeriodoProps[];
}

function TarjetaPeriodo({
  periodo,
  onEditar,
  onAbrir,
  onCerrar,
}: {
  periodo: PeriodoProps;
  onEditar: (periodo: PeriodoProps) => void;
  onAbrir: (id: string) => void;
  onCerrar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{periodo.nombre}</p>
          <p className="truncate text-sm text-muted-foreground">Año {periodo.anio}</p>
          <p className="truncate text-sm text-muted-foreground">{periodo.fechaInicio} — {periodo.fechaFin}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(periodo)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            {periodo.estado === "CERRADO" && (
              <DropdownMenuItem onClick={() => onAbrir(periodo.id)}>
                <LockOpen className="size-4" />
                Abrir
              </DropdownMenuItem>
            )}
            {periodo.estado === "ABIERTO" && (
              <DropdownMenuItem variant="destructive" onClick={() => onCerrar(periodo.id)}>
                <Lock className="size-4" />
                Cerrar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {periodo.estado === "ABIERTO" ? (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Abierto</Badge>
        ) : (
          <Badge variant="secondary">Cerrado</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaPeriodos({ periodos }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<PeriodoProps | null>(null);
  const [form, setForm] = useState({ nombre: "", anio: new Date().getFullYear().toString(), fechaInicio: "", fechaFin: "" });

  function abrirCrear() {
    setEditando(null);
    setForm({ nombre: "", anio: new Date().getFullYear().toString(), fechaInicio: "", fechaFin: "" });
    setAbierto(true);
  }

  function abrirEditar(periodo: PeriodoProps) {
    setEditando(periodo);
    setForm({ nombre: periodo.nombre, anio: periodo.anio.toString(), fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin });
    setAbierto(true);
  }

  async function onSubmit() {
    setLoading(true);
    let resultado;

    if (editando) {
      resultado = await accionActualizarPeriodo({
        id: editando.id,
        nombre: form.nombre,
        anio: parseInt(form.anio),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
      });
    } else {
      resultado = await accionCrearPeriodo({
        nombre: form.nombre,
        anio: parseInt(form.anio),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
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
    const resultado = await accionAbrirPeriodo(id);
    if (resultado.ok) { toast.success(resultado.mensaje); router.refresh(); }
    else toast.error(resultado.mensaje);
  }

  async function onCerrar(id: string) {
    const resultado = await accionCerrarPeriodo(id);
    if (resultado.ok) { toast.success(resultado.mensaje); router.refresh(); }
    else toast.error(resultado.mensaje);
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Periodos</h1>
          <p className="text-sm text-muted-foreground">Controla los bimestres/trimestres académicos y su estado.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nuevo periodo
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {periodos.map((p) => (
          <TarjetaPeriodo key={p.id} periodo={p} onEditar={abrirEditar} onAbrir={onAbrir} onCerrar={onCerrar} />
        ))}
        {periodos.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No hay periodos registrados.</p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periodos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{p.anio}</TableCell>
                  <TableCell className="text-muted-foreground">{p.fechaInicio}</TableCell>
                  <TableCell className="text-muted-foreground">{p.fechaFin}</TableCell>
                  <TableCell>
                    {p.estado === "ABIERTO" ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Abierto</Badge>
                    ) : (
                      <Badge variant="secondary">Cerrado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(p)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      {p.estado === "CERRADO" && (
                        <Button variant="outline" size="sm" onClick={() => onAbrir(p.id)}>
                          <LockOpen className="size-3.5" />
                          Abrir
                        </Button>
                      )}
                      {p.estado === "ABIERTO" && (
                        <Button variant="destructive" size="sm" onClick={() => onCerrar(p.id)}>
                          <Lock className="size-3.5" />
                          Cerrar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {periodos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No hay periodos registrados.
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
            <DialogTitle>{editando ? "Editar Periodo" : "Nuevo Periodo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Bimestre 1" />
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
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
