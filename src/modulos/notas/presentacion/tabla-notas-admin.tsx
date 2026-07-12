"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { NotaProps } from "@/modulos/notas/dominio/nota";
import { AsignacionProps } from "@/modulos/asignaciones/dominio/asignacion";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { accionListarNotasPorAsignacion } from "@/modulos/notas/presentacion/acciones";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  asignaciones: AsignacionProps[];
  estudiantes: EstudianteProps[];
  cursos: CursoProps[];
  secciones: SeccionProps[];
  periodos: PeriodoProps[];
}

export function TablaNotasAdmin({ asignaciones, estudiantes, cursos, secciones, periodos }: Props) {
  const [asignacionId, setAsignacionId] = useState("");
  const [notas, setNotas] = useState<NotaProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  async function onBuscar() {
    if (!asignacionId) return;
    setLoading(true);
    const resultado = await accionListarNotasPorAsignacion(asignacionId);
    setNotas(resultado);
    setBuscado(true);
    setLoading(false);
  }

  function nombreEstudiante(id: string) {
    return estudiantes.find((e) => e.id === id)?.nombreCompleto || "(estudiante eliminado)";
  }

  function nombreAsignacion(a: AsignacionProps) {
    const curso = cursos.find((c) => c.id === a.cursoId)?.nombre ?? "(curso eliminado)";
    const seccion = secciones.find((s) => s.id === a.seccionId);
    const seccionNombre = seccion ? `${seccion.grado} ${seccion.nombre}` : "(sección eliminada)";
    const periodo = periodos.find((p) => p.id === a.periodoId)?.nombre ?? "(periodo eliminado)";
    return `${curso} · ${seccionNombre} · ${periodo}`;
  }

  function nombreAsignacionPorId(id: string) {
    const asignacion = asignaciones.find((a) => a.id === id);
    return asignacion ? nombreAsignacion(asignacion) : "(asignación eliminada)";
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Notas</h1>
          <p className="text-sm text-muted-foreground">Consulta las notas registradas por asignación.</p>
        </div>
        <Badge variant="secondary">Solo lectura</Badge>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label>Asignación</Label>
              <Select value={asignacionId} onValueChange={(v) => setAsignacionId(v ?? "")} itemToStringLabel={nombreAsignacionPorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar asignación" />
                </SelectTrigger>
                <SelectContent>
                  {asignaciones.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{nombreAsignacion(a)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onBuscar} disabled={!asignacionId || loading}>
              <Search className="size-4" />
              {loading ? "Buscando..." : "Ver notas"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {buscado && (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {notas.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{nombreEstudiante(n.estudianteId)}</TableCell>
                    <TableCell className="text-muted-foreground">{n.tipo}</TableCell>
                    <TableCell className="text-muted-foreground">{n.etiqueta}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${n.valor >= 11 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                        {n.valor}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{n.fecha}</TableCell>
                  </TableRow>
                ))}
                {notas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No hay notas para esta asignación.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
