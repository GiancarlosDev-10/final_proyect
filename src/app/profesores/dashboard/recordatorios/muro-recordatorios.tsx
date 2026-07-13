"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { RecordatorioProps } from "@/modulos/recordatorios/dominio/recordatorio";
import {
  accionCrearRecordatorio,
  accionActualizarRecordatorio,
  accionEliminarRecordatorio,
} from "@/app/profesores/dashboard/recordatorios/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_RECORDATORIO, TipoRecordatorio } from "@/config/constantes";
import { cn } from "@/lib/utils";

interface Props {
  recordatorios: RecordatorioProps[];
}

const ETIQUETAS_TIPO: Record<TipoRecordatorio, string> = {
  REUNION_PADRE: "Reunión con padre",
  REUNION_PROFESOR: "Reunión con profesor",
  REUNION_DIRECTOR: "Reunión con director",
  OTRO: "Otro",
};

const COLORES_TIPO: Record<TipoRecordatorio, string> = {
  REUNION_PADRE: "bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800",
  REUNION_PROFESOR: "bg-sky-100 border-sky-300 dark:bg-sky-950/40 dark:border-sky-800",
  REUNION_DIRECTOR: "bg-rose-100 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800",
  OTRO: "bg-slate-100 border-slate-300 dark:bg-slate-800/40 dark:border-slate-700",
};

const FORM_VACIO = { fecha: "", titulo: "", descripcion: "", tipo: TIPOS_RECORDATORIO.OTRO as TipoRecordatorio };

export function MuroRecordatorios({ recordatorios }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<RecordatorioProps | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setAbierto(true);
  }

  function abrirEditar(r: RecordatorioProps) {
    setEditando(r);
    setForm({ fecha: r.fecha, titulo: r.titulo, descripcion: r.descripcion || "", tipo: r.tipo });
    setAbierto(true);
  }

  async function onSubmit() {
    if (!form.fecha || !form.titulo.trim()) {
      toast.error("Ingresa al menos la fecha y el título.");
      return;
    }
    setLoading(true);
    try {
      const datos = {
        fecha: form.fecha,
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        tipo: form.tipo,
      };
      const resultado = editando
        ? await accionActualizarRecordatorio({ id: editando.id, ...datos })
        : await accionCrearRecordatorio(datos);

      if (resultado.ok) {
        toast.success(resultado.mensaje);
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(resultado.mensaje);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onEliminar(id: string) {
    const resultado = await accionEliminarRecordatorio(id);
    if (resultado.ok) {
      toast.success(resultado.mensaje);
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }
  }

  const recordatoriosOrdenados = [...recordatorios].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Mis Recordatorios</h1>
          <p className="text-sm text-muted-foreground">Reuniones y pendientes personales, solo visibles para ti.</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="size-4" />
          Nuevo recordatorio
        </Button>
      </div>

      {recordatoriosOrdenados.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tienes recordatorios todavía.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recordatoriosOrdenados.map((r) => (
            <div
              key={r.id}
              className={cn("flex flex-col gap-2 rounded-lg border p-4 shadow-sm", COLORES_TIPO[r.tipo])}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{r.fecha}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => abrirEditar(r)}
                    className="rounded p-1 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Editar"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onEliminar(r.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {ETIQUETAS_TIPO[r.tipo]}
              </p>
              <p className="font-medium">{r.titulo}</p>
              {r.descripcion && <p className="text-sm text-muted-foreground">{r.descripcion}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Recordatorio" : "Nuevo Recordatorio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: (v ?? "OTRO") as TipoRecordatorio })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TIPOS_RECORDATORIO).map((t) => (
                    <SelectItem key={t} value={t}>{ETIQUETAS_TIPO[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Reunión con padre de Nikolas"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
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
