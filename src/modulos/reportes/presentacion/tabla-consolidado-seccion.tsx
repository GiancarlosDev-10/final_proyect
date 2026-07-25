"use client";

import { useMemo, useState } from "react";
import { Search, FileDown } from "lucide-react";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { PeriodoProps } from "@/modulos/periodos/dominio/periodo";
import { CursoProps } from "@/modulos/cursos/dominio/curso";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { ConsolidadoSeccion } from "@/modulos/reportes/aplicacion/calcular-consolidado-seccion";
import { accionCalcularConsolidadoSeccion } from "@/modulos/reportes/presentacion/acciones";
import { apellidoNombre } from "@/compartido/lib/formatear-nombre";
import { compararSecciones } from "@/modulos/secciones/dominio/orden-secciones";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  secciones: SeccionProps[];
  periodos: PeriodoProps[];
  cursos: CursoProps[];
  estudiantes: EstudianteProps[];
}

function formatearPromedio(valor: number | null): string {
  return valor === null ? "—" : valor.toFixed(1);
}

export function TablaConsolidadoSeccion({ secciones, periodos, cursos, estudiantes }: Props) {
  const [seccionId, setSeccionId] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [ordenUnidad, setOrdenUnidad] = useState<"1" | "2">("1");
  const [consolidado, setConsolidado] = useState<ConsolidadoSeccion | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const seccionesOrdenadas = useMemo(() => [...secciones].sort(compararSecciones), [secciones]);

  function nombreSeccion(id: string) {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.anio}` : "(periodo eliminado)";
  }

  function nombreCurso(id: string) {
    return cursos.find((c) => c.id === id)?.nombre || "(curso eliminado)";
  }

  function nombreEstudiante(id: string) {
    return estudiantes.find((e) => e.id === id)?.nombreCompleto || "(estudiante eliminado)";
  }

  async function onBuscar() {
    if (!seccionId || !periodoId) return;
    setLoading(true);
    const resultado = await accionCalcularConsolidadoSeccion({
      seccionId,
      periodoId,
      anio: periodos.find((p) => p.id === periodoId)?.anio ?? new Date().getFullYear(),
      ordenUnidad: Number(ordenUnidad),
    });
    setConsolidado(resultado);
    setBuscado(true);
    setLoading(false);
  }

  const filasOrdenadas = useMemo(() => {
    if (!consolidado) return [];
    return [...consolidado.filas].sort((a, b) =>
      apellidoNombre(nombreEstudiante(a.estudianteId)).localeCompare(apellidoNombre(nombreEstudiante(b.estudianteId)), "es")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consolidado, estudiantes]);

  const urlPdf =
    seccionId && periodoId
      ? `/api/reportes/consolidado-seccion/pdf?seccionId=${seccionId}&periodoId=${periodoId}&ordenUnidad=${ordenUnidad}`
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label>Sección</Label>
              <Select value={seccionId} onValueChange={(v) => setSeccionId(v ?? "")} itemToStringLabel={nombreSeccion}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesOrdenadas.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.grado} {s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
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
            <div className="w-32 space-y-2">
              <Label>Unidad</Label>
              <Select value={ordenUnidad} onValueChange={(v) => setOrdenUnidad((v ?? "1") as "1" | "2")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Unidad 1</SelectItem>
                  <SelectItem value="2">Unidad 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {urlPdf && buscado && consolidado && (
              <a href={urlPdf} className={buttonVariants({ variant: "outline" })}>
                <FileDown className="size-4" />
                Descargar PDF
              </a>
            )}
            <Button onClick={onBuscar} disabled={!seccionId || !periodoId || loading}>
              <Search className="size-4" />
              {loading ? "Calculando..." : "Ver consolidado"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {buscado && !consolidado && (
        <p className="text-sm text-muted-foreground">No se pudo calcular el consolidado.</p>
      )}

      {buscado && consolidado && (
        <Card className="p-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">N°</TableHead>
                  <TableHead className="w-56">Apellidos y Nombres</TableHead>
                  {consolidado.cursoIds.map((cursoId) => (
                    <TableHead key={cursoId} className="whitespace-nowrap text-center">{nombreCurso(cursoId)}</TableHead>
                  ))}
                  <TableHead className="text-center">Puntaje</TableHead>
                  <TableHead className="text-center">Orden de Mérito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filasOrdenadas.map((fila, indice) => (
                  <TableRow key={fila.estudianteId}>
                    <TableCell className="text-muted-foreground">{indice + 1}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{apellidoNombre(nombreEstudiante(fila.estudianteId))}</TableCell>
                    {fila.notasPorCurso.map((n) => (
                      <TableCell key={n.cursoId} className="text-center text-muted-foreground">
                        {n.promedio === null ? "—" : `${formatearPromedio(n.promedio)} ${n.letra}`}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">{formatearPromedio(fila.puntaje)}</TableCell>
                    <TableCell className="text-center font-semibold">{fila.ordenMerito ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {filasOrdenadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={consolidado.cursoIds.length + 4} className="h-24 text-center text-muted-foreground">
                      No hay estudiantes matriculados en esta sección para el año del periodo elegido.
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
