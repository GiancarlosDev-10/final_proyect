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
import { NivelEducativo, ORDEN_NIVELES_EDUCATIVOS, ETIQUETAS_NIVEL_EDUCATIVO } from "@/config/constantes";
import { cn } from "@/lib/utils";
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
  return valor === null ? "—" : String(valor);
}

function numeroDeGrado(grado: string): number {
  const match = grado.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function TablaConsolidadoSeccion({ secciones, periodos, cursos, estudiantes }: Props) {
  const [nivelFiltro, setNivelFiltro] = useState<NivelEducativo | "">("");
  const [gradoFiltro, setGradoFiltro] = useState("");
  const [seccionId, setSeccionId] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [ordenUnidad, setOrdenUnidad] = useState<"1" | "2">("1");
  const [consolidado, setConsolidado] = useState<ConsolidadoSeccion | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const seccionesOrdenadas = useMemo(() => [...secciones].sort(compararSecciones), [secciones]);

  // Nivel → Grado → Sección: "1°" existe tanto en Primaria como en Secundaria,
  // así que sin el nivel de por medio elegir la sección correcta es ambiguo.
  const nivelesDisponibles = useMemo(() => {
    const niveles = new Set(secciones.map((s) => s.nivel));
    return ORDEN_NIVELES_EDUCATIVOS.filter((n) => niveles.has(n));
  }, [secciones]);

  const gradosDisponibles = useMemo(() => {
    const base = nivelFiltro ? secciones.filter((s) => s.nivel === nivelFiltro) : secciones;
    return [...new Set(base.map((s) => s.grado))].sort((a, b) => numeroDeGrado(a) - numeroDeGrado(b));
  }, [secciones, nivelFiltro]);

  const seccionesFiltradas = useMemo(() => {
    return seccionesOrdenadas.filter(
      (s) => (!nivelFiltro || s.nivel === nivelFiltro) && (!gradoFiltro || s.grado === gradoFiltro)
    );
  }, [seccionesOrdenadas, nivelFiltro, gradoFiltro]);

  function onCambiarNivel(valor: string) {
    setNivelFiltro(valor as NivelEducativo | "");
    setGradoFiltro("");
    setSeccionId("");
  }

  function onCambiarGrado(valor: string) {
    setGradoFiltro(valor);
    setSeccionId("");
  }

  function nombreSeccion(id: string) {
    const s = secciones.find((s) => s.id === id);
    return s ? `${s.grado} ${s.nombre}` : "(sección eliminada)";
  }

  function nombrePeriodo(id: string) {
    const p = periodos.find((p) => p.id === id);
    if (!p) return "(periodo eliminado)";
    return p.nombre.match(/\d+/)?.[0] ?? p.nombre;
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

  // Los cursos con nombre más corto van primero, para que el primer golpe de
  // vista (antes de hacer scroll horizontal) muestre encabezados cortos; los
  // de nombre largo (ej. "Desarrollo Personal, Ciudadanía y Cívica") quedan
  // al final, donde ensanchar su columna no empuja al resto de la tabla.
  const cursoIdsOrdenados = useMemo(() => {
    if (!consolidado) return [];
    return [...consolidado.cursoIds].sort((a, b) => nombreCurso(a).length - nombreCurso(b).length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consolidado, cursos]);

  const urlPdf =
    seccionId && periodoId
      ? `/api/reportes/consolidado-seccion/pdf?seccionId=${seccionId}&periodoId=${periodoId}&ordenUnidad=${ordenUnidad}`
      : null;
  const urlExcel =
    seccionId && periodoId
      ? `/api/reportes/consolidado-seccion/excel?seccionId=${seccionId}&periodoId=${periodoId}&ordenUnidad=${ordenUnidad}`
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-36 space-y-2">
              <Label>Nivel</Label>
              <Select
                value={nivelFiltro}
                onValueChange={(v) => onCambiarNivel(v ?? "")}
                itemToStringLabel={(n) => (n ? ETIQUETAS_NIVEL_EDUCATIVO[n as NivelEducativo] : "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  {nivelesDisponibles.map((n) => (
                    <SelectItem key={n} value={n}>{ETIQUETAS_NIVEL_EDUCATIVO[n]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28 space-y-2">
              <Label>Grado</Label>
              <Select value={gradoFiltro} onValueChange={(v) => onCambiarGrado(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Grado" />
                </SelectTrigger>
                <SelectContent>
                  {gradosDisponibles.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label>Sección</Label>
              <Select value={seccionId} onValueChange={(v) => setSeccionId(v ?? "")} itemToStringLabel={nombreSeccion}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesFiltradas.map((s) => (
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
                    <SelectItem key={p.id} value={p.id}>{nombrePeriodo(p.id)}</SelectItem>
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
            {/* self-center (en vez de heredar el items-end del contenedor)
                para que quede centrado con los Select, no pegado a su borde
                inferior; mt-1.5 lo baja un poco más porque self-center solo
                quedó un poco alto respecto al centro real de los Select. */}
            <div className="mt-1.5 flex h-8 flex-wrap items-center gap-2 self-center">
              {urlExcel && buscado && consolidado && (
                <a href={urlExcel} className={cn(buttonVariants({ variant: "outline" }), "h-8")}>
                  <FileDown className="size-4" />
                  Descargar Excel
                </a>
              )}
              {urlPdf && buscado && consolidado && (
                <a href={urlPdf} className={cn(buttonVariants({ variant: "outline" }), "h-8")}>
                  <FileDown className="size-4" />
                  Descargar PDF
                </a>
              )}
              <Button className="h-8" onClick={onBuscar} disabled={!seccionId || !periodoId || loading}>
                <Search className="size-4" />
                {loading ? "Calculando..." : "Ver consolidado"}
              </Button>
            </div>
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
                  {cursoIdsOrdenados.map((cursoId) => (
                    <TableHead key={cursoId} className="whitespace-nowrap text-center">{nombreCurso(cursoId)}</TableHead>
                  ))}
                  <TableHead className="text-center">Puntaje</TableHead>
                  <TableHead className="text-center">Orden de Mérito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filasOrdenadas.map((fila, indice) => {
                  const notaPorCurso = new Map(fila.notasPorCurso.map((n) => [n.cursoId, n]));
                  return (
                    <TableRow key={fila.estudianteId}>
                      <TableCell className="text-muted-foreground">{indice + 1}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{apellidoNombre(nombreEstudiante(fila.estudianteId))}</TableCell>
                      {cursoIdsOrdenados.map((cursoId) => (
                        <TableCell key={cursoId} className="text-center text-muted-foreground">
                          {formatearPromedio(notaPorCurso.get(cursoId)?.promedio ?? null)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">{formatearPromedio(fila.puntaje)}</TableCell>
                      <TableCell className="text-center font-semibold">{fila.ordenMerito ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
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
