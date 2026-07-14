"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, LockOpen, Lock, MoreVertical } from "lucide-react";
import { UnidadDidacticaProps } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import {
  accionGenerarUnidadesDidacticas,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  unidadesDidacticas: UnidadDidacticaProps[];
  periodos: PeriodoProps[];
  cursos: CursoProps[];
}

function TarjetaUnidadDidactica({
  unidad,
  nombrePeriodo,
  nombreCurso,
  onEditar,
  onAbrir,
  onCerrar,
}: {
  unidad: UnidadDidacticaProps;
  nombrePeriodo: (id: string) => string;
  nombreCurso: (id: string) => string;
  onEditar: (unidad: UnidadDidacticaProps) => void;
  onAbrir: (id: string) => void;
  onCerrar: (id: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {nombreCurso(unidad.cursoId)} · {unidad.nombre}
          </p>
          <p className="truncate text-sm text-muted-foreground">{nombrePeriodo(unidad.periodoId)}</p>
          <p className="truncate text-sm text-muted-foreground">
            {unidad.fechaInicio} — {unidad.fechaFin}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(unidad)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            {unidad.estado === "CERRADO" && (
              <DropdownMenuItem onClick={() => onAbrir(unidad.id)}>
                <LockOpen className="size-4" />
                Abrir
              </DropdownMenuItem>
            )}
            {unidad.estado === "ABIERTO" && (
              <DropdownMenuItem variant="destructive" onClick={() => onCerrar(unidad.id)}>
                <Lock className="size-4" />
                Cerrar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3">
        {unidad.estado === "ABIERTO" ? (
          <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Abierto</Badge>
        ) : (
          <Badge variant="secondary">Cerrado</Badge>
        )}
      </div>
    </Card>
  );
}

export function TablaUnidadesDidacticas({ unidadesDidacticas, periodos, cursos }: Props) {
  const router = useRouter();
  const [abiertoGenerar, setAbiertoGenerar] = useState(false);
  const [abiertoEditar, setAbiertoEditar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<UnidadDidacticaProps | null>(null);
  const [formGenerar, setFormGenerar] = useState({ cursoId: "", periodoId: "" });
  const [formEditar, setFormEditar] = useState({ nombre: "", fechaInicio: "", fechaFin: "" });

  function abrirGenerar() {
    setFormGenerar({ cursoId: "", periodoId: "" });
    setAbiertoGenerar(true);
  }

  function abrirEditar(unidadDidactica: UnidadDidacticaProps) {
    setEditando(unidadDidactica);
    setFormEditar({
      nombre: unidadDidactica.nombre,
      fechaInicio: unidadDidactica.fechaInicio,
      fechaFin: unidadDidactica.fechaFin,
    });
    setAbiertoEditar(true);
  }

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  }

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre || "(curso eliminado)";
  }

  async function onGenerar() {
    setLoading(true);
    const resultado = await accionGenerarUnidadesDidacticas(formGenerar);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setAbiertoGenerar(false);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
    setLoading(false);
  }

  async function onEditar() {
    if (!editando) return;
    setLoading(true);
    const resultado = await accionActualizarUnidadDidactica({ id: editando.id, ...formEditar });
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setAbiertoEditar(false);
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
          <p className="text-sm text-muted-foreground">
            Cada curso tiene Unidad 1 y Unidad 2 por bimestre, generadas automáticamente a partir de las fechas del periodo.
          </p>
        </div>
        <Button onClick={abrirGenerar}>
          <Plus className="size-4" />
          Generar para un curso
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {unidadesDidacticas.map((u) => (
          <TarjetaUnidadDidactica
            key={u.id}
            unidad={u}
            nombrePeriodo={nombrePeriodo}
            nombreCurso={nombreCurso}
            onEditar={abrirEditar}
            onAbrir={onAbrir}
            onCerrar={onCerrar}
          />
        ))}
        {unidadesDidacticas.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No hay unidades didácticas registradas.</p>
        )}
      </div>

      <Card className="hidden p-0 md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidadesDidacticas.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{nombreCurso(u.cursoId)}</TableCell>
                  <TableCell>{u.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{nombrePeriodo(u.periodoId)}</TableCell>
                  <TableCell className="text-muted-foreground">{u.fechaInicio} — {u.fechaFin}</TableCell>
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
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No hay unidades didácticas registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={abiertoGenerar} onOpenChange={setAbiertoGenerar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Unidad 1 y Unidad 2</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={formGenerar.cursoId} onValueChange={(v) => setFormGenerar({ ...formGenerar, cursoId: v ?? "" })} itemToStringLabel={nombreCurso}>
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
              <Label>Periodo</Label>
              <Select value={formGenerar.periodoId} onValueChange={(v) => setFormGenerar({ ...formGenerar, periodoId: v ?? "" })} itemToStringLabel={nombrePeriodo}>
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
            <p className="text-sm text-muted-foreground">
              Las fechas de Unidad 1 y Unidad 2 se calculan automáticamente dividiendo el bimestre en 2 meses. Si ya existen para este curso y periodo, no se duplican.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbiertoGenerar(false)}>
              Cancelar
            </Button>
            <Button onClick={onGenerar} disabled={loading || !formGenerar.cursoId || !formGenerar.periodoId}>
              {loading ? "Generando..." : "Generar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={abiertoEditar} onOpenChange={setAbiertoEditar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidad Didáctica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formEditar.nombre} onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input type="date" value={formEditar.fechaInicio} onChange={(e) => setFormEditar({ ...formEditar, fechaInicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de fin</Label>
              <Input type="date" value={formEditar.fechaFin} onChange={(e) => setFormEditar({ ...formEditar, fechaFin: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbiertoEditar(false)}>
              Cancelar
            </Button>
            <Button onClick={onEditar} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
