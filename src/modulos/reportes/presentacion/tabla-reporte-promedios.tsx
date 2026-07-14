"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { AreaProps } from "@/modulos/areas/dominio/area";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { PromedioArea } from "@/modulos/reportes/aplicacion/calcular-promedio-area";
import { accionCalcularPromedioArea } from "@/modulos/reportes/presentacion/acciones";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  estudiantes: EstudianteProps[];
  areas: AreaProps[];
  periodos: PeriodoProps[];
  cursos: CursoProps[];
}

function formatearPromedio(valor: number | null): string {
  return valor === null ? "—" : valor.toFixed(1);
}

export function TablaReportePromedios({ estudiantes, areas, periodos, cursos }: Props) {
  const [estudianteId, setEstudianteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [reporte, setReporte] = useState<PromedioArea | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  async function onBuscar() {
    if (!estudianteId || !areaId || !periodoId) return;
    setLoading(true);
    const resultado = await accionCalcularPromedioArea({ estudianteId, areaId, periodoId });
    setReporte(resultado);
    setBuscado(true);
    setLoading(false);
  }

  function nombreEstudiante(id: string) {
    return estudiantes.find((e) => e.id === id)?.nombreCompleto || "(estudiante eliminado)";
  }

  function nombreArea(id: string) {
    return areas.find((a) => a.id === id)?.nombre || "(área eliminada)";
  }

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  }

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre || "(curso eliminado)";
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Reporte de Promedios</h1>
          <p className="text-sm text-muted-foreground">
            Promedio bimestral de un estudiante en un área, calculado a partir de sus notas por unidad didáctica.
          </p>
        </div>
        <Badge variant="secondary">Solo lectura</Badge>
      </div>

      <Card>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Estudiante</Label>
              <Select value={estudianteId} onValueChange={(v) => setEstudianteId(v ?? "")} itemToStringLabel={nombreEstudiante}>
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
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={areaId} onValueChange={(v) => setAreaId(v ?? "")} itemToStringLabel={nombreArea}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select value={periodoId} onValueChange={(v) => setPeriodoId(v ?? "")} itemToStringLabel={nombrePeriodo}>
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
          <div className="mt-4 flex justify-end">
            <Button onClick={onBuscar} disabled={!estudianteId || !areaId || !periodoId || loading}>
              <Search className="size-4" />
              {loading ? "Calculando..." : "Ver reporte"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {buscado && !reporte && (
        <p className="text-sm text-muted-foreground">No se pudo calcular el reporte.</p>
      )}

      {buscado && reporte && (
        <Card className="p-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Unidad 1</TableHead>
                  <TableHead>Unidad 2</TableHead>
                  <TableHead>Promedio Bimestral</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporte.cursos.map((c) => (
                  <TableRow key={c.cursoId}>
                    <TableCell className="font-medium">{nombreCurso(c.cursoId)}</TableCell>
                    {[1, 2].map((orden) => (
                      <TableCell key={orden} className="text-muted-foreground">
                        {formatearPromedio(c.promediosPorUnidad.find((p) => p.orden === orden)?.promedio ?? null)}
                      </TableCell>
                    ))}
                    <TableCell className="font-semibold">{formatearPromedio(c.promedioBimestral)}</TableCell>
                  </TableRow>
                ))}
                {reporte.cursos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No hay cursos registrados en esta área.
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/40">
                  <TableCell className="font-semibold">Promedio del Área</TableCell>
                  {[1, 2].map((orden) => (
                    <TableCell key={orden} className="font-semibold">
                      {formatearPromedio(reporte.promediosPorUnidad.find((p) => p.orden === orden)?.promedio ?? null)}
                    </TableCell>
                  ))}
                  <TableCell className="font-bold">{formatearPromedio(reporte.promedioBimestral)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
